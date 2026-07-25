-- HFC Hub — Fase 0 · Endurece o provisionamento de perfil no signup
--
-- Problema: handle_new_user() lia o papel de `raw_user_meta_data->>'role'`, que é
-- controlado por quem chama /auth/v1/signup. Qualquer pessoa podia se cadastrar
-- como `admin` — escalada de privilégio direta, sem passar pelo app.
--
-- Correção: o papel deixa de vir do metadata e é fixado em `planner`. Promoção
-- passa a ser ato de um admin (política app_user_admin_write já cobre isso).
--
-- Continua em aberto (fase futura): `org_id` também vem do metadata, então um
-- cadastro externo pode entrar em qualquer organização. O fechamento correto é
-- signup por convite — enquanto isso, manter "Allow new users to sign up"
-- desligado no painel do Supabase em produção.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if (new.raw_user_meta_data ? 'org_id') then
    insert into public.app_user (id, org_id, nome, email, role)
    values (
      new.id,
      (new.raw_user_meta_data->>'org_id')::uuid,
      coalesce(new.raw_user_meta_data->>'nome', new.email),
      new.email,
      -- Papel NÃO vem do metadata (ver cabeçalho): todo cadastro nasce planner.
      'planner'
    );
  end if;
  return new;
end $fn$;

revoke execute on function public.handle_new_user() from anon, authenticated;
