-- HFC Hub — Foto de perfil (opcional) para usuários e clientes
--
-- Guardamos apenas o caminho dentro do bucket, nunca uma URL assinada: a
-- assinatura expira, o caminho não. A URL é gerada no servidor a cada render.
--
-- Convenções de caminho (o primeiro segmento carrega o tenant, como em
-- `reports`, para que o isolamento por org saia de storage.foldername):
--   {org_id}/users/{app_user.id}/<arquivo>
--   {org_id}/clients/{client.id}/<arquivo>

alter table public.app_user add column if not exists avatar_path text;
alter table public.client   add column if not exists avatar_path text;

comment on column public.app_user.avatar_path is
  'Caminho no bucket `avatars` ({org_id}/users/{id}/...). Nulo = sem foto.';
comment on column public.client.avatar_path is
  'Caminho no bucket `avatars` ({org_id}/clients/{id}/...). Nulo = sem foto.';

-- Escrita do próprio avatar pela mesma via estreita de `update_own_profile`:
-- `app_user` só aceita escrita de admin, então sem uma RPC o planejador não
-- conseguiria salvar a própria foto. Esta só toca `avatar_path`, e só na
-- linha de auth.uid() — não há como escalar papel nem trocar de organização.
create or replace function public.update_own_avatar(p_path text)
returns public.app_user
language sql security definer set search_path = public as $fn$
  update public.app_user
     set avatar_path = nullif(btrim(p_path), '')
   where id = auth.uid()
  returning *;
$fn$;

revoke execute on function public.update_own_avatar(text) from public, anon;
grant execute on function public.update_own_avatar(text) to authenticated;

-- Bucket privado: a foto de um cliente é dado pessoal, não vaza por URL adivinhada.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', false, 2097152,  -- 2 MiB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_read   on storage.objects;
drop policy if exists avatars_write  on storage.objects;
drop policy if exists avatars_update on storage.objects;
drop policy if exists avatars_delete on storage.objects;

-- Leitura: qualquer staff da org dona da pasta.
create policy avatars_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.is_staff()
  );

-- Escrita: a própria pessoa mexe na sua foto; fotos de cliente seguem can_write().
-- Sem isto um planejador poderia trocar o avatar de um admin.
create policy avatars_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and (
      ((storage.foldername(name))[2] = 'users'
        and (storage.foldername(name))[3] = auth.uid()::text)
      or ((storage.foldername(name))[2] = 'clients' and public.can_write())
    )
  );

create policy avatars_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and (
      ((storage.foldername(name))[2] = 'users'
        and (storage.foldername(name))[3] = auth.uid()::text)
      or ((storage.foldername(name))[2] = 'clients' and public.can_write())
    )
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and (
      ((storage.foldername(name))[2] = 'users'
        and (storage.foldername(name))[3] = auth.uid()::text)
      or ((storage.foldername(name))[2] = 'clients' and public.can_write())
    )
  );

create policy avatars_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and (
      ((storage.foldername(name))[2] = 'users'
        and (storage.foldername(name))[3] = auth.uid()::text)
      or ((storage.foldername(name))[2] = 'clients' and public.can_write())
    )
  );
