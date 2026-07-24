-- HFC Hub — Fase 0 · Schema inicial
-- Derivado do modelo de dados do plano mestre (docs/plano-arquitetura.html).
-- Princípio: `org_id` em TODAS as tabelas (multi-tenant desde o dia 1); tudo pendura em `client`.
-- Aplicar antes de 0002_rls.sql.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type public.user_role         as enum ('admin', 'planner', 'assistant', 'client');
create type public.risk_profile      as enum ('conservador', 'moderado', 'arrojado');
create type public.plan_status        as enum ('ativo', 'diagnostico', 'pendente');
create type public.budget_group       as enum ('fixo', 'pessoal', 'consultorio');
create type public.goal_term          as enum ('curto', 'longo');
create type public.projection_horizon as enum ('curta', 'longa');
create type public.investment_class   as enum ('renda_fixa', 'renda_variavel', 'previdencia');
create type public.report_status      as enum ('rascunho', 'publicado');
create type public.point_event_type   as enum ('meta', 'indicacao', 'engajamento', 'ajuste');
create type public.referral_status    as enum ('pendente', 'convertido', 'cancelado');
create type public.redemption_status  as enum ('solicitado', 'entregue', 'cancelado');
create type public.reward_tier        as enum ('bronze', 'prata', 'ouro');

-- ─────────────────────────────────────────────────────────────
-- Núcleo & CRM
-- ─────────────────────────────────────────────────────────────
create table public.organization (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  plano      text,
  created_at timestamptz not null default now()
);

-- Perfil da aplicação; id = auth.users.id (Supabase Auth é a fonte de credenciais).
create table public.app_user (
  id         uuid primary key references auth.users(id) on delete cascade,
  org_id     uuid not null references public.organization(id) on delete cascade,
  nome       text,
  email      text,
  role       public.user_role not null default 'planner',
  created_at timestamptz not null default now()
);

create table public.client (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organization(id) on delete cascade,
  planner_id   uuid references public.app_user(id) on delete set null,
  portal_user_id uuid references public.app_user(id) on delete set null, -- acesso do cliente (fase futura)
  nome         text not null,
  email        text,
  nascimento   date,
  profissao    text,
  risco        public.risk_profile,
  plano_status public.plan_status not null default 'diagnostico',
  pontos_total numeric not null default 0,  -- gamificação (Fase 7); mantido em cache
  tier         public.reward_tier not null default 'bronze',
  created_at   timestamptz not null default now()
);

create table public.meeting (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organization(id) on delete cascade,
  client_id     uuid references public.client(id) on delete cascade,
  planner_id    uuid references public.app_user(id) on delete set null,
  quando        timestamptz not null,
  gcal_event_id text,
  notas         text,
  created_at    timestamptz not null default now()
);

create table public.report (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organization(id) on delete cascade,
  client_id  uuid not null references public.client(id) on delete cascade,
  periodo    text not null,
  pdf_url    text,
  status     public.report_status not null default 'rascunho',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Planejamento · Fluxo & Orçamento
-- ─────────────────────────────────────────────────────────────
create table public.budget_category (
  id     uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organization(id) on delete cascade,
  nome   text not null,
  grupo  public.budget_group not null default 'pessoal',
  unique (org_id, nome)
);

create table public.monthly_record (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organization(id) on delete cascade,
  client_id   uuid not null references public.client(id) on delete cascade,
  ref_mes     date not null,               -- usar o dia 1 do mês de referência
  sobras_calc numeric,                      -- receitas - despesas (cache)
  created_at  timestamptz not null default now(),
  unique (client_id, ref_mes)
);

create table public.income_entry (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organization(id) on delete cascade,
  record_id uuid not null references public.monthly_record(id) on delete cascade,
  fonte     text not null,                  -- Salário, Plantões, ...
  valor     numeric not null default 0
);

create table public.expense_entry (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organization(id) on delete cascade,
  record_id    uuid not null references public.monthly_record(id) on delete cascade,
  categoria_id uuid references public.budget_category(id) on delete set null,
  descricao    text,
  valor        numeric not null default 0,
  fixo         boolean not null default false
);

create table public.budget_target (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organization(id) on delete cascade,
  client_id    uuid not null references public.client(id) on delete cascade,
  categoria_id uuid not null references public.budget_category(id) on delete cascade,
  ideal        numeric not null default 0,
  unique (client_id, categoria_id)
);

create table public.debt (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organization(id) on delete cascade,
  client_id uuid not null references public.client(id) on delete cascade,
  descricao text not null,
  total     numeric not null default 0,
  parcela   numeric
);

-- ─────────────────────────────────────────────────────────────
-- Planejamento · Patrimônio, Metas & Projeções
-- ─────────────────────────────────────────────────────────────
create table public.asset (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organization(id) on delete cascade,
  client_id uuid not null references public.client(id) on delete cascade,
  nome      text not null,
  valor     numeric not null default 0
);

create table public.liability (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organization(id) on delete cascade,
  client_id uuid not null references public.client(id) on delete cascade,
  nome      text not null,
  valor     numeric not null default 0
);

create table public.goal (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organization(id) on delete cascade,
  client_id  uuid not null references public.client(id) on delete cascade,
  titulo     text not null,
  prazo      public.goal_term not null default 'curto',
  alvo       numeric not null default 0,
  atual      numeric not null default 0,
  prioridade int not null default 3 check (prioridade between 1 and 5),  -- 1–5 estrelas
  created_at timestamptz not null default now()
);

create table public.timeline_event (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organization(id) on delete cascade,
  client_id uuid not null references public.client(id) on delete cascade,
  data      date not null,
  titulo    text not null
);

create table public.retirement_plan (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organization(id) on delete cascade,
  client_id      uuid not null references public.client(id) on delete cascade unique,  -- 1:1
  idade_atual    int,
  idade_alvo     int,
  renda_desejada numeric
);

create table public.projection (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organization(id) on delete cascade,
  client_id uuid not null references public.client(id) on delete cascade,
  horizonte public.projection_horizon not null,
  serie     jsonb
);

-- ─────────────────────────────────────────────────────────────
-- Investimentos & integração rendafixa
-- ─────────────────────────────────────────────────────────────
create table public.investment (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organization(id) on delete cascade,
  client_id uuid not null references public.client(id) on delete cascade,
  classe    public.investment_class not null,
  valor     numeric not null default 0
);

create table public.rendafixa_link (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organization(id) on delete cascade,
  investment_id uuid not null references public.investment(id) on delete cascade unique,
  external_id   text,
  synced_at     timestamptz
);

-- ─────────────────────────────────────────────────────────────
-- Gamificação & Indicações (Fase 7)
-- ─────────────────────────────────────────────────────────────
create table public.point_event (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organization(id) on delete cascade,
  client_id uuid not null references public.client(id) on delete cascade,
  tipo      public.point_event_type not null,
  pontos    int not null default 0,
  ref_id    uuid,                            -- ex.: goal.id que originou os pontos
  data      timestamptz not null default now()
);

create table public.referral (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organization(id) on delete cascade,
  client_id     uuid not null references public.client(id) on delete cascade,  -- indicador
  indicado_nome text not null,
  indicado_email text,
  status        public.referral_status not null default 'pendente',
  pontos_premio int not null default 0
);

create table public.reward (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organization(id) on delete cascade,
  nome         text not null,
  custo_pontos int not null default 0,
  tier_min     public.reward_tier not null default 'bronze',
  ativo        boolean not null default true
);

create table public.reward_redemption (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organization(id) on delete cascade,
  client_id uuid not null references public.client(id) on delete cascade,
  reward_id uuid not null references public.reward(id) on delete restrict,
  status    public.redemption_status not null default 'solicitado',
  data      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Índices (FKs mais consultadas)
-- ─────────────────────────────────────────────────────────────
create index on public.app_user (org_id);
create index on public.client (org_id);
create index on public.client (planner_id);
create index on public.meeting (org_id, client_id);
create index on public.report (client_id);
create index on public.monthly_record (client_id);
create index on public.income_entry (record_id);
create index on public.expense_entry (record_id);
create index on public.expense_entry (categoria_id);
create index on public.budget_target (client_id);
create index on public.debt (client_id);
create index on public.asset (client_id);
create index on public.liability (client_id);
create index on public.goal (client_id);
create index on public.timeline_event (client_id);
create index on public.projection (client_id);
create index on public.investment (client_id);
create index on public.point_event (client_id);
create index on public.referral (client_id);
create index on public.reward_redemption (client_id);
