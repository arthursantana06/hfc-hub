# Supabase — HFC Hub

Backend do HFC Hub: Postgres + Auth + Storage, com **Row-Level Security** por organização
(`org_id` em todas as tabelas). Estas migrações são a fundação da **Fase 0**.

## Migrações

| Arquivo | O que faz |
| --- | --- |
| `migrations/0001_schema.sql` | Enums, tabelas (Núcleo/CRM, Planejamento, Investimentos, Gamificação) e índices. |
| `migrations/0002_rls.sql` | Funções auxiliares, RLS por `org_id` + papéis, e trigger de provisionamento de perfil no signup. |
| `migrations/0003_seed.sql` | Cria a organização **HFC** (uuid fixo) e categorias de orçamento base. |

Ordem importa: aplicar 0001 → 0002 → 0003.

## Como aplicar

### Opção A — Painel do Supabase (mais rápido para começar)
1. Crie um projeto em <https://supabase.com>.
2. Em **SQL Editor**, cole e rode cada arquivo em ordem (0001, 0002, 0003).
3. Em **Project Settings → API**, copie a `URL`, a `anon key` e a `service_role key`.
4. Copie `.env.example` para `.env.local` e preencha. O `NEXT_PUBLIC_DEFAULT_ORG_ID`
   é `00000000-0000-4000-8000-000000000001` (o uuid da org HFC criado pelo seed).

### Opção B — Supabase CLI (recomendado para o dia a dia)
```bash
npm i -g supabase          # ou: npx supabase ...
supabase login
supabase link --project-ref <ref-do-projeto>
supabase db push           # aplica as migrations/ em ordem
```

## Modelo de acesso (Fase 0)

- **admin** — gerencia a organização e os usuários; acesso total à org.
- **planner** — leitura e escrita dos dados da org (clientes, planejamento, relatórios).
- **assistant** — **somente leitura** por padrão (princípio de menor exposição a dados sensíveis).
- **client** — **sem acesso** nesta fase; as políticas do Portal do Cliente entram numa fase futura.

Novos usuários viram `app_user` automaticamente **se** o signup enviar `org_id` (e opcionalmente
`role`, `nome`) em `raw_user_meta_data` — ver `handle_new_user()` em `0002_rls.sql`.

## Ainda não coberto (próximos passos da Fase 0)

- Cliente Supabase no Next.js (SSR) — `@supabase/ssr`, usando `await cookies()`.
- `proxy.ts` (o antigo middleware) para checagem otimista de sessão.
- Bucket de **Storage** para os PDFs de relatório + políticas de acesso.
- Políticas de RLS do **Portal do Cliente** (papel `client`).
