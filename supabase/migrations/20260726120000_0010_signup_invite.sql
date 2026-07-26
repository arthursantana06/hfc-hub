-- HFC Hub — Fase 0 · Cadastro por convite
--
-- Até aqui o signup era aberto: `org_id` (e antes do 0008, `role`) vinham de
-- raw_user_meta_data, ou seja, de quem chamava /auth/v1/signup. Qualquer pessoa
-- podia criar conta e entrar na organização.
--
-- Agora a origem da verdade é a tabela `signup_invite`, que só um admin escreve:
-- o admin libera o e-mail e escolhe o papel; quem não tem convite ativo não cria
-- conta. `handle_new_user()` deixa de ler o metadata (exceto `nome`, que é só
-- preenchimento de conveniência) e passa a ler o convite.

create table public.signup_invite (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organization(id) on delete cascade,
  email         text not null,
  role          public.user_role not null default 'planner',
  convidado_por uuid references public.app_user(id) on delete set null,
  usado_em      timestamptz,
  usado_por     uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  -- `client` é papel do Portal (fase futura), não se convida por aqui.
  constraint signup_invite_role_interno check (role <> 'client')
);

-- Um e-mail pertence a uma organização só — a busca do trigger é por lower(email).
create unique index signup_invite_email_uidx on public.signup_invite (lower(email));
create index signup_invite_org_id_idx on public.signup_invite (org_id);

-- ── RLS: convite é assunto de admin ─────────────────────────────
alter table public.signup_invite enable row level security;

create policy signup_invite_admin_sel on public.signup_invite
  for select using (org_id = public.current_org_id() and public.current_user_role() = 'admin');
create policy signup_invite_admin_ins on public.signup_invite
  for insert with check (org_id = public.current_org_id() and public.current_user_role() = 'admin');
create policy signup_invite_admin_upd on public.signup_invite
  for update
  using (org_id = public.current_org_id() and public.current_user_role() = 'admin')
  with check (org_id = public.current_org_id() and public.current_user_role() = 'admin');
create policy signup_invite_admin_del on public.signup_invite
  for delete using (org_id = public.current_org_id() and public.current_user_role() = 'admin');

-- ── Provisionamento do perfil a partir do convite ───────────────
-- SECURITY DEFINER: roda como dono do schema, então enxerga signup_invite sem
-- passar pela RLS (o usuário que está se cadastrando ainda não tem papel algum).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare
  inv public.signup_invite;
begin
  select * into inv
    from public.signup_invite
   where lower(email) = lower(new.email)
     and usado_em is null
   limit 1;

  -- Sem convite ativo, o cadastro não acontece: a exceção aborta o insert em
  -- auth.users, então nem usuário órfão fica para trás.
  if inv.id is null then
    raise exception 'signup sem convite ativo para %', new.email
      using errcode = 'P0001';
  end if;

  insert into public.app_user (id, org_id, nome, email, role)
  values (
    new.id,
    inv.org_id,                                            -- do convite, não do metadata
    coalesce(nullif(btrim(new.raw_user_meta_data->>'nome'), ''), new.email),
    new.email,
    inv.role                                               -- do convite, não do metadata
  );

  update public.signup_invite
     set usado_em = now(), usado_por = new.id
   where id = inv.id;

  return new;
end $fn$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
