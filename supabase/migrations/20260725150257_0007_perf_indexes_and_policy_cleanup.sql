-- HFC Hub — Fase 0 · Índices de org_id e limpeza de políticas
-- Apontado por get_advisors(performance).

-- ── 1. Índices em org_id ────────────────────────────────────────
-- TODA política de RLS filtra por org_id (= current_org_id()). Sem índice,
-- cada consulta faz seq scan. O 0001 indexou client_id mas esqueceu org_id.
create index if not exists asset_org_id_idx             on public.asset (org_id);
create index if not exists budget_target_org_id_idx     on public.budget_target (org_id);
create index if not exists debt_org_id_idx              on public.debt (org_id);
create index if not exists expense_entry_org_id_idx     on public.expense_entry (org_id);
create index if not exists goal_org_id_idx              on public.goal (org_id);
create index if not exists income_entry_org_id_idx      on public.income_entry (org_id);
create index if not exists investment_org_id_idx        on public.investment (org_id);
create index if not exists liability_org_id_idx         on public.liability (org_id);
create index if not exists monthly_record_org_id_idx    on public.monthly_record (org_id);
create index if not exists point_event_org_id_idx       on public.point_event (org_id);
create index if not exists projection_org_id_idx        on public.projection (org_id);
create index if not exists referral_org_id_idx          on public.referral (org_id);
create index if not exists rendafixa_link_org_id_idx    on public.rendafixa_link (org_id);
create index if not exists report_org_id_idx            on public.report (org_id);
create index if not exists retirement_plan_org_id_idx   on public.retirement_plan (org_id);
create index if not exists reward_org_id_idx            on public.reward (org_id);
create index if not exists reward_redemption_org_id_idx on public.reward_redemption (org_id);
create index if not exists timeline_event_org_id_idx    on public.timeline_event (org_id);

-- FKs restantes sem índice de cobertura.
-- (meeting já tem o composto (org_id, client_id), mas ele não cobre buscas só por client_id.)
create index if not exists budget_target_categoria_id_idx  on public.budget_target (categoria_id);
create index if not exists client_portal_user_id_idx       on public.client (portal_user_id);
create index if not exists meeting_client_id_idx           on public.meeting (client_id);
create index if not exists meeting_planner_id_idx          on public.meeting (planner_id);
create index if not exists reward_redemption_reward_id_idx on public.reward_redemption (reward_id);

-- ── 2. auth.uid() reavaliado por linha ──────────────────────────
-- `auth.uid()` solto é reavaliado para CADA linha. Envolver em (select ...)
-- faz o planner tratar como InitPlan e avaliar uma única vez.
drop policy if exists app_user_select_self on public.app_user;
create policy app_user_select_self on public.app_user
  for select using (id = (select auth.uid()));

-- ── 3. FOR ALL criava política de SELECT redundante ─────────────
-- `for all` cobre também SELECT, então as políticas de admin somavam-se às de
-- leitura e eram executadas em toda consulta sem alterar o resultado.
-- Trocadas por insert/update/delete explícitos — mesma semântica, menos trabalho.
drop policy if exists org_admin_write on public.organization;

create policy org_admin_ins on public.organization
  for insert with check (id = public.current_org_id() and public.current_user_role() = 'admin');
create policy org_admin_upd on public.organization
  for update
  using (id = public.current_org_id() and public.current_user_role() = 'admin')
  with check (id = public.current_org_id() and public.current_user_role() = 'admin');
create policy org_admin_del on public.organization
  for delete using (id = public.current_org_id() and public.current_user_role() = 'admin');

drop policy if exists app_user_admin_write on public.app_user;

create policy app_user_admin_ins on public.app_user
  for insert with check (org_id = public.current_org_id() and public.current_user_role() = 'admin');
create policy app_user_admin_upd on public.app_user
  for update
  using (org_id = public.current_org_id() and public.current_user_role() = 'admin')
  with check (org_id = public.current_org_id() and public.current_user_role() = 'admin');
create policy app_user_admin_del on public.app_user
  for delete using (org_id = public.current_org_id() and public.current_user_role() = 'admin');
