# Guia — conectando o Google Calendar da empresa ao Hub

Este guia é o passo a passo para *você* fazer no site do Google, antes de eu
poder construir a integração. Nenhuma dessas etapas eu consigo fazer sozinho:
envolvem criar um projeto numa conta Google e, no fim, um clique de "Permitir"
que só pode ser feito por quem está logado como o e-mail da empresa.

**O que já está decidido** (documentado também em `projects/hfc-hub.md` no
otherbrain, para referência futura):
- Conectamos **um e-mail só, o da empresa** — não um Google Calendar por
  planejador.
- Sincronização **nos dois sentidos**: reunião criada no Hub aparece no
  Google Calendar, e evento criado direto no Google Calendar aparece no Hub.
- Evento do Google com convidados que não existem no Hub: o e-mail do
  convidado é comparado com o e-mail de cada `app_user`/cliente cadastrado;
  quem bater vira "Pessoa" automaticamente.

---

## Parte 1 — criar o projeto no Google Cloud

1. Abra **[console.cloud.google.com](https://console.cloud.google.com/)** e
   entre com a conta Google que vai ser a "dona" da integração (pode ser a
   sua conta pessoal — quem cria o projeto não precisa ser o mesmo e-mail que
   vamos conectar ao calendário depois).
2. No topo da página, ao lado do logo "Google Cloud", clique no seletor de
   projeto (geralmente mostra "Select a project" ou o nome de um projeto já
   existente).
3. Clique em **"Novo Projeto"** (New Project).
4. Dê um nome — sugestão: `HFC Hub`. Pode deixar a organização em branco se
   não aparecer nenhuma. Clique em **Criar**.
5. Espere alguns segundos e troque para esse projeto recém-criado no mesmo
   seletor do topo (às vezes ele já entra automaticamente).

## Parte 2 — ligar a API do Calendar

1. No menu à esquerda (ícone de "☰"), vá em **"APIs e Serviços" → "Biblioteca"**
   (API & Services → Library).
2. Na busca, digite **"Google Calendar API"** e clique no resultado.
3. Clique no botão azul **"Ativar"** (Enable).

Isso libera o projeto para conversar com o Google Calendar — sem isso, nada
do resto funciona.

## Parte 3 — configurar a "tela de consentimento" (OAuth)

Essa é a telinha que aparece pedindo "Permitir que HFC Hub acesse sua
agenda?" quando alguém conecta a conta.

1. No mesmo menu, vá em **"APIs e Serviços" → "Tela de consentimento OAuth"**
   (OAuth consent screen).
2. Tipo de usuário: escolha **"Externo"** (External) — é a opção certa mesmo
   que o e-mail da empresa não seja um Gmail comum, a menos que vocês tenham
   Google Workspace com um administrador (se não tiver certeza, escolha
   Externo).
3. Preencha o formulário:
   - **Nome do app**: `HFC Hub`
   - **E-mail de suporte do usuário**: seu e-mail
   - **Logo do app**: pode pular
   - **E-mail de contato do desenvolvedor**: seu e-mail de novo
4. Continue clicando em **"Salvar e continuar"** nas telas seguintes
   (Escopos, Usuários de teste) — não precisa preencher nada extra ainda.
5. Na tela **"Usuários de teste"** (Test users), clique em **"+ Add users"**
   e adicione **o e-mail da empresa que queremos conectar ao calendário**.
   Isso é importante: enquanto o app não passa pela revisão do Google (que
   pode levar dias), só e-mails cadastrados aqui como "teste" conseguem
   fazer login nele. Sem isso, a conexão vai falhar com um erro de acesso
   negado.
6. No resumo final, clique em **"Voltar ao painel"** (Back to dashboard).

## Parte 4 — criar as credenciais (Client ID e Client Secret)

1. Vá em **"APIs e Serviços" → "Credenciais"** (Credentials).
2. Clique em **"+ Criar Credenciais"** (Create Credentials) → **"ID do
   cliente OAuth"** (OAuth client ID).
3. Tipo de aplicativo: **"Aplicativo da Web"** (Web application).
4. Nome: pode deixar o padrão ou colocar `HFC Hub Web`.
5. Em **"URIs de redirecionamento autorizados"** (Authorized redirect URIs),
   clique em **"+ Adicionar URI"** e cole exatamente:
   ```
   http://localhost:3000/api/google-calendar/callback
   ```
   (Quando o site estiver no ar, eu te aviso a URL de produção para
   adicionar aqui também — precisamos das duas, uma para testar no seu
   computador e outra para quando o Hub estiver publicado.)
6. Clique em **"Criar"**.
7. Uma janela vai aparecer mostrando o **Client ID** e o **Client Secret**.
   **Não feche essa janela ainda** — copie os dois valores para algum lugar
   seguro (um bloco de notas temporário serve).

## Parte 5 — colar no projeto

1. Abra o arquivo `.env.local` na raiz do projeto (é o mesmo arquivo onde já
   está a linha do `SUPABASE_SERVICE_ROLE_KEY` em branco).
2. Adicione duas linhas novas:
   ```
   GOOGLE_CLIENT_ID=cole_aqui_o_client_id
   GOOGLE_CLIENT_SECRET=cole_aqui_o_client_secret
   ```
3. Salve o arquivo.

**Não precisa mandar esses valores para mim pelo chat** — o arquivo
`.env.local` já não vai para o Git (está no `.gitignore`), e eu leio o que
está nele diretamente quando preciso, sem você precisar copiar e colar a
chave em lugar nenhum.

---

## O que acontece depois

Assim que as duas variáveis estiverem no `.env.local`, me avise. A partir
daí eu construo:

- Um botão em **Configurações** — algo como "Conectar Google Calendar".
- A rota que recebe a resposta do Google depois do clique em "Permitir"
  (`/api/google-calendar/callback`) e guarda a conexão.
- A sincronização automática: toda reunião criada, editada ou apagada no
  Hub reflete no Google Calendar da empresa, e vice-versa.

O único passo que **precisa ser você**, mesmo depois de tudo pronto: o
clique em "Permitir" na tela de consentimento, logado como o e-mail da
empresa. Eu nunca faço login em nada — nem nessa etapa.

## Se algo der errado

- **"Erro 403: access_denied"** ao tentar conectar → o e-mail que você está
  usando não está na lista de "Usuários de teste" da Parte 3, passo 5.
- **"redirect_uri_mismatch"** → a URL cadastrada na Parte 4, passo 5 não
  bate exatamente com a que o Hub está usando (atenção a `http` vs `https`,
  barra no final, etc.). Me avise que eu confiro qual URL o código está
  mandando.
- Qualquer outra mensagem de erro: copie o texto inteiro e me manda — a
  maioria dos erros do Google Cloud tem uma causa bem específica.
