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
| `20260726120000_0010_signup_invite.sql` | Tabela `signup_invite` (admin libera e-mail + papel) e `handle_new_user()` lendo dela. Fecha o signup aberto. |
| `20260726140000_0011_retire_assistant_role.sql` | Aposenta o papel `assistant`: `is_staff()` vira admin+planner e o convite só aceita esses dois. |

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

São **dois** papéis internos — é com eles que a consultoria opera:

- **admin** — gerencia a organização, os convites e os papéis; acesso total à org.
- **planner** — leitura e escrita dos dados da org (clientes, planejamento, relatórios).

- **client** — papel do **Portal do Cliente**, outra área do produto, com endereço e políticas
  próprias numa fase futura. Reservado no enum, sem acesso a nada daqui.
- **assistant** — **aposentado** no `0011`. O valor segue no enum porque Postgres não remove
  valor de enum e recriar o tipo derrubaria políticas e funções que o referenciam; o que vale
  é que nenhum caminho atribui esse papel e quem o tivesse não é mais staff.

### Cadastro é por convite (`0010`)

Um admin libera o e-mail em **Configurações → Convites**, já escolhendo o papel. Isso grava
uma linha em `signup_invite`, e é ela — não o cliente — que define **organização e papel**:

1. A pessoa se cadastra em `/signup` com o e-mail liberado.
2. `handle_new_user()` procura convite ativo por `lower(email)`.
3. Sem convite, a função aborta com `P0001` — o insert em `auth.users` é desfeito, então
   nem usuário órfão sobra. O app traduz o erro para "peça um convite ao administrador".
4. Com convite, cria o `app_user` com `org_id`/`role` do convite e marca `usado_em`.

`raw_user_meta_data` só é lido para o `nome`. Testado: convite com caixa diferente casa, e
metadata forjando `role: admin` + outro `org_id` é ignorado.

O **primeiro admin** não tem quem o convide — nasce do script
[`scripts/bootstrap_admin.sql`](scripts/bootstrap_admin.sql), que cria o convite de admin e
o usuário do Auth na mão. É o único cadastro manual do sistema.

Escrita em `app_user` é só de admin. Para o usuário corrigir o próprio nome na tela de
Configurações existe a RPC `update_own_profile()` (`0009`) — ela toca apenas `nome`, apenas
na linha de `auth.uid()`, então não dá para escalar papel nem trocar de organização por ali.

Histórico: até o `0008` o `role` vinha do metadata (qualquer um se cadastrava como `admin`);
até o `0010`, o `org_id` também (dava para entrar em qualquer organização). Os dois caminhos
estão fechados — o cliente não escolhe mais nada.

## Storage

Bucket `reports` — **privado**, só `application/pdf`, limite de 25 MiB.
Convenção de caminho: **`{org_id}/{client_id}/{arquivo}.pdf`** — o primeiro segmento
carrega o tenant, e é assim que as políticas isolam por org. Manter essa convenção ao
fazer upload, senão o arquivo fica inacessível. Leitura no app: signed URL gerada no servidor.

## Testes

`tests/rls_smoke.sql` — **29 asserções** cobrindo isolamento entre orgs, escrita cross-tenant,
cadastro sem convite, convite já usado, `assistant` sem acesso (regressão do `0011`), `planner`
sem poder de admin, usuário sem perfil e acesso deslogado. Roda em transação e termina em
`ROLLBACK` (não deixa resíduo). Todas devem sair `PASS`.

Duas armadilhas ao escrever novos casos:

- `set local request.jwt.claims` **persiste** entre blocos da mesma transação. Trocar só o
  `role` para `anon` sem limpar os claims faz o teste rodar com a identidade do usuário
  anterior — e dá falso resultado.
- Contagens globais (`count(*) from app_user`) pegam também os usuários reais do dev.
  Filtre pelas orgs de fixture.

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
- Recuperação de senha (`/auth/recover`) e reenvio do link de confirmação.
- E-mail de convite (hoje o admin libera o e-mail e avisa a pessoa por fora).
- Reconciliação `report.pdf_url` ↔ objetos no bucket `reports`.
