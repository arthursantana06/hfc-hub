-- HFC Hub — Fase 0 · Endurecimento dos GRANTs das funções
-- Motivo: funções SECURITY DEFINER no schema `public` são expostas automaticamente
-- como RPC pelo PostgREST (/rest/v1/rpc/...). O linter do Supabase alerta sobre isso.
--
-- handle_new_user(): é função de TRIGGER; ninguém deve chamá-la via API.
-- Revogar EXECUTE não impede o trigger de disparar — o privilégio é checado na
-- criação do trigger, não a cada execução.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- current_org_id() / current_user_role() / is_staff() / can_write():
-- NÃO podem ser revogadas de `authenticated`. As expressões de RLS são avaliadas
-- com os privilégios do papel que consulta, então revogar quebraria todo
-- SELECT/INSERT/UPDATE/DELETE das tabelas org-scoped.
-- Expor a própria org/papel ao próprio usuário autenticado não vaza nada além
-- do que ele já enxerga — o alerta restante do linter para essas duas é aceito
-- de forma consciente.
-- `anon` não tem linha em app_user (todas retornam NULL), então revogamos por higiene.
revoke all on function public.current_org_id()    from public, anon;
revoke all on function public.current_user_role() from public, anon;
revoke all on function public.is_staff()          from public, anon;
revoke all on function public.can_write()         from public, anon;

grant execute on function public.current_org_id()    to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_staff()          to authenticated;
grant execute on function public.can_write()         to authenticated;
