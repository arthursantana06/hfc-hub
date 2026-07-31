-- HFC Hub — Fase 2 · P2 · Meses escolhidos e a dívida como passivo
--
-- Duas coisas que a tela de fluxo de caixa não conseguia dizer:
--
--   1. "esta despesa cai em janeiro, fevereiro e março" — o IPVA parcelado,
--      o material escolar de dois semestres, o seguro em duas vezes;
--   2. quanto ainda se DEVE de uma dívida, e não só quanto se paga por mês.
--
-- O item 2 é o que liga a dívida ao passivo: até aqui o saldo devedor precisava
-- ser redigitado como `liability` para aparecer no balanço, e as duas cópias
-- divergiam no primeiro mês em que alguém esquecia de atualizar uma delas.

-- ── Meses escolhidos ────────────────────────────────────────────
alter table public.plan_income  add column if not exists meses smallint[];
alter table public.plan_expense add column if not exists meses smallint[];

comment on column public.plan_income.meses is
  'Meses do ano (1–12) em que o valor entra, quando a frequência é "meses". O valor é o da parcela, não o total do ano.';
comment on column public.plan_expense.meses is
  'Meses do ano (1–12) em que o valor sai, quando a frequência é "meses". O valor é o da parcela, não o total do ano.';

-- A regra de preenchimento passa a depender da frequência inteira, e não só do
-- caso anual — por isso a restrição antiga sai em vez de ganhar um "or".
alter table public.plan_income  drop constraint if exists plan_income_anual_tem_mes;
alter table public.plan_expense drop constraint if exists plan_expense_anual_tem_mes;

alter table public.plan_income
  add constraint plan_income_ocorrencia_valida check (
    (frequencia = 'mensal')
    or (frequencia = 'anual' and mes_ocorrencia is not null)
    or (frequencia = 'meses' and meses is not null and array_length(meses, 1) > 0)
  );

alter table public.plan_expense
  add constraint plan_expense_ocorrencia_valida check (
    (frequencia = 'mensal')
    or (frequencia = 'anual' and mes_ocorrencia is not null)
    or (frequencia = 'meses' and meses is not null and array_length(meses, 1) > 0)
  );

-- Sem isto, um `meses = {0, 13}` passaria e o motor procuraria um mês que não
-- existe — falha silenciosa, do tipo que só aparece num total que não fecha.
alter table public.plan_income
  add constraint plan_income_meses_no_ano check (
    meses is null or meses <@ array[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]
  );

alter table public.plan_expense
  add constraint plan_expense_meses_no_ano check (
    meses is null or meses <@ array[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]
  );

-- ── A dívida é o passivo ────────────────────────────────────────
alter table public.debt add column if not exists saldo numeric;

comment on column public.debt.saldo is
  'Quanto ainda se deve hoje. Nulo = estimar por parcela × meses restantes. É este valor que entra no passivo do balanço — a dívida não é redigitada como liability.';
comment on column public.liability.nome is
  'Passivo sem parcela mensal (dívida com familiar, tributo em aberto). O que tem parcela vive em `debt`, e o balanço soma os dois.';
