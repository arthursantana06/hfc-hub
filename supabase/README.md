# Supabase — HFC Hub

Backend do HFC Hub: Postgres + Auth + Storage, com **Row-Level Security** por organização
(`org_id` em todas as tabelas). Estas migrações são a fundação da **Fase 0**.

**Projeto de dev:** `vidiyibzirsbfsjfuqxo` · <https://vidiyibzirsbfsjfuqxo.supabase.co>
**Estado:** todas as migrações abaixo estão **aplicadas** no projeto de dev.

## Migrações

Os nomes dos arquivos usam o `version` (timestamp) que consta no histórico remoto
(`supabase_migrations.schema_migrations`) — não renomear, senão `supabase db push`
tenta reaplicar tudo.

| Arquivo | O que faz |
| --- | --- |
| `20260724194235_0001_schema.sql` | Enums, 23 tabelas (Núcleo/CRM, Planejamento, Investimentos, Gamificação) e índices. |
| `20260724194253_0002_rls.sql` | Funções auxiliares, RLS por `org_id` + papéis, trigger de provisionamento de perfil no signup. |
| `20260724194301_0003_seed.sql` | Cria a organização **HFC** (uuid fixo) e 7 categorias de orçamento base. |
| `20260725144803_0004_harden_function_grants.sql` | Revoga `EXECUTE` de `handle_new_user()` (é função de trigger, não RPC). |
| `20260725144824_0005_storage_reports.sql` | Bucket privado `reports` para os PDFs + políticas de acesso por org. |
| `20260725145645_0006_restore_anon_helper_grants.sql` | Corrige o 0004: devolve `EXECUTE` das funções auxiliares a `anon`. |
| `20260725150257_0007_perf_indexes_and_policy_cleanup.sql` | Índices em `org_id` (toda RLS filtra por ele), `(select auth.uid())` e troca de `for all` por ins/upd/del. |
| `20260725160000_0008_signup_role_hardening.sql` | `handle_new_user()` para de ler o papel do metadata (escalada para `admin` no signup) e fixa `planner`. |
| `20260725170000_0009_update_own_profile.sql` | RPC `update_own_profile(nome)`: única escrita em `app_user` liberada a não-admin, e só no campo `nome` da própria linha. |

Estado atual: **23 tabelas**, RLS ativa em todas, **93 políticas** em `public` + 4 no bucket
`reports`, 1 organização (HFC) e 7 categorias de orçamento no seed.

## Como aplicar num projeto novo

### Opção A — MCP (o fluxo em uso hoje)
O servidor MCP `supabase-hfc-dev` está configurado em `.mcp.json` e aplica migrações
direto (`apply_migration`), consulta o schema (`list_tables`) e roda o linter
(`get_advisors`). Requer `SUPABASE_ACCESS_TOKEN` no ambiente.

### Opção B — Supabase CLI
```bash
supabase login
supabase link --project-ref <ref-do-projeto>
supabase db push           # aplica as migrations/ em ordem
```

### Depois de aplicar
1. Copie `.env.example` para `.env.local` e preencha.
2. `NEXT_PUBLIC_DEFAULT_ORG_ID` = `00000000-0000-4000-8000-000000000001` (org HFC do seed).
3. `SUPABASE_SERVICE_ROLE_KEY` **não** é acessível via MCP — copie do painel
   (Project Settings → API Keys → `service_role`).
4. Regenere os tipos:
   `npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts`

## Modelo de acesso (Fase 0)

- **admin** — gerencia a organização e os usuários; acesso total à org.
- **planner** — leitura e escrita dos dados da org (clientes, planejamento, relatórios).
- **assistant** — **somente leitura** (princípio de menor exposição a dados sensíveis).
- **client** — **sem acesso** nesta fase; as políticas do Portal do Cliente entram numa fase futura.

Novos usuários viram `app_user` automaticamente **se** o signup enviar `org_id` (e opcionalmente
`nome`) em `raw_user_meta_data` — ver `handle_new_user()`, redefinido em `0008`.
Signup sem `org_id` **não** cria perfil, e um usuário sem perfil não enxerga nada (testado).

Escrita em `app_user` é só de admin. Para o usuário corrigir o próprio nome na tela de
Configurações existe a RPC `update_own_profile()` (`0009`) — ela toca apenas `nome`, apenas
na linha de `auth.uid()`, então não dá para escalar papel nem trocar de organização por ali.

O **papel não vem do metadata**: todo cadastro nasce `planner` e a promoção é ato de um admin.
Até o `0008`, `role` era lido de `raw_user_meta_data` — como esse campo é escolhido por quem
chama `/auth/v1/signup`, qualquer pessoa podia se cadastrar direto como `admin`.

⚠️ **Em aberto:** `org_id` ainda vem do metadata, então um cadastro feito fora do app pode
entrar em qualquer organização. O fechamento correto é signup por convite; enquanto isso,
manter *Allow new users to sign up* **desligado** no painel em produção.

## Storage

Bucket `reports` — **privado**, só `application/pdf`, limite de 25 MiB.
Convenção de caminho: **`{org_id}/{client_id}/{arquivo}.pdf`** — o primeiro segmento
carrega o tenant, e é assim que as políticas isolam por org. Manter essa convenção ao
fazer upload, senão o arquivo fica inacessível. Leitura no app: signed URL gerada no servidor.

## Testes

`tests/rls_smoke.sql` — 20 asserções cobrindo isolamento entre orgs, escrita cross-tenant,
`assistant` como somente-leitura, `planner` sem poder de admin, usuário sem perfil e acesso
deslogado. Roda em transação e termina em `ROLLBACK` (não deixa resíduo). Todas devem sair `PASS`.

Ao escrever novos casos: `set local request.jwt.claims` **persiste** entre blocos da mesma
transação. Trocar só o `role` para `anon` sem limpar os claims faz o teste rodar com a
identidade do usuário anterior — e dá falso resultado.

## Alertas conhecidos do linter (aceitos)

`get_advisors(security)` reporta 4 avisos: `current_org_id()` e `current_user_role()` são
`SECURITY DEFINER` e chamáveis por `anon` e `authenticated`. É **intencional e necessário**:
as expressões de RLS são avaliadas com os privilégios do papel que consulta, então revogar
`EXECUTE` quebraria todo acesso às tabelas org-scoped (para `anon`, transforma "conjunto
vazio" em erro 42501 — foi exatamente o que o 0006 corrigiu). As funções leem apenas a
linha do próprio chamador em `app_user` — não expõem nada que ele já não veja, e para
`anon` retornam `NULL`.

Em `get_advisors(performance)` sobram avisos de `unused_index`: são os índices do 0001/0007
num banco ainda sem tráfego. Reavaliar quando houver uso real.

## Ainda não coberto (próximas fases)

- Políticas de RLS do **Portal do Cliente** (papel `client`).
- Signup **por convite** (hoje `org_id` vem do metadata — ver aviso acima).
- Recuperação de senha (`/auth/recover`) e reenvio do link de confirmação.
- Reconciliação `report.pdf_url` ↔ objetos no bucket `reports`.
