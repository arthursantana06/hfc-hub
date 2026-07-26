-- HFC Hub — Smoke test das políticas de RLS (Fase 0)
--
-- Roda inteiro dentro de uma transação e termina em ROLLBACK: não deixa
-- resíduo no banco. Seguro rodar contra o projeto de dev.
--
-- Como rodar: cole no SQL Editor do Supabase, ou via MCP (execute_sql).
-- Todas as 27 linhas do resultado devem sair como PASS.
--
-- ATENÇÃO ao escrever novos casos: `set local request.jwt.claims` PERSISTE
-- entre blocos da mesma transação. Trocar apenas o `role` para anon sem
-- limpar os claims faz o teste rodar com a identidade do usuário anterior —
-- e dá um resultado falso.

begin;

-- ── Fixtures: duas orgs, quatro papéis, um cliente em cada org ──
insert into public.organization (id, name) values
  ('00000000-0000-4000-8000-0000000000aa','Org A'),
  ('00000000-0000-4000-8000-0000000000bb','Org B');

-- A partir do 0010 quem cria o perfil é handle_new_user(), lendo o convite.
-- Todo auth.users precisa de convite ativo: sem ele a função aborta o insert.
insert into public.signup_invite (org_id, email, role) values
  ('00000000-0000-4000-8000-0000000000aa','planner.a@test.local','planner'),
  ('00000000-0000-4000-8000-0000000000aa','assist.a@test.local','planner'),
  ('00000000-0000-4000-8000-0000000000bb','planner.b@test.local','planner'),
  ('00000000-0000-4000-8000-0000000000aa','admin.a@test.local','admin'),
  ('00000000-0000-4000-8000-0000000000aa','novo@test.local','planner'),
  ('00000000-0000-4000-8000-0000000000aa','x@test.local','planner');

insert into auth.users (id, instance_id, aud, role, email) values
  ('11111111-1111-4111-8111-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','planner.a@test.local'),
  ('11111111-1111-4111-8111-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','assist.a@test.local'),
  ('11111111-1111-4111-8111-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','planner.b@test.local'),
  ('11111111-1111-4111-8111-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin.a@test.local'),
  ('11111111-1111-4111-8111-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','novo@test.local'),
  ('11111111-1111-4111-8111-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','x@test.local');

-- Nomes legíveis e o papel legado do 002 (aposentado no 0011 — guarda de regressão).
update public.app_user set nome = 'Planner A' where id = '11111111-1111-4111-8111-000000000001';
update public.app_user set nome = 'Assist A', role = 'assistant' where id = '11111111-1111-4111-8111-000000000002';
update public.app_user set nome = 'Planner B' where id = '11111111-1111-4111-8111-000000000003';
update public.app_user set nome = 'Admin A'   where id = '11111111-1111-4111-8111-000000000004';

-- 005 e 006 ficam com conta no Auth mas SEM perfil — é o estado de quem teve o
-- app_user removido por um admin, e o que os casos de "sem perfil" exercitam.
delete from public.app_user
 where id in ('11111111-1111-4111-8111-000000000005','11111111-1111-4111-8111-000000000006');

insert into public.client (id, org_id, nome) values
  ('22222222-2222-4222-8222-00000000000a','00000000-0000-4000-8000-0000000000aa','Cliente da A'),
  ('22222222-2222-4222-8222-00000000000b','00000000-0000-4000-8000-0000000000bb','Cliente da B');

create temp table r (ord serial, teste text, esperado text, obtido text);
grant all on table r to authenticated, anon;
grant usage, select on all sequences in schema pg_temp to authenticated, anon;

-- O trigger criou perfil para os 6 convidados; 2 foram removidos acima.
-- Conta só as orgs de fixture: o banco de dev tem usuários reais fora delas.
insert into r (teste,esperado,obtido)
select 'trigger cria perfil a partir do convite','4',count(*)::text
  from public.app_user
 where org_id in ('00000000-0000-4000-8000-0000000000aa',
                  '00000000-0000-4000-8000-0000000000bb');

-- Sem convite ativo, o cadastro é abortado — nem usuário no Auth sobra.
do $t$ begin
  insert into auth.users (id, instance_id, aud, role, email) values
    ('11111111-1111-4111-8111-000000000007','00000000-0000-0000-0000-000000000000',
     'authenticated','authenticated','sem.convite@test.local');
  insert into r (teste,esperado,obtido) values ('signup sem convite','BLOQUEADO','PASSOU (falha!)');
exception when others then
  insert into r (teste,esperado,obtido) values ('signup sem convite','BLOQUEADO','BLOQUEADO');
end $t$;

-- Convite usado não serve de novo (usado_em preenchido pelo trigger).
do $t$ begin
  insert into auth.users (id, instance_id, aud, role, email) values
    ('11111111-1111-4111-8111-000000000008','00000000-0000-0000-0000-000000000000',
     'authenticated','authenticated','planner.a@test.local');
  insert into r (teste,esperado,obtido) values ('convite ja usado','BLOQUEADO','PASSOU (falha!)');
exception when others then
  insert into r (teste,esperado,obtido) values ('convite ja usado','BLOQUEADO','BLOQUEADO');
end $t$;

-- ── Planner da Org A ────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-000000000001","role":"authenticated"}';

insert into r (teste, esperado, obtido)
select 'planner A ve apenas clientes da A', 'Cliente da A', coalesce(string_agg(nome,','),'<nada>') from public.client;
insert into r (teste, esperado, obtido)
select 'planner A ve apenas a propria org', 'Org A', coalesce(string_agg(name,','),'<nada>') from public.organization;

insert into public.client (org_id, nome) values ('00000000-0000-4000-8000-0000000000aa','Novo da A');
insert into r (teste, esperado, obtido) values ('planner A insere na propria org','ok','ok');

do $t$ begin
  insert into public.client (org_id, nome) values ('00000000-0000-4000-8000-0000000000bb','Invasor');
  insert into r (teste,esperado,obtido) values ('planner A insere na org B','BLOQUEADO','PASSOU (falha!)');
exception when others then
  insert into r (teste,esperado,obtido) values ('planner A insere na org B','BLOQUEADO','BLOQUEADO');
end $t$;

-- Cross-tenant em UPDATE/DELETE não gera erro: as linhas simplesmente não existem
-- para este usuário, então a contagem de afetadas deve ser zero.
with u as (update public.client set nome='hackeado' where id='22222222-2222-4222-8222-00000000000b' returning 1)
insert into r (teste,esperado,obtido) select 'planner A altera cliente da B','0 linhas',count(*)::text||' linhas' from u;
with d as (delete from public.client where id='22222222-2222-4222-8222-00000000000b' returning 1)
insert into r (teste,esperado,obtido) select 'planner A deleta cliente da B','0 linhas',count(*)::text||' linhas' from d;

insert into r (teste,esperado,obtido)
select 'planner A ve membros da propria org','3',count(*)::text from public.app_user;

do $t$ begin
  update public.organization set name='renomeada por planner' where id='00000000-0000-4000-8000-0000000000aa';
  insert into r (teste,esperado,obtido)
  select 'planner (nao-admin) renomeia a org','sem efeito',
    case when exists (select 1 from public.organization where name='renomeada por planner')
         then 'RENOMEOU (falha!)' else 'sem efeito' end;
exception when others then
  insert into r (teste,esperado,obtido) values ('planner (nao-admin) renomeia a org','sem efeito','sem efeito');
end $t$;
reset role;

-- ── Admin da Org A (políticas ins/upd/del separadas — ver 0007) ──
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-000000000004","role":"authenticated"}';

insert into r (teste,esperado,obtido)
select 'admin A ve a propria org','Org A',coalesce(string_agg(name,','),'<nada>') from public.organization;

update public.organization set plano='premium' where id='00000000-0000-4000-8000-0000000000aa';
insert into r (teste,esperado,obtido)
select 'admin A altera a propria org','premium',coalesce(max(plano),'<nada>')
from public.organization where id='00000000-0000-4000-8000-0000000000aa';

with u as (update public.organization set plano='invadido' where id='00000000-0000-4000-8000-0000000000bb' returning 1)
insert into r (teste,esperado,obtido) select 'admin A altera a org B','0 linhas',count(*)::text||' linhas' from u;

insert into public.app_user (id, org_id, nome, email, role)
values ('11111111-1111-4111-8111-000000000005','00000000-0000-4000-8000-0000000000aa','Novo membro','novo@test.local','planner');
insert into r (teste,esperado,obtido) values ('admin A cria membro na propria org','ok','ok');

do $t$ begin
  insert into public.app_user (id, org_id, nome, email, role)
  values ('11111111-1111-4111-8111-000000000006','00000000-0000-4000-8000-0000000000bb','Intruso','x@test.local','admin');
  insert into r (teste,esperado,obtido) values ('admin A cria membro na org B','BLOQUEADO','PASSOU (falha!)');
exception when others then
  insert into r (teste,esperado,obtido) values ('admin A cria membro na org B','BLOQUEADO','BLOQUEADO');
end $t$;
reset role;

-- ── Assistant: papel aposentado no 0011, não é mais staff ───────
-- Guarda de regressão: se alguém voltar 'assistant' para is_staff(), quebra aqui.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-000000000002","role":"authenticated"}';

insert into r (teste,esperado,obtido)
select 'assistant nao le clientes','0',count(*)::text from public.client;

do $t$ begin
  insert into public.client (org_id, nome) values ('00000000-0000-4000-8000-0000000000aa','Assistente escreveu');
  insert into r (teste,esperado,obtido) values ('assistant tenta inserir','BLOQUEADO','PASSOU (falha!)');
exception when others then
  insert into r (teste,esperado,obtido) values ('assistant tenta inserir','BLOQUEADO','BLOQUEADO');
end $t$;

-- O próprio perfil ele continua vendo: app_user_select_self não olha papel.
insert into r (teste,esperado,obtido)
select 'assistant le o proprio perfil','sim',
  case when exists (select 1 from public.app_user where id='11111111-1111-4111-8111-000000000002')
       then 'sim' else 'nao' end;
reset role;

-- ── Planner da Org B: o outro lado do tenant ────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-000000000003","role":"authenticated"}';
insert into r (teste,esperado,obtido)
select 'planner B ve apenas clientes da B','Cliente da B',coalesce(string_agg(nome,','),'<nada>') from public.client;
reset role;

-- ── JWT válido, mas sem perfil em app_user ──────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"99999999-9999-4999-8999-999999999999","role":"authenticated"}';
insert into r (teste,esperado,obtido)
select 'usuario sem app_user nao ve clientes','0',count(*)::text from public.client;
reset role;

-- ── Deslogado: role anon E claims limpos (ver aviso no topo) ────
set local role anon;
set local request.jwt.claims = '';

insert into r (teste,esperado,obtido) select 'anon: clientes','0',count(*)::text from public.client;
insert into r (teste,esperado,obtido) select 'anon: orgs','0',count(*)::text from public.organization;
insert into r (teste,esperado,obtido) select 'anon: app_user','0',count(*)::text from public.app_user;
insert into r (teste,esperado,obtido) select 'anon: goals','0',count(*)::text from public.goal;
insert into r (teste,esperado,obtido) select 'anon: categorias de orcamento','0',count(*)::text from public.budget_category;
insert into r (teste,esperado,obtido)
select 'anon: current_org_id() e NULL','NULL',coalesce(public.current_org_id()::text,'NULL');

do $t$ begin
  insert into public.client (org_id, nome) values ('00000000-0000-4000-8000-0000000000aa','anon escreveu');
  insert into r (teste,esperado,obtido) values ('anon: tenta inserir cliente','BLOQUEADO','PASSOU (falha!)');
exception when others then
  insert into r (teste,esperado,obtido) values ('anon: tenta inserir cliente','BLOQUEADO','BLOQUEADO');
end $t$;

-- handle_new_user() é de trigger; não deve ser chamável via RPC (ver 0004).
do $t$ begin
  perform public.handle_new_user();
  insert into r (teste,esperado,obtido) values ('anon: chama handle_new_user()','BLOQUEADO','PASSOU (falha!)');
exception when others then
  insert into r (teste,esperado,obtido) values ('anon: chama handle_new_user()','BLOQUEADO','BLOQUEADO');
end $t$;

reset role;
reset request.jwt.claims;

select teste, esperado, obtido,
       case when esperado = obtido then 'PASS' else 'FAIL' end as veredito
from r order by ord;

rollback;
