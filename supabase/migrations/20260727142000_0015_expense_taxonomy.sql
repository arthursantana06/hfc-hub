-- HFC Hub — Fase 1 · P1 · Taxonomia de gastos e faturas
--
-- Achado 7: três taxonomias convivem de propósito.
--   1. natureza          → budget_category.grupo (esta migração)
--   2. controlabilidade  → plan_expense.bucket   (0013)
--   3. categoria de fatura → card_statement.categoria (esta migração)
--
-- O enum `budget_group` da Fase 0 (fixo|pessoal|consultorio) misturava natureza
-- com controlabilidade e não batia com a planilha. Substituído pelos 6 grupos
-- reais de `PLANILHA MENSAL`.

do $$ begin
  create type public.expense_group as enum (
    'casa', 'saude', 'transporte', 'lazer', 'filhos_pets', 'outros'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.card_category as enum (
    'alimentacao', 'transporte', 'compras', 'saude', 'vestuario', 'lazer', 'outros'
  );
exception when duplicate_object then null; end $$;

-- ── budget_category ─────────────────────────────────────────────
-- As 7 categorias da Fase 0 eram placeholders (nada as referencia). Trocá-las
-- pela taxonomia real é mais honesto do que tentar mapear uma na outra.
delete from public.budget_category;

alter table public.budget_category
  alter column grupo drop default,
  alter column grupo type public.expense_group using 'outros'::public.expense_group,
  alter column grupo set default 'outros'::public.expense_group;

alter table public.budget_category add column if not exists ordem int not null default 0;
-- `is_padrao` distingue o catálogo da consultoria das linhas que um planejador
-- cria para um cliente específico ("Mensalidade do clube"). Só as padrão aparecem
-- como sugestão ao montar um raio-x novo.
alter table public.budget_category add column if not exists is_padrao boolean not null default false;

drop type if exists public.budget_group;

-- Catálogo padrão — a ordem é a da planilha, para que a tela de fluxo de caixa
-- possa ser lida lado a lado com ela durante a migração dos clientes.
insert into public.budget_category (org_id, nome, grupo, ordem, is_padrao) values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Aluguel',                    'casa',        10, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Condomínio',                 'casa',        20, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'IPTU',                       'casa',        30, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Água/Luz/Gás',               'casa',        40, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Internet/Tv/Celular',        'casa',        50, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Plataformas de Streaming',   'casa',        60, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Supermercado/Feira/Padaria', 'casa',        70, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Secretária/Jardineiro',      'casa',        80, true),

  ('00000000-0000-4000-8000-000000000001'::uuid, 'Plano de Saúde',             'saude',      110, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Psicólogo/Médicos',          'saude',      120, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Fármacia',                   'saude',      130, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Salão/Barbearia',            'saude',      140, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Academia/Personal/Nutri',    'saude',      150, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Estética/Produtos',          'saude',      160, true),

  ('00000000-0000-4000-8000-000000000001'::uuid, 'Revisão',                    'transporte', 210, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'IPVA',                       'transporte', 220, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Gasolina',                   'transporte', 230, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Seguro',                     'transporte', 240, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Lavagem e manutenção',       'transporte', 250, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Uber',                       'transporte', 260, true),

  ('00000000-0000-4000-8000-000000000001'::uuid, 'Saídas',                     'lazer',      310, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Restaurantes',               'lazer',      320, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Ifood',                      'lazer',      330, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Cursos',                     'lazer',      340, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Hobbies',                    'lazer',      350, true),

  ('00000000-0000-4000-8000-000000000001'::uuid, 'Escola',                     'filhos_pets', 410, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Esportes & Artes',           'filhos_pets', 420, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Idiomas',                    'filhos_pets', 430, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Mesada',                     'filhos_pets', 440, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Pet',                        'filhos_pets', 450, true),

  ('00000000-0000-4000-8000-000000000001'::uuid, 'Parcela anual imóvel',       'outros',     510, true),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Extra',                      'outros',     520, true)
on conflict (org_id, nome) do nothing;

-- ── card_statement ──────────────────────────────────────────────
-- A matriz cartão × categoria de fatura da aba ORÇAMENTO (E38:J48). Categoria
-- aqui é a que o banco devolve, não a do plano — por isso enum próprio.
create table if not exists public.card_statement (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.organization(id) on delete cascade,
  record_id uuid not null references public.monthly_record(id) on delete cascade,
  cartao    text not null,
  categoria public.card_category not null,
  valor     numeric not null default 0,
  unique (record_id, cartao, categoria)
);

create index if not exists card_statement_org_id_idx    on public.card_statement (org_id);
create index if not exists card_statement_record_id_idx on public.card_statement (record_id);

-- ── monthly_record / expense_entry: o lado do realizado ─────────
alter table public.monthly_record add column if not exists plan_id uuid references public.financial_plan(id) on delete set null;
alter table public.monthly_record add column if not exists fechado_em timestamptz;
alter table public.monthly_record add column if not exists observacao text;

comment on column public.monthly_record.fechado_em is
  'Preenchido no fechamento do mês. A partir daí o realizado não deve mais mudar — é contra ele que o relatório foi gerado.';

alter table public.expense_entry add column if not exists bucket public.budget_bucket not null default 'fixo';

create index if not exists monthly_record_plan_id_idx on public.monthly_record (plan_id);

-- ── RLS ─────────────────────────────────────────────────────────
alter table public.card_statement enable row level security;

create policy card_statement_sel on public.card_statement
  for select using (org_id = public.current_org_id() and public.is_staff());
create policy card_statement_ins on public.card_statement
  for insert with check (org_id = public.current_org_id() and public.can_write());
create policy card_statement_upd on public.card_statement
  for update
  using (org_id = public.current_org_id() and public.can_write())
  with check (org_id = public.current_org_id() and public.can_write());
create policy card_statement_del on public.card_statement
  for delete using (org_id = public.current_org_id() and public.can_write());
