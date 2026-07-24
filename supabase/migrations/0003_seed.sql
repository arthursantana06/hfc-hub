-- HFC Hub — Fase 0 · Seed
-- Cria a organização da HFC com um uuid fixo e conhecido, para usar como
-- NEXT_PUBLIC_DEFAULT_ORG_ID no signup enquanto o sistema é single-tenant.
-- Idempotente: seguro rodar mais de uma vez.

insert into public.organization (id, name, plano)
values ('00000000-0000-4000-8000-000000000001'::uuid, 'HFC', 'interno')
on conflict (id) do nothing;

-- Categorias de orçamento base (grupos derivados da planilha de acompanhamento).
insert into public.budget_category (org_id, nome, grupo) values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Moradia',       'fixo'),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Alimentação',   'pessoal'),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Transporte',    'pessoal'),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Saúde',         'pessoal'),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Lazer',         'pessoal'),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Filhos e Pets', 'pessoal'),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Custos do consultório', 'consultorio')
on conflict (org_id, nome) do nothing;
