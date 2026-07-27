-- HFC Hub — Fase 1 · P1 · Linha de base do plano
--
-- A planilha guarda em `PLANILHA MENSAL` uma linha de base recorrente: as
-- receitas e os custos que se repetem todo mês, com frequência e mês de
-- ocorrência. Isso não é o "realizado" de um mês — é o plano.
--
-- O schema da Fase 0 não fazia essa distinção: `monthly_record` +
-- `income_entry` + `expense_entry` tentavam ser as duas coisas. A partir daqui
-- `plan_*` é a linha de base e `monthly_record` é só o que aconteceu.

-- ── Enums ───────────────────────────────────────────────────────
do $$ begin
  create type public.plan_value_mode as enum ('nominal', 'real');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.entry_frequency as enum ('mensal', 'anual');
exception when duplicate_object then null; end $$;

-- Os quatro baldes do bloco ORÇAMENTO. `plan_expense` só usa fixo|extra —
-- parcela vem de `debt` e adicional é evento pontual de fatura.
do $$ begin
  create type public.budget_bucket as enum ('fixo', 'extra', 'parcela', 'adicional');
exception when duplicate_object then null; end $$;

-- Receitas que a planilha guarda já divididas por 12 (ver Achado 6). Aqui
-- guardamos o valor cheio; a marca serve para a tela saber recalcular sozinha.
do $$ begin
  create type public.derived_income as enum ('decimo_terceiro', 'ferias');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.plan_lifecycle as enum ('rascunho', 'ativo', 'arquivado');
exception when duplicate_object then null; end $$;

-- ── financial_plan ──────────────────────────────────────────────
-- Um cliente pode ter vários planos ao longo do tempo; só um fica `ativo`.
-- Refazer o raio-x cria uma versão nova e arquiva a anterior, preservando as
-- metas congeladas contra as quais os meses passados foram medidos.
create table if not exists public.financial_plan (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organization(id) on delete cascade,
  client_id           uuid not null references public.client(id) on delete cascade,
  versao              int  not null default 1,
  status              public.plan_lifecycle not null default 'rascunho',

  inicio              date not null,
  dia_referencia      int  not null default 1  check (dia_referencia between 1 and 31),
  dia_pagamento       int  check (dia_pagamento between 1 and 31),
  dia_fatura          int  check (dia_fatura between 1 and 31),

  -- Premissas: na planilha viviam soltas em PROJEÇÃO CURTA!K5:K6 e LONGA!K5:K6.
  modo_valor          public.plan_value_mode not null default 'nominal',
  juros_curto         numeric not null default 0.12,
  juros_longo         numeric not null default 0.10,
  inflacao            numeric not null default 0.05,
  juros_aposentadoria numeric not null default 0.04,
  idade_limite        int     not null default 101,
  meses_curto         int     not null default 36,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (client_id, versao)
);

-- Um único plano ativo por cliente. Índice parcial em vez de trigger: o banco
-- garante sozinho, sem código para manter.
create unique index if not exists financial_plan_um_ativo_idx
  on public.financial_plan (client_id) where status = 'ativo';

create index if not exists financial_plan_org_id_idx    on public.financial_plan (org_id);
create index if not exists financial_plan_client_id_idx on public.financial_plan (client_id);

-- ── plan_income ─────────────────────────────────────────────────
create table if not exists public.plan_income (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organization(id) on delete cascade,
  plan_id        uuid not null references public.financial_plan(id) on delete cascade,
  fonte          text not null,
  valor          numeric not null default 0,
  frequencia     public.entry_frequency not null default 'mensal',
  mes_ocorrencia int check (mes_ocorrencia between 1 and 12),
  derivado       public.derived_income,
  ordem          int not null default 0,
  -- Receita anual sem mês não tem como entrar na projeção.
  constraint plan_income_anual_tem_mes
    check (frequencia <> 'anual' or mes_ocorrencia is not null)
);

create index if not exists plan_income_org_id_idx  on public.plan_income (org_id);
create index if not exists plan_income_plan_id_idx on public.plan_income (plan_id);

-- ── plan_expense ────────────────────────────────────────────────
create table if not exists public.plan_expense (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organization(id) on delete cascade,
  plan_id        uuid not null references public.financial_plan(id) on delete cascade,
  categoria_id   uuid not null references public.budget_category(id) on delete restrict,
  descricao      text,
  valor          numeric not null default 0,
  frequencia     public.entry_frequency not null default 'mensal',
  mes_ocorrencia int check (mes_ocorrencia between 1 and 12),
  -- Controlabilidade, a segunda taxonomia (Achado 7). Na planilha eram os
  -- marcadores da coluna C: 1..12 = fixo, a..l = extra.
  bucket         public.budget_bucket not null default 'fixo',
  ordem          int not null default 0,
  constraint plan_expense_anual_tem_mes
    check (frequencia <> 'anual' or mes_ocorrencia is not null),
  constraint plan_expense_bucket_valido
    check (bucket in ('fixo', 'extra'))
);

create index if not exists plan_expense_org_id_idx       on public.plan_expense (org_id);
create index if not exists plan_expense_plan_id_idx      on public.plan_expense (plan_id);
create index if not exists plan_expense_categoria_id_idx on public.plan_expense (categoria_id);

-- ── plan_pension / plan_insurance ───────────────────────────────
-- Previdência tem coluna PRÓPRIA na projeção (PROJEÇÃO CURTA!H), e o seguro de
-- vida é subtraído à parte dentro de DESPESAS. Por isso não são plan_expense.
create table if not exists public.plan_pension (
  id      uuid primary key default gen_random_uuid(),
  org_id  uuid not null references public.organization(id) on delete cascade,
  plan_id uuid not null references public.financial_plan(id) on delete cascade,
  nome    text not null,
  valor   numeric not null default 0,
  ordem   int not null default 0
);

create table if not exists public.plan_insurance (
  id      uuid primary key default gen_random_uuid(),
  org_id  uuid not null references public.organization(id) on delete cascade,
  plan_id uuid not null references public.financial_plan(id) on delete cascade,
  nome    text not null,
  valor   numeric not null default 0,
  ordem   int not null default 0
);

create index if not exists plan_pension_org_id_idx    on public.plan_pension (org_id);
create index if not exists plan_pension_plan_id_idx   on public.plan_pension (plan_id);
create index if not exists plan_insurance_org_id_idx  on public.plan_insurance (org_id);
create index if not exists plan_insurance_plan_id_idx on public.plan_insurance (plan_id);

-- ── RLS ─────────────────────────────────────────────────────────
-- Mesmo padrão do 0002: staff da org lê, admin|planner escreve.
do $do$
declare
  t text;
  novas text[] := array[
    'financial_plan', 'plan_income', 'plan_expense', 'plan_pension', 'plan_insurance'
  ];
begin
  foreach t in array novas loop
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
