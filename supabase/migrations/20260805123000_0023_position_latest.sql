-- HFC Hub — Fase A · A posição mais recente de cada ativo
--
-- "Quanto vale a carteira hoje" é o retrato mais recente de cada posição, e isso
-- é um `distinct on` que o PostgREST não sabe expressar. Sem esta visão, a tela
-- teria de baixar TODO o histórico de snapshots e reduzir no servidor de
-- aplicação — dez posições com dois anos de retratos são 240 linhas para
-- devolver 10, e a conta piora todo mês.
--
-- `security_invoker = true` é o ponto crítico: sem ele a visão roda com os
-- privilégios de quem a criou e passaria por cima da RLS de
-- `investment_position` e `position_snapshot`, entregando posição de cliente de
-- outra organização. Com ele, as políticas das tabelas de base continuam valendo
-- para quem consulta.
create or replace view public.position_latest
with (security_invoker = true) as
select
  p.id                as position_id,
  p.client_id         as client_id,
  p.account_id        as account_id,
  ultimo.data_referencia,
  ultimo.valor_bruto
from public.investment_position p
join lateral (
  select s.data_referencia, s.valor_bruto
  from public.position_snapshot s
  where s.position_id = p.id
  order by s.data_referencia desc
  limit 1
) ultimo on true;

comment on view public.position_latest is
  'Um retrato por posição: o mais recente. É a base de todo total de carteira. security_invoker garante que a RLS das tabelas de base continue valendo.';
