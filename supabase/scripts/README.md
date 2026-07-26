# Criando a sua conta de admin

O HFC Hub é **fechado por convite**: só cria conta quem tem o e-mail liberado por um admin.
Isso cria um problema de ovo e galinha no primeiro acesso — não existe admin para te convidar.
O `bootstrap_admin.sql` resolve isso **uma única vez**. Depois dele, todo mundo (inclusive
outros admins) entra pela tela de Configurações → Convites.

---

## Antes de começar

Confirme que as migrações estão aplicadas no projeto. No **SQL Editor** do painel do Supabase:

```sql
select version from supabase_migrations.schema_migrations order by version desc limit 1;
```

Precisa retornar `20260726140000` (ou mais recente). Se vier vazio ou menor, aplique as
migrações de `supabase/migrations/` antes de seguir.

---

## Passo a passo

### 1. Abra o SQL Editor

No painel do Supabase (<https://supabase.com/dashboard>), escolha o projeto **hfc-dev** e clique
em **SQL Editor** na barra lateral → **New query**.

### 2. Cole o script

Copie o conteúdo inteiro de [`bootstrap_admin.sql`](bootstrap_admin.sql) e cole no editor.

### 3. Edite as três primeiras linhas

```sql
v_email text := 'SEU_EMAIL@AQUI';         -- vira seu login
v_senha text := 'SUA_SENHA_AQUI';         -- mínimo 8 caracteres
v_nome  text := 'Seu Nome';               -- aparece na sidebar
```

Sobre a senha:

- **Mínimo 8 caracteres** — é a regra que o formulário de login valida. Menos que isso e você
  não consegue entrar pela tela.
- Use um e-mail **real e válido** (`@gmail.com`, o domínio da consultoria…). O Supabase recusa
  domínios de teste como `.test` ou `example.com` em cadastros normais, e você vai querer esse
  e-mail funcionando quando existir recuperação de senha.
- A senha vai **cifrada** (`bcrypt`) para o banco — ela não fica legível em lugar nenhum.

O script tem uma trava: se você esquecer de trocar os placeholders, ele para com
`Edite v_email/v_senha/v_nome antes de rodar este script.`

### 4. Rode

Clique em **Run** (ou `Ctrl+Enter`). O resultado esperado é `Success. No rows returned`, e em
**Messages** aparece:

```
NOTICE: Admin criado: voce@dominio.com (uid ...). Entre em /login com essa senha.
```

### 5. Confira

```sql
select nome, email, role from public.app_user where role = 'admin';
```

Deve aparecer a sua linha com `role = admin`.

### 6. Entre no app

```bash
npm run dev
```

Abra <http://localhost:3000> — você cai em `/login`. Entre com o e-mail e a senha que definiu.
A sidebar deve mostrar seu nome com **Administrador** embaixo, e o menu **Configurações**
agora traz o bloco **Convites**.

### 7. Limpe o arquivo

Volte os placeholders (`SEU_EMAIL@AQUI` etc.) antes de commitar — o arquivo é versionado e
não pode carregar a sua senha.

---

## Convidando o resto do time

Daqui em diante nada mais é manual. Em **Configurações → Convites**: digite o e-mail, escolha
**Administrador** ou **Planejador**, clique em *Liberar*. A pessoa se cadastra sozinha em
`/signup` com aquele e-mail e já nasce com o papel certo.

O convite ainda **não dispara e-mail** — avise a pessoa por fora que ela pode se cadastrar.

---

## Se algo der errado

| Sintoma | Causa | O que fazer |
| --- | --- | --- |
| `duplicate key value violates unique constraint "users_email_key"` | Já existe usuário com esse e-mail no Auth | Use outro e-mail, ou apague o usuário em Authentication → Users e rode de novo |
| `Edite v_email/v_senha...` | Placeholders não trocados | Edite as três primeiras linhas |
| `relation "public.signup_invite" does not exist` | Migração `0010` não aplicada | Aplique as migrações pendentes |
| Login diz "E-mail ou senha inválidos" | Senha com menos de 8 caracteres, ou digitada errada | Rode `select * from auth.users where email = '...'` para conferir que o usuário existe; se precisar, apague e rode o script de novo |
| `Database error querying schema` no login | Colunas de token do `auth.users` como `NULL` | O script já cuida disso (`''` em vez de `NULL`); se veio de um usuário criado à mão fora dele, é essa a causa |

## Por que fazer na mão, e só uma vez

Criar usuário pela API exigiria a `SUPABASE_SERVICE_ROLE_KEY` — a chave que **ignora a RLS
inteira**. O app não usa essa chave em lugar nenhum, e não vale introduzi-la só para o primeiro
cadastro. O script faz o mesmo trabalho dentro do banco, e de quebra passa pelo mesmo caminho
de todo mundo: ele cria um **convite de admin** para o seu e-mail e deixa o trigger
`handle_new_user()` montar o perfil.
