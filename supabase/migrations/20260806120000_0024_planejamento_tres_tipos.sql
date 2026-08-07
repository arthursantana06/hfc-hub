-- HFC Hub — Remodelação do Planejamento · Fase 1 · Três tipos de planejamento
--
-- O modelo da empresa passa a ter três planejamentos por cliente:
--
--   pre_hfc  a foto de como o cliente vivia antes da consultoria
--   hfc      o plano traçado a partir da primeira conversa
--   real     a série mensal, editada a cada reunião de acompanhamento
--
-- Os dois primeiros são retratos únicos e sempre editáveis. O Real herda o
-- mecanismo de períodos que já existia: cada período é uma linha de
-- `financial_plan`, clonada e editada. A novidade é DE ONDE o período nasce —
-- do HFC, não do período anterior — com ajustes marcados como permanentes
-- carregados adiante.
--
-- Por que um enum em `financial_plan` e não três conjuntos de tabelas: a
-- leitura (`getPlanInput`), o motor de projeção e a Server Action genérica
-- funcionam por `plan_id` e não precisam saber o tipo. Tabelas novas
-- triplicariam RLS, esquema de formulário e DAL para dizer a mesma coisa.
--
-- Por que clone materializado e não overlay (período Real guardando só os
-- desvios do HFC): overlay cobra um merge em TODA leitura — grid, projeção,
-- síntese — e obriga o autosave a materializar linha virtual antes de gravar.
-- O clone cobra uma vez, na abertura do período, e deixa cada linha com id
-- próprio, que é o que uma célula editável precisa para gravar num round-trip.

-- ── Enums ───────────────────────────────────────────────────────
do $$ begin
  create type public.plan_kind as enum ('pre_hfc', 'hfc', 'real');
exception when duplicate_object then null; end $$;

-- O ciclo de vida de uma linha dentro de um período Real:
--   herdado     veio do HFC e não foi tocada — a abertura do próximo período
--               a recopia FRESCA do HFC (edições no HFC propagam)
--   mes         ajuste pontual daquele mês — não sobrevive à virada
--   permanente  ajuste que o planejador fixou — viaja para os períodos seguintes
-- Em pre_hfc e hfc a coluna fica no default e é ignorada.
do $$ begin
  create type public.row_persistence as enum ('herdado', 'mes', 'permanente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('credito', 'debito');
exception when duplicate_object then null; end $$;

-- ── financial_plan ganha o tipo ─────────────────────────────────
alter table public.financial_plan
  add column if not exists tipo public.plan_kind not null default 'real';

comment on column public.financial_plan.tipo is
  'Qual dos três planejamentos esta linha é. pre_hfc e hfc são retratos únicos e sempre ativos; só o real tem série de períodos e ciclo rascunho/ativo/arquivado.';

-- Índices refeitos para o novo eixo. Os dados de planejamento existentes foram
-- declarados descartáveis, então não há backfill a proteger — mas os drops são
-- todos idempotentes por precaução.
--
-- Versão numera dentro do tipo (o Real tem v1..vN; um HFC refeito também).
alter table public.financial_plan drop constraint if exists financial_plan_client_id_versao_key;
create unique index if not exists financial_plan_versao_idx
  on public.financial_plan (client_id, tipo, versao);

-- Dois retratos do mesmo mês continuariam ambíguos — mas só no Real, que é a
-- série temporal. Pré-HFC e HFC não retratam um mês, retratam um antes/depois.
drop index if exists public.financial_plan_periodo_idx;
create unique index if not exists financial_plan_periodo_idx
  on public.financial_plan (client_id, inicio) where tipo = 'real';

-- Um ativo por cliente vale só para o Real. Pré-HFC e HFC ficam ativos para
-- sempre (sempre editáveis, decisão de produto) e não podem disputar o índice.
drop index if exists public.financial_plan_um_ativo_idx;
create unique index if not exists financial_plan_um_ativo_idx
  on public.financial_plan (client_id) where status = 'ativo' and tipo = 'real';

-- E no máximo UM Pré-HFC e UM HFC por cliente: são retratos, não séries.
create unique index if not exists financial_plan_foto_unica_idx
  on public.financial_plan (client_id, tipo) where tipo <> 'real';

-- ── Linhagem nas tabelas filhas ─────────────────────────────────
-- Três colunas em cada tabela do plano:
--
--   base_id      de qual linha esta foi clonada (a linha do HFC, ou a do
--                período anterior quando o ajuste nasceu no Real). É o fio que
--                permite "recopiar fresco do HFC" e o diff linha a linha.
--                `on delete set null`: apagar a origem não pode apagar o clone.
--   persistencia ver o enum acima.
--   suprimido    tombstone. Remover uma linha HERDADA num período Real não a
--                apaga — marca suprimido, e a persistencia diz se a supressão
--                é do mês ou permanente. Delete físico apagaria junto a
--                informação "o planejador tirou isto de propósito", e a
--                abertura do período seguinte ressuscitaria a linha sem querer.
--                Em pre_hfc/hfc a remoção continua sendo delete físico.
--
-- Loop com SQL dinâmico em vez de 36 alter/comment repetidos: a lista é a
-- mesma TABELAS_DO_PLANO do código, e um nome fora da lista aqui seria um
-- esquecimento silencioso lá.
do $do$
declare
  t text;
begin
  foreach t in array array[
    'plan_income', 'plan_expense', 'plan_pension', 'plan_insurance',
    'plan_change', 'debt', 'goal', 'asset', 'liability', 'investment'
  ] loop
    execute format(
      'alter table public.%I
         add column if not exists base_id uuid references public.%I(id) on delete set null,
         add column if not exists persistencia public.row_persistence not null default ''herdado'',
         add column if not exists suprimido boolean not null default false',
      t, t
    );
    execute format(
      'comment on column public.%I.base_id is
         ''Linha de origem do clone (HFC ou período anterior). Nulo = linha original deste plano.''', t);
    execute format(
      'comment on column public.%I.suprimido is
         ''Tombstone do período Real: removida da tela, mantida no banco para a supressão sobreviver à abertura do próximo período. Toda leitura filtra suprimido = false.''', t);
  end loop;
end $do$;

-- ── plan_expense_category ───────────────────────────────────────
-- O bloco de categoria do grid de Despesa. Livre por planejamento — o
-- planejador digita o nome na hora — com autocomplete alimentado pelos nomes
-- já usados na organização (consulta distinct, sem tabela de catálogo).
--
-- Tabela própria em vez de `categoria text` na despesa porque renomear o bloco
-- é um update numa linha (não N), a ordem dos blocos é persistível, e a
-- linhagem do Real vale para o bloco também: uma categoria criada só num mês
-- é `mes`, uma nova permanente viaja adiante.
--
-- A taxonomia fixa `budget_category` NÃO morre: `expense_entry` (fechamento do
-- mês, fluxo antigo, intocado até a Fase 3) ainda a referencia.
create table if not exists public.plan_expense_category (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organization(id) on delete cascade,
  plan_id      uuid not null references public.financial_plan(id) on delete cascade,
  nome         text not null,
  ordem        int not null default 0,
  base_id      uuid references public.plan_expense_category(id) on delete set null,
  persistencia public.row_persistence not null default 'herdado',
  suprimido    boolean not null default false,
  created_at   timestamptz not null default now()
);

comment on table public.plan_expense_category is
  'Bloco de categoria do grid de Despesa. Escopado no plano: cada planejamento tem os seus, na ordem que o planejador quiser.';

create index if not exists plan_expense_category_org_id_idx  on public.plan_expense_category (org_id);
create index if not exists plan_expense_category_plan_id_idx on public.plan_expense_category (plan_id);

-- ── plan_expense sai da taxonomia fixa ──────────────────────────
-- A despesa passa a pendurar no bloco do plano, e ganha a dimensão
-- crédito/débito que a planilha nova pede. Os dados existentes usam a coluna
-- antiga e foram declarados descartáveis — apagar aqui é mais honesto do que
-- inventar um bloco "Migrado" que ninguém pediu.
delete from public.plan_expense;

drop index if exists public.plan_expense_categoria_id_idx;
alter table public.plan_expense drop column if exists categoria_id;

alter table public.plan_expense
  add column if not exists categoria_plan_id uuid not null
    references public.plan_expense_category(id) on delete cascade,
  add column if not exists pagamento public.payment_method not null default 'debito';

comment on column public.plan_expense.categoria_plan_id is
  'O bloco do grid a que a linha pertence. Cascade: apagar o bloco leva as linhas — no Real o bloco não é apagado, é suprimido.';
comment on column public.plan_expense.pagamento is
  'Como a despesa é paga. Crédito compõe a leitura de fatura; débito sai direto do fluxo.';

create index if not exists plan_expense_categoria_plan_id_idx
  on public.plan_expense (categoria_plan_id);

-- ── plan_card_purchase ──────────────────────────────────────────
-- A sub-tab Cartão: compras parceladas. A fatura projetada do mês N é a soma
-- de `valor_parcela` das compras com `inicio <= N < inicio + parcelas` — a
-- mesma mecânica de `parcelasEm` que o motor já usa para dívidas. Não existe
-- tabela de agenda de parcelas: seria 12 linhas derivadas de 3 colunas.
--
-- A compra vive no plano e é clonada por período como tudo o mais; uma compra
-- em 10x aberta em março continua aparecendo (herdada) até a última parcela.
create table if not exists public.plan_card_purchase (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organization(id) on delete cascade,
  plan_id       uuid not null references public.financial_plan(id) on delete cascade,
  descricao     text not null,
  cartao        text not null,
  valor_parcela numeric not null default 0,
  parcelas      int not null default 1 check (parcelas >= 1),
  inicio        date not null,
  ordem         int not null default 0,
  base_id       uuid references public.plan_card_purchase(id) on delete set null,
  persistencia  public.row_persistence not null default 'herdado',
  suprimido     boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.plan_card_purchase is
  'Compra parcelada no cartão dentro de um planejamento. A fatura do mês é derivada: soma das parcelas ativas naquele mês.';
comment on column public.plan_card_purchase.cartao is
  'Nome livre do cartão (Nubank, XP…). Livre em vez de tabela porque o cartão aqui é rótulo de agrupamento da fatura, não entidade com atributos.';
comment on column public.plan_card_purchase.inicio is
  'Mês da primeira parcela (dia 1). A última cai em inicio + (parcelas - 1) meses.';

create index if not exists plan_card_purchase_org_id_idx  on public.plan_card_purchase (org_id);
create index if not exists plan_card_purchase_plan_id_idx on public.plan_card_purchase (plan_id);

-- ── RLS ─────────────────────────────────────────────────────────
-- Mesmo padrão de todas as tabelas org-scoped.
alter table public.plan_expense_category enable row level security;

create policy plan_expense_category_sel on public.plan_expense_category
  for select using (org_id = public.current_org_id() and public.is_staff());
create policy plan_expense_category_ins on public.plan_expense_category
  for insert with check (org_id = public.current_org_id() and public.can_write());
create policy plan_expense_category_upd on public.plan_expense_category
  for update
  using (org_id = public.current_org_id() and public.can_write())
  with check (org_id = public.current_org_id() and public.can_write());
create policy plan_expense_category_del on public.plan_expense_category
  for delete using (org_id = public.current_org_id() and public.can_write());

alter table public.plan_card_purchase enable row level security;

create policy plan_card_purchase_sel on public.plan_card_purchase
  for select using (org_id = public.current_org_id() and public.is_staff());
create policy plan_card_purchase_ins on public.plan_card_purchase
  for insert with check (org_id = public.current_org_id() and public.can_write());
create policy plan_card_purchase_upd on public.plan_card_purchase
  for update
  using (org_id = public.current_org_id() and public.can_write())
  with check (org_id = public.current_org_id() and public.can_write());
create policy plan_card_purchase_del on public.plan_card_purchase
  for delete using (org_id = public.current_org_id() and public.can_write());
