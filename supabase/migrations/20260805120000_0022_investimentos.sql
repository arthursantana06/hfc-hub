-- HFC Hub — Fase A · Área de Investimentos
--
-- Até aqui o hub era um produto de Planejamento, e a única representação de
-- carteira era `investment`: um número digitado à mão para alimentar o
-- `patrimonioInicial` da projeção. Sem emissor, sem vencimento, sem custo de
-- aquisição e sem histórico — não havia como responder "quanto deste cliente
-- está num emissor que o FGC não cobre inteiro?".
--
-- Esta migração introduz o CRM de carteiras (conta → posição → retrato datado)
-- e o conceito de serviços contratados, que passa a governar a navegação.
--
-- `investment` NÃO é substituída. Ela continua sendo entrada de planejamento,
-- escopada em `plan_id` e clonada por período. A reconciliação entre as duas
-- (derivar o patrimônio inicial das posições reais) é assunto de outra fase;
-- fazer as duas coisas na mesma migração misturaria dois modelos que ainda
-- precisam conviver.
--
-- Nomes: `investment_position` e não `position` — `position` é col_name_keyword
-- no Postgres, e o par investment_account / investment_position também diz melhor
-- a que domínio as duas pertencem.

-- ── Serviços contratados ────────────────────────────────────────
-- Duas flags, não um enum de três valores: um quarto serviço (seguros, câmbio)
-- custa uma coluna, enquanto um enum custaria sete valores e um toque em todo
-- branch que hoje testa o tipo. O rótulo "Planejamento e Investimento" é
-- derivado na aplicação — guardá-lo seria uma terceira verdade sobre o mesmo fato.
alter table public.client
  add column if not exists tem_planejamento boolean not null default true,
  add column if not exists tem_investimento boolean not null default false;

comment on column public.client.tem_planejamento is
  'Contratou o serviço de Planejamento. Default true: todo cliente que existia antes desta migração é de planejamento, e a migração não deve exigir backfill manual.';
comment on column public.client.tem_investimento is
  'Contratou o serviço de Investimento. Governa a aba Investimentos do painel do cliente.';

-- ── Enums ───────────────────────────────────────────────────────
do $$ begin
  create type public.holder_type as enum ('pf', 'pj');
exception when duplicate_object then null; end $$;

-- `nao_aplica` cobre ação, FII e fundo: não têm indexador, e deixar a coluna
-- nula obrigaria toda leitura a tratar o nulo como um quarto caso.
do $$ begin
  create type public.position_indexer as enum (
    'cdi', 'ipca', 'prefixado', 'selic', 'nao_aplica'
  );
exception when duplicate_object then null; end $$;

-- A procedência da linha, não do valor. Ver o comentário de `origem`.
do $$ begin
  create type public.position_origin as enum ('manual', 'importado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.import_source as enum (
    'manual', 'eleva_csv', 'xp_csv', 'btg_csv', 'open_finance', 'api'
  );
exception when duplicate_object then null; end $$;

-- ── investment_account ──────────────────────────────────────────
-- O nível que faltava entre cliente e ativo. O mesmo cliente tem conta na XP e
-- no BTG, e a posição pertence a uma delas — sem isso, "onde está esse CDB?"
-- não tem resposta, e consolidar duas corretoras viraria soma de coisas soltas.
create table if not exists public.investment_account (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organization(id) on delete cascade,
  client_id    uuid not null references public.client(id) on delete cascade,
  apelido      text not null,
  instituicao  text not null,
  custodiante  text,
  numero       text,
  titular_tipo public.holder_type not null default 'pf',
  ativo        boolean not null default true,
  ordem        int not null default 0,
  created_at   timestamptz not null default now()
);

comment on table public.investment_account is
  'Conta de investimento do cliente numa instituição (XP, BTG, …). A posição pendura aqui, não no cliente.';
comment on column public.investment_account.titular_tipo is
  'PF ou PJ. O tratamento fiscal difere entre os dois, então o motor de IR precisa saber disso antes de existir.';
comment on column public.investment_account.ativo is
  'Conta encerrada fica com ativo = false em vez de ser apagada: as posições históricas dela continuam sendo parte da história do cliente.';

create index if not exists investment_account_org_id_idx    on public.investment_account (org_id);
create index if not exists investment_account_client_id_idx on public.investment_account (client_id);

-- ── investment_position ─────────────────────────────────────────
-- Os atributos estáveis do ativo. O VALOR não mora aqui — mora em
-- `position_snapshot`, sempre datado. Ver o comentário daquela tabela.
--
-- `client_id` é denormalizado de propósito, como já acontece em debt, goal,
-- asset e liability: sem ele, toda consulta "a carteira deste cliente" viraria
-- um join a mais só para chegar na conta.
create table if not exists public.investment_position (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organization(id) on delete cascade,
  account_id       uuid not null references public.investment_account(id) on delete cascade,
  client_id        uuid not null references public.client(id) on delete cascade,
  classe           public.investment_class not null,
  tipo_instrumento text,
  nome             text not null,
  emissor_nome     text,
  indexador        public.position_indexer not null default 'nao_aplica',
  taxa             numeric,
  quantidade       numeric,
  custo            numeric,
  data_aplicacao   date,
  vencimento       date,
  liquidez         text,
  isento_ir        boolean not null default false,
  coberto_fgc      boolean not null default false,
  origem           public.position_origin not null default 'manual',
  ordem            int not null default 0,
  created_at       timestamptz not null default now(),
  constraint investment_position_vencimento_apos_aplicacao
    check (vencimento is null or data_aplicacao is null or vencimento >= data_aplicacao)
);

comment on table public.investment_position is
  'Uma posição da carteira. Atributos estáveis apenas — o valor é sempre um position_snapshot datado.';
comment on column public.investment_position.classe is
  'Reusa o enum investment_class (renda_fixa | renda_variavel | previdencia) de propósito: é o mesmo eixo da alocação do patrimônio no planejamento e o mesmo da matriz de suitability. O detalhe fino vai em tipo_instrumento.';
comment on column public.investment_position.tipo_instrumento is
  'Texto livre: CDB, LCI, LCA, Tesouro IPCA+, debênture, FII, ação, fundo. Livre em vez de enum porque o catálogo real de produtos muda mais rápido do que uma migração.';
comment on column public.investment_position.taxa is
  'Na convenção do indexador: 110 = 110% do CDI; 6.2 = IPCA + 6,2%; 11.5 = 11,5% prefixado.';
comment on column public.investment_position.custo is
  'Custo de aquisição — a base do imposto. Nenhum agregador de Open Finance entrega este campo nem data_aplicacao, então ele nasce e permanece editável à mão.';
comment on column public.investment_position.origem is
  'Quem criou a linha. Um importador só ACRESCENTA snapshots; nunca altera atributos de uma posição com origem = manual. Sem essa regra, a primeira importação apagaria em silêncio o custo de aquisição que o planejador levou uma reunião para levantar.';

create index if not exists investment_position_org_id_idx     on public.investment_position (org_id);
create index if not exists investment_position_account_id_idx on public.investment_position (account_id);
create index if not exists investment_position_client_id_idx  on public.investment_position (client_id);
-- O calendário de vencimentos é consulta de primeira classe (próximos 90 dias,
-- por cliente e entre clientes), não relatório eventual.
create index if not exists investment_position_vencimento_idx
  on public.investment_position (vencimento) where vencimento is not null;

-- ── import_batch ────────────────────────────────────────────────
-- A costura de ingestão. Existe antes de existir qualquer importador porque é
-- ela que torna o lançamento manual e o importado a mesma coisa aos olhos do
-- resto do sistema: só muda a `fonte`.
create table if not exists public.import_batch (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organization(id) on delete cascade,
  fonte           public.import_source not null,
  arquivo_nome    text,
  data_referencia date,
  linhas_total    int,
  linhas_ok       int,
  criado_por      uuid references public.app_user(id) on delete set null,
  created_at      timestamptz not null default now()
);

comment on table public.import_batch is
  'Procedência de um lote de posições. Nenhum importador existe ainda; a tabela existe para que o dia em que existir não exija remodelagem.';

create index if not exists import_batch_org_id_idx on public.import_batch (org_id);

-- ── position_snapshot ───────────────────────────────────────────
-- O ponto sem volta desta modelagem. Se o valor morasse em `investment_position`
-- e fosse sobrescrito a cada atualização, o histórico seria perdido para sempre
-- e rentabilidade ficaria impossível de calcular depois. Separado, "tempo real"
-- vira série temporal — e a defasagem fica explícita na tela em vez de
-- implícita num número sem data.
create table if not exists public.position_snapshot (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organization(id) on delete cascade,
  position_id     uuid not null references public.investment_position(id) on delete cascade,
  data_referencia date not null,
  valor_bruto     numeric not null default 0,
  import_batch_id uuid references public.import_batch(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (position_id, data_referencia)
);

comment on table public.position_snapshot is
  'O valor de uma posição numa data. Dois retratos da mesma posição no mesmo dia seriam duas verdades sobre o mesmo instante — daí o unique.';
comment on column public.position_snapshot.import_batch_id is
  'Nulo = digitado por gente. O lançamento manual é caminho permanente, não provisório até a API existir.';

create index if not exists position_snapshot_org_id_idx on public.position_snapshot (org_id);
-- Ler "o valor mais recente de cada posição" é a consulta mais quente da área.
create index if not exists position_snapshot_recente_idx
  on public.position_snapshot (position_id, data_referencia desc);

-- ── RLS ─────────────────────────────────────────────────────────
-- Mesmo padrão das demais tabelas: leitura para staff da própria organização,
-- escrita para quem pode escrever (admin | planner).
alter table public.investment_account enable row level security;

create policy investment_account_sel on public.investment_account
  for select using (org_id = public.current_org_id() and public.is_staff());
create policy investment_account_ins on public.investment_account
  for insert with check (org_id = public.current_org_id() and public.can_write());
create policy investment_account_upd on public.investment_account
  for update
  using (org_id = public.current_org_id() and public.can_write())
  with check (org_id = public.current_org_id() and public.can_write());
create policy investment_account_del on public.investment_account
  for delete using (org_id = public.current_org_id() and public.can_write());

alter table public.investment_position enable row level security;

create policy investment_position_sel on public.investment_position
  for select using (org_id = public.current_org_id() and public.is_staff());
create policy investment_position_ins on public.investment_position
  for insert with check (org_id = public.current_org_id() and public.can_write());
create policy investment_position_upd on public.investment_position
  for update
  using (org_id = public.current_org_id() and public.can_write())
  with check (org_id = public.current_org_id() and public.can_write());
create policy investment_position_del on public.investment_position
  for delete using (org_id = public.current_org_id() and public.can_write());

alter table public.import_batch enable row level security;

create policy import_batch_sel on public.import_batch
  for select using (org_id = public.current_org_id() and public.is_staff());
create policy import_batch_ins on public.import_batch
  for insert with check (org_id = public.current_org_id() and public.can_write());
create policy import_batch_upd on public.import_batch
  for update
  using (org_id = public.current_org_id() and public.can_write())
  with check (org_id = public.current_org_id() and public.can_write());
create policy import_batch_del on public.import_batch
  for delete using (org_id = public.current_org_id() and public.can_write());

alter table public.position_snapshot enable row level security;

create policy position_snapshot_sel on public.position_snapshot
  for select using (org_id = public.current_org_id() and public.is_staff());
create policy position_snapshot_ins on public.position_snapshot
  for insert with check (org_id = public.current_org_id() and public.can_write());
create policy position_snapshot_upd on public.position_snapshot
  for update
  using (org_id = public.current_org_id() and public.can_write())
  with check (org_id = public.current_org_id() and public.can_write());
create policy position_snapshot_del on public.position_snapshot
  for delete using (org_id = public.current_org_id() and public.can_write());
