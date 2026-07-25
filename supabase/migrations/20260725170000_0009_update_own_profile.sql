-- HFC Hub — Fase 0 · Edição do próprio perfil
--
-- As políticas de `app_user` só permitem escrita a admin (app_user_admin_write).
-- Logo, um planner/assistant não conseguia nem corrigir o próprio nome na tela
-- de Configurações — o update passava pela RLS e afetava 0 linhas, em silêncio.
--
-- Em vez de abrir uma política de update para o próprio usuário (que exigiria
-- travar `role` e `org_id` no WITH CHECK, e a checagem depende de função stable
-- lendo a mesma linha que está sendo alterada), a escrita fica numa RPC estreita:
-- ela só toca `nome`, e sempre na linha de auth.uid(). Não há como escalar papel
-- nem trocar de organização por aqui.

create or replace function public.update_own_profile(p_nome text)
returns public.app_user
language sql security definer set search_path = public as $fn$
  update public.app_user
     set nome = nullif(btrim(p_nome), '')
   where id = auth.uid()
  returning *;
$fn$;

revoke execute on function public.update_own_profile(text) from public, anon;
grant execute on function public.update_own_profile(text) to authenticated;
