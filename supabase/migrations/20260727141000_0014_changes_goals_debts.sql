-- HFC Hub — Fase 1 · P1 · Mudanças, objetivos e dívidas
--
-- `plan_change` é a peça que faltava. Na planilha ela aparecia como duas
-- tabelas ("MUDANÇAS NO CURTO PRAZO" e "NO LONGO PRAZO") e uma aba inteira de
-- 242 linhas de SUMIFS ("objetivos planilha") que as expandia mês a mês.
-- A aba desaparece: expandir é trabalho do motor, não dado.

do $$ begin
  create type public.change_category as enum ('receita', 'despesa', 'divida');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.plan_horizon as enum ('curto', 'longo');
exception when duplicate_object then null; end $$;

-- ── plan_change ─────────────────────────────────────────────────
-- Convenção de sinal: `valor` é o efeito no fluxo de caixa a partir de
-- `inicio`. Positivo melhora, negativo piora — em qualquer categoria.
-- A planilha invertia sinais entre curto e longo prazo; aqui não.
create table if not exists public.plan_change (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organization(id) on delete cascade,
  plan_id    uuid not null references public.financial_plan(id) on delete cascade,
  titulo     text not null,
  valor      numeric not null default 0,
  categoria  public.change_category not null,
  horizonte  public.plan_horizon not null default 'curto',
  inicio     date not null,
  fim        date,                       -- nulo = vale para sempre
  parcelas   int,
  observacao text,                       -- vira a coluna OBSERVAÇÕES da projeção
  ordem      int not null default 0,
  created_at timestamptz not null default now(),
  constraint plan_change_fim_apos_inicio check (fim is null or fim >= inicio)
);

create index if not exists plan_change_org_id_idx  on public.plan_change (org_id);
create index if not exists plan_change_plan_id_idx on public.plan_change (plan_id);
create index if not exists plan_change_janela_idx  on public.plan_change (plan_id, inicio, fim);

-- ── goal ────────────────────────────────────────────────────────
-- `alvo` já existia e é exatamente o valor do objetivo — não duplicamos.
-- Curto prazo usa `data_alvo`; longo prazo usa `periodicidade_anos`
-- ("trocar de celular a cada 3 anos").
alter table public.goal add column if not exists plan_id uuid references public.financial_plan(id) on delete cascade;
alter table public.goal add column if not exists data_alvo date;
alter table public.goal add column if not exists periodicidade_anos int check (periodicidade_anos > 0);
alter table public.goal add column if not exists concluido boolean not null default false;
alter table public.goal add column if not exists ordem int not null default 0;

comment on column public.goal.data_alvo is
  'Objetivo de curto prazo: o mês em que o valor sai do patrimônio.';
comment on column public.goal.periodicidade_anos is
  'Objetivo de longo prazo: de quantos em quantos anos a compra se repete.';

create index if not exists goal_plan_id_idx on public.goal (plan_id);

-- ── debt ────────────────────────────────────────────────────────
-- Achado 1: na planilha a parcela é um valor mensal perpétuo, e o que a
-- encerra é uma linha de mudança somando o valor de volta. Aqui a dívida sabe
-- quando acaba, e o motor deriva o delta sozinho.
alter table public.debt add column if not exists plan_id uuid references public.financial_plan(id) on delete cascade;
alter table public.debt add column if not exists inicio date;
alter table public.debt add column if not exists fim date;
alter table public.debt add column if not exists parcelas_total int check (parcelas_total > 0);
alter table public.debt add column if not exists credor text;
alter table public.debt add column if not exists ordem int not null default 0;

alter table public.debt drop constraint if exists debt_fim_apos_inicio;
alter table public.debt add constraint debt_fim_apos_inicio
  check (fim is null or inicio is null or fim >= inicio);

comment on column public.debt.fim is
  'Último mês com parcela. Nulo = ainda sem data definida — a projeção a trata como perpétua e a tela deve alertar.';

create index if not exists debt_plan_id_idx on public.debt (plan_id);

-- ── asset / liability / investment ──────────────────────────────
alter table public.asset      add column if not exists ordem int not null default 0;
alter table public.liability  add column if not exists ordem int not null default 0;
alter table public.investment add column if not exists nome text;
alter table public.investment add column if not exists instituicao text;
alter table public.investment add column if not exists liquidez text;
alter table public.investment add column if not exists ordem int not null default 0;

-- ── retirement_plan ─────────────────────────────────────────────
-- `idade_atual` sai de cena: deriva de client.nascimento e não deve poder
-- divergir dela.
alter table public.retirement_plan add column if not exists plan_id uuid references public.financial_plan(id) on delete cascade;
alter table public.retirement_plan add column if not exists renda_inss numeric not null default 0;

comment on column public.retirement_plan.idade_atual is
  'Obsoleto — derivar de client.nascimento. Mantido só para não quebrar leituras antigas.';

-- ── RLS das tabelas novas ───────────────────────────────────────
alter table public.plan_change enable row level security;

create policy plan_change_sel on public.plan_change
  for select using (org_id = public.current_org_id() and public.is_staff());
create policy plan_change_ins on public.plan_change
  for insert with check (org_id = public.current_org_id() and public.can_write());
create policy plan_change_upd on public.plan_change
  for update
  using (org_id = public.current_org_id() and public.can_write())
  with check (org_id = public.current_org_id() and public.can_write());
create policy plan_change_del on public.plan_change
  for delete using (org_id = public.current_org_id() and public.can_write());
