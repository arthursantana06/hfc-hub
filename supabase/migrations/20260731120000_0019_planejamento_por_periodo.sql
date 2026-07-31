-- HFC Hub — Fase 2 · P1 · Planejamento por período
--
-- O "Ponto de Partida" deixa de ser uma coisa à parte. Ele passa a ser o
-- primeiro retrato de uma série: cada período de acompanhamento (mês, bimestre
-- ou trimestre) é uma versão completa do plano, clonada da anterior e editada
-- durante a conversa com o cliente. Comparar duas versões é literalmente ver o
-- que mudou entre duas reuniões — que é o acompanhamento que a planilha nunca
-- conseguiu dar.
--
-- Nada de coluna `periodo`: o período de uma versão JÁ é `financial_plan.inicio`,
-- o primeiro mês que ela projeta. Duplicar isso criaria duas verdades sobre a
-- mesma data, e uma delas ficaria velha.

do $$ begin
  create type public.plan_cadence as enum ('mensal', 'bimestral', 'trimestral');
exception when duplicate_object then null; end $$;

alter table public.financial_plan
  add column if not exists cadencia public.plan_cadence not null default 'mensal';

comment on column public.financial_plan.cadencia is
  'De quanto em quanto tempo o planejador revisita o plano com o cliente. Define o passo entre uma versão e a próxima.';
comment on column public.financial_plan.inicio is
  'Primeiro mês projetado — e, desde a Fase 2, o período que esta versão retrata. A versão 1 é o Ponto de Partida.';

-- Duas versões para o mesmo período seriam dois retratos do mesmo instante:
-- o planejador não saberia qual abrir.
create unique index if not exists financial_plan_periodo_idx
  on public.financial_plan (client_id, inicio);

-- ── O balanço também pertence ao período ────────────────────────
-- Sem `plan_id`, ativos, passivos e carteira seriam os mesmos em todos os
-- períodos, e o patrimônio nunca contaria a história da evolução — que é
-- exatamente o que se quer acompanhar.
alter table public.asset      add column if not exists plan_id uuid references public.financial_plan(id) on delete cascade;
alter table public.liability  add column if not exists plan_id uuid references public.financial_plan(id) on delete cascade;
alter table public.investment add column if not exists plan_id uuid references public.financial_plan(id) on delete cascade;

-- O que já existe pertence ao plano ativo do cliente. Linhas de cliente sem
-- plano nenhum ficam com `plan_id` nulo e continuam legíveis — não se apaga
-- dado do planejador por causa de uma migração.
update public.asset a
   set plan_id = p.id
  from public.financial_plan p
 where p.client_id = a.client_id and p.status = 'ativo' and a.plan_id is null;

update public.liability l
   set plan_id = p.id
  from public.financial_plan p
 where p.client_id = l.client_id and p.status = 'ativo' and l.plan_id is null;

update public.investment i
   set plan_id = p.id
  from public.financial_plan p
 where p.client_id = i.client_id and p.status = 'ativo' and i.plan_id is null;

create index if not exists asset_plan_id_idx      on public.asset (plan_id);
create index if not exists liability_plan_id_idx  on public.liability (plan_id);
create index if not exists investment_plan_id_idx on public.investment (plan_id);
