-- HFC Hub — Fase 0 · Aposenta o papel `assistant`
--
-- A consultoria opera com dois papéis internos: admin e planner. O `assistant`
-- (somente leitura) foi desenhado no kickoff mas não existe na operação real.
--
-- O papel `client` continua reservado, porém ele é do Portal do Cliente — outra
-- área do produto, com políticas próprias, numa fase futura. Não se convida
-- `client` por aqui.
--
-- O VALOR do enum continua existindo: Postgres não remove valor de enum, e
-- recriar o tipo exigiria derrubar as políticas e funções que o referenciam —
-- muito estrago para ganho cosmético. O que muda é que nenhum caminho do sistema
-- atribui `assistant`, e quem tivesse esse papel deixa de ser staff.

-- Ninguém deve estar com o papel hoje, mas se estiver, vira planner em vez de
-- perder o acesso silenciosamente quando is_staff() mudar logo abaixo.
update public.app_user set role = 'planner' where role = 'assistant';

-- staff passa a ser exatamente quem pode escrever — não há mais papel de leitura.
create or replace function public.is_staff()
returns boolean language sql stable set search_path = public as $fn$
  select public.current_user_role() in ('admin', 'planner');
$fn$;

-- Convite só libera papel interno atribuível.
alter table public.signup_invite drop constraint if exists signup_invite_role_interno;
alter table public.signup_invite add constraint signup_invite_role_interno
  check (role in ('admin', 'planner'));
