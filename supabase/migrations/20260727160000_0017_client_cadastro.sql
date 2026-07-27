-- HFC Hub — Fase 1 · P3 · Cadastro do cliente
--
-- O cadastro acontece antes do plano: o planejador registra quem é a pessoa e
-- só depois monta o raio-x. `adesao` é a data em que o cliente entrou na
-- consultoria, e não se confunde com `financial_plan.inicio` — alguém pode
-- aderir em março e ter o primeiro plano fechado em agosto.

alter table public.client add column if not exists adesao date;
alter table public.client add column if not exists notas text;

comment on column public.client.adesao is
  'Data em que o cliente entrou na consultoria. Independe do início do plano.';
comment on column public.client.notas is
  'Anotações livres do planejador. Contexto que não cabe em campo estruturado.';
