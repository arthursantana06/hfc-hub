-- HFC Hub — Fase 0 · Storage dos PDFs de relatório
-- Bucket PRIVADO (nunca público: são dados financeiros de clientes).
-- Convenção de caminho: {org_id}/{client_id}/{arquivo}.pdf
-- O primeiro segmento carrega o tenant, então o isolamento por org é feito
-- comparando storage.foldername(name)[1] com public.current_org_id().
-- Acesso ao arquivo em si: sempre via signed URL gerada no servidor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reports', 'reports', false, 26214400, array['application/pdf'])  -- 25 MiB
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists reports_read   on storage.objects;
drop policy if exists reports_write  on storage.objects;
drop policy if exists reports_update on storage.objects;
drop policy if exists reports_delete on storage.objects;

-- Leitura: qualquer staff da org dona da pasta (inclui `assistant`).
create policy reports_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.is_staff()
  );

-- Escrita: apenas admin | planner da org.
create policy reports_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.can_write()
  );

create policy reports_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.can_write()
  )
  with check (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.can_write()
  );

create policy reports_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.can_write()
  );
