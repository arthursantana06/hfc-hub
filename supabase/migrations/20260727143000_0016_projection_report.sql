-- HFC Hub — Fase 1 · P1 · Projeções e relatório
--
-- `projection.serie` é cache: a verdade é a linha de base + as mudanças, e o
-- motor em TypeScript sabe recalcular a qualquer momento. A exceção é a série
-- CONGELADA — a `PROJEÇÃO ORIGINAL` da planilha, que são as metas do plano e
-- não podem ser recalculadas, senão o cliente é medido contra um alvo móvel.

do $$ begin
  create type public.report_metric as enum (
    'receitas', 'despesas', 'sobras', 'investimentos'
  );
exception when duplicate_object then null; end $$;

-- ── projection ──────────────────────────────────────────────────
alter table public.projection add column if not exists plan_id uuid references public.financial_plan(id) on delete cascade;
alter table public.projection add column if not exists congelada boolean not null default false;
alter table public.projection add column if not exists rotulo text;
alter table public.projection add column if not exists gerado_em timestamptz not null default now();
-- Impressão digital da entrada que gerou a série. Se a entrada mudou e a série
-- não, a tela sabe que está olhando um número velho — sem isso o cache mente
-- em silêncio, que é o pior modo de errar.
alter table public.projection add column if not exists premissas_hash text;

comment on column public.projection.congelada is
  'true = metas do plano (a PROJEÇÃO ORIGINAL da planilha). Nunca recalcular: o cliente é medido contra ela.';

create unique index if not exists projection_plan_horizonte_idx
  on public.projection (plan_id, horizonte, congelada)
  where plan_id is not null;

create index if not exists projection_plan_id_idx on public.projection (plan_id);

-- ── report ──────────────────────────────────────────────────────
alter table public.report add column if not exists plan_id uuid references public.financial_plan(id) on delete set null;
alter table public.report add column if not exists ref_mes date;
-- Placar congelado no fechamento: [{metrica, realizado, meta, atingido, estrelas}].
-- Guardado e não derivado porque as metas podem ser refeitas num plano novo, e
-- um relatório publicado precisa continuar dizendo o que dizia quando saiu.
alter table public.report add column if not exists placar jsonb;

create index if not exists report_plan_id_idx on public.report (plan_id);
create index if not exists report_ref_mes_idx on public.report (client_id, ref_mes);

-- ── report_directive ────────────────────────────────────────────
-- Os "Direcionamentos" da página 5 — escritos pelo planejador, não calculados.
create table if not exists public.report_directive (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organization(id) on delete cascade,
  report_id  uuid not null references public.report(id) on delete cascade,
  texto      text not null,
  ordem      int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists report_directive_org_id_idx    on public.report_directive (org_id);
create index if not exists report_directive_report_id_idx on public.report_directive (report_id);

-- ── RLS ─────────────────────────────────────────────────────────
alter table public.report_directive enable row level security;

create policy report_directive_sel on public.report_directive
  for select using (org_id = public.current_org_id() and public.is_staff());
create policy report_directive_ins on public.report_directive
  for insert with check (org_id = public.current_org_id() and public.can_write());
create policy report_directive_upd on public.report_directive
  for update
  using (org_id = public.current_org_id() and public.can_write())
  with check (org_id = public.current_org_id() and public.can_write());
create policy report_directive_del on public.report_directive
  for delete using (org_id = public.current_org_id() and public.can_write());
