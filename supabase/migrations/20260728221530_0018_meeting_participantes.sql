-- HFC Hub · Agenda: reunião ganha uma lista de pessoas (staff e/ou clientes),
-- separada do campo `client_id` existente (que continua sendo "de quem é a
-- reunião", usado em filtros) — Arthur pediu os dois convivendo, não um
-- substituindo o outro.

alter table public.meeting drop column planner_id;

create table public.meeting_participante (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organization(id) on delete cascade,
  meeting_id  uuid not null references public.meeting(id) on delete cascade,
  app_user_id uuid references public.app_user(id) on delete cascade,
  client_id   uuid references public.client(id) on delete cascade,
  constraint meeting_participante_uma_pessoa
    check ((app_user_id is not null) <> (client_id is not null))
);

comment on table public.meeting_participante is
  'Quem participa da reunião — admin/planejador (app_user_id) ou cliente (client_id), nunca os dois na mesma linha.';

-- Unicidade por ramo: NULL não é igual a NULL num índice único comum, então
-- um índice parcial por coluna é o único jeito de barrar linha duplicada.
create unique index meeting_participante_app_user_uk
  on public.meeting_participante (meeting_id, app_user_id) where app_user_id is not null;
create unique index meeting_participante_client_uk
  on public.meeting_participante (meeting_id, client_id) where client_id is not null;

create index meeting_participante_meeting_id_idx on public.meeting_participante (meeting_id);
create index meeting_participante_org_id_idx     on public.meeting_participante (org_id);

alter table public.meeting_participante enable row level security;

create policy meeting_participante_sel on public.meeting_participante
  for select using (org_id = public.current_org_id() and public.is_staff());

create policy meeting_participante_ins on public.meeting_participante
  for insert with check (org_id = public.current_org_id() and public.can_write());

create policy meeting_participante_upd on public.meeting_participante
  for update
  using (org_id = public.current_org_id() and public.can_write())
  with check (org_id = public.current_org_id() and public.can_write());

create policy meeting_participante_del on public.meeting_participante
  for delete using (org_id = public.current_org_id() and public.can_write());
