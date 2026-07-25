-- HFC Hub — Fase 0 · Row-Level Security
-- Isolamento por organização (org_id) + papéis internos.
-- Regra Fase 0:
--   • staff (admin | planner | assistant) enxerga os dados da SUA organização;
--   • escrita permitida a admin | planner (assistente é leitura por padrão — risco "mínimo de dados no assistente");
--   • papel `client` (portal) NÃO tem acesso nesta fase — políticas do portal virão numa fase futura.
-- As funções auxiliares são SECURITY DEFINER para ler app_user sem recursão de RLS.

-- ─────────────────────────────────────────────────────────────
-- Funções auxiliares
-- ─────────────────────────────────────────────────────────────
create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $fn$
  select org_id from public.app_user where id = auth.uid();
$fn$;

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $fn$
  select role from public.app_user where id = auth.uid();
$fn$;

create or replace function public.is_staff()
returns boolean language sql stable set search_path = public as $fn$
  select public.current_user_role() in ('admin', 'planner', 'assistant');
$fn$;

create or replace function public.can_write()
returns boolean language sql stable set search_path = public as $fn$
  select public.current_user_role() in ('admin', 'planner');
$fn$;

-- ─────────────────────────────────────────────────────────────
-- organization: staff lê a própria org; apenas admin altera
-- ─────────────────────────────────────────────────────────────
alter table public.organization enable row level security;

create policy org_select on public.organization
  for select using (id = public.current_org_id() and public.is_staff());

create policy org_admin_write on public.organization
  for all
  using (id = public.current_org_id() and public.current_user_role() = 'admin')
  with check (id = public.current_org_id() and public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- app_user: cada um lê a si mesmo; staff lê membros da org; só admin gerencia
-- ─────────────────────────────────────────────────────────────
alter table public.app_user enable row level security;

create policy app_user_select_self on public.app_user
  for select using (id = auth.uid());

create policy app_user_select_org on public.app_user
  for select using (org_id = public.current_org_id() and public.is_staff());

create policy app_user_admin_write on public.app_user
  for all
  using (org_id = public.current_org_id() and public.current_user_role() = 'admin')
  with check (org_id = public.current_org_id() and public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- Demais tabelas: política uniforme org-scoped via loop
--   SELECT  → staff da org
--   INSERT/UPDATE/DELETE → admin|planner da org
-- ─────────────────────────────────────────────────────────────
do $do$
declare
  t text;
  org_tables text[] := array[
    'client', 'meeting', 'report',
    'budget_category', 'monthly_record', 'income_entry', 'expense_entry',
    'budget_target', 'debt', 'asset', 'liability', 'goal', 'timeline_event',
    'retirement_plan', 'projection',
    'investment', 'rendafixa_link',
    'point_event', 'referral', 'reward', 'reward_redemption'
  ];
begin
  foreach t in array org_tables loop
    execute format('alter table public.%I enable row level security;', t);

    execute format($f$
      create policy %1$s_sel on public.%1$I
        for select using (org_id = public.current_org_id() and public.is_staff());
    $f$, t);

    execute format($f$
      create policy %1$s_ins on public.%1$I
        for insert with check (org_id = public.current_org_id() and public.can_write());
    $f$, t);

    execute format($f$
      create policy %1$s_upd on public.%1$I
        for update
        using (org_id = public.current_org_id() and public.can_write())
        with check (org_id = public.current_org_id() and public.can_write());
    $f$, t);

    execute format($f$
      create policy %1$s_del on public.%1$I
        for delete using (org_id = public.current_org_id() and public.can_write());
    $f$, t);
  end loop;
end $do$;

-- ─────────────────────────────────────────────────────────────
-- Provisionamento de perfil no signup
-- Cria o app_user a partir dos metadados do Supabase Auth.
--   raw_user_meta_data->>'org_id'  (uuid da organização)
--   raw_user_meta_data->>'role'    (default 'planner')
--   raw_user_meta_data->>'nome'
-- Signups sem org_id NÃO criam perfil (evita usuário órfão sem tenant).
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if (new.raw_user_meta_data ? 'org_id') then
    insert into public.app_user (id, org_id, nome, email, role)
    values (
      new.id,
      (new.raw_user_meta_data->>'org_id')::uuid,
      coalesce(new.raw_user_meta_data->>'nome', new.email),
      new.email,
      coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'planner')
    );
  end if;
  return new;
end $fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
