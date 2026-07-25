-- HFC Hub — Fase 0 · Correção do 0004
-- 0004 revogou EXECUTE das funções auxiliares de `anon`. Efeito colateral: como as
-- expressões de RLS são avaliadas com os privilégios do papel que consulta, uma
-- request sem sessão passa a FALHAR com 42501 (permission denied for function)
-- em vez de retornar conjunto vazio. A negação acontece nos dois casos, mas o erro
-- é uma superfície pior (500 no PostgREST em vez de 200 []).
--
-- Restauramos o EXECUTE para `anon`: as funções leem apenas a linha do PRÓPRIO
-- chamador em app_user, e `anon` não tem linha — todas retornam NULL, as políticas
-- avaliam como falso e o resultado é vazio. Não há vazamento.
-- O alerta do linter para essas funções é, portanto, aceito de forma consciente.
-- `handle_new_user()` permanece revogada (é função de trigger, não deve ser RPC).
grant execute on function public.current_org_id()    to anon;
grant execute on function public.current_user_role() to anon;
grant execute on function public.is_staff()          to anon;
grant execute on function public.can_write()         to anon;
