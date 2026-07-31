# HFC Hub — Plataforma da Consultoria Financeira

> Um **hub** único para planejar, acompanhar e encantar cada cliente da consultoria.

O **HFC Hub** é o sistema global da consultoria financeira: um ecossistema que reúne o
**CRM** da operação, o **planejamento financeiro** (Raio-X) de cada cliente, a **análise de
investimentos** e a geração de **relatórios profissionais** — substituindo a atual planilha de
acompanhamento em Excel por uma plataforma viva, segura e escalável.

📐 **Plano mestre & arquitetura:** [`docs/plano-arquitetura.html`](docs/plano-arquitetura.html)
(abra no navegador — traz o diagrama de arquitetura **interativo**, o modelo de dados e o roadmap).
Versão viva/hospedada: [artefato no claude.ai](https://claude.ai/code/artifact/f54db680-a288-40e7-b66d-0cdb9b61d2f3).

---

## 📖 Contexto

A consultoria atende, em boa parte, **profissionais liberais** (médicos, dentistas e afins) —
pessoas cuja vida financeira mistura finanças pessoais com a de um pequeno negócio (consultório).
Hoje o acompanhamento vive em uma planilha rica (cadastro, orçamento, controle mensal, patrimônio,
objetivos, projeções, aposentadoria e investimentos) e em relatórios mensais em PDF.

O HFC Hub digitaliza e conecta tudo isso. O **planejador** cadastra clientes, coleta os dados
mensais, monta o Raio-X, define metas e gera relatórios; num segundo momento, o **cliente** poderá
acompanhar seus gastos e sua evolução por um portal próprio.

## 🎯 Objetivo

Fornecer um ecossistema completo onde a consultoria possa:

1. **Gerir a carteira** de clientes de forma ágil e unificada (CRM).
2. **Planejar** — diagnóstico financeiro e "Ponto de Partida" (Raio-X) de cada cliente.
3. **Acompanhar metas** e simular objetivos de vida (independência financeira, imóveis, aposentadoria…).
4. **Operar a rotina** — agenda, reuniões por cliente, metas e tarefas do time.
5. **Entregar valor** com relatórios consolidados e bonitos, exportáveis em PDF.

## 🧩 Divisão lógica dos módulos

| Módulo | Papel | Situação |
| --- | --- | --- |
| **CRM** | Tronco do sistema: carteira de clientes, agenda, reuniões, metas e tarefas da consultoria. | Núcleo (Fase 1) |
| **Planejamento (Raio-X)** | Nativo, **dentro do CRM**: espaço de trabalho por período (mês, bimestre ou trimestre) com fluxo de caixa, patrimônio, objetivos, mudanças, projeções e aposentadoria. | **MVP** (Fase 2) |
| **Análise de Investimentos** | Sistema externo **`rendafixa`** (em desenvolvimento). O Hub se integra por **API** e traz os dados. | Integração (Fase 5) |
| **Investimentos** | Adaptação do CRM focada na área de investimentos (alocação, rentabilidade, carteira). | Planejado (Fase 5) |
| **Portal do Cliente** | Ferramenta de *report* voltada ao cliente final: acompanha gastos, metas e evolução e lê os relatórios publicados (papel `client`, modo leitura). | Futuro |
| **MyFinancialGeek** | Ferramenta de *report* via **Open Finance** que, no futuro, conecta as contas bancárias do cliente e alimenta o Portal com gastos automáticos. | Futuro (fora do escopo atual) |

## 🏛️ Decisões de arquitetura (travadas no kickoff)

- **Escopo:** interno à consultoria agora, mas com `org_id` em todas as tabelas desde o dia 1 —
  pronto para virar **SaaS multi-consultoria** sem re-migração.
- **Backend:** **Supabase** (Postgres + Auth + Storage), com **Row-Level Security** por organização.
- **Acesso / papéis:** dois papéis internos — **Admin · Planejador**. O cadastro é **por convite**:
  o admin libera o e-mail em Configurações já escolhendo o papel, e ninguém de fora cria conta.
  O **Portal do Cliente** é outra área do produto, com endereço próprio, em fase posterior
  (o papel `client` já é reservado no modelo).
- **rendafixa:** integração por **API** (isolada atrás de um adaptador enquanto a API não existe).
- **Excel:** convive em paralelo; a planilha é o **blueprint do schema** e a migração é feita
  **módulo a módulo**, até cada peça atingir paridade.
- **Idioma & relatórios:** interface **pt-BR**; relatórios in-app **e** exportação em **PDF** prioritária.
- **Agenda:** integração com **Google Calendar** (OAuth, sincronização de reuniões).

## 🗺️ Roadmap

- **Fase 0 — Fundações _(em andamento)_:** projeto Supabase, schema + RLS, autenticação com papéis,
  aba de **Settings** redesenhada e design system.
- **Fase 1 — CRM núcleo:** CRUD real de clientes (substitui os mocks), lista, busca e ficha do cliente.
- **Fase 2 — Planejamento / Raio-X (MVP):** fluxo de caixa, orçamento, patrimônio, objetivos e linha
  do tempo, com registro mensal por cliente.
- **Fase 3 — Relatórios:** motor HTML → PDF no padrão dos relatórios atuais, arquivados no Storage.
- **Fase 4 — CRM logístico:** Google Calendar, reuniões, metas e tarefas do time, dashboard.
- **Fase 5 — Investimentos + rendafixa:** sincronização de carteira e rentabilidade via API.
- **Fase 6 — MyFinancialGeek / Open Finance _(futuro)_:** acompanhamento automático de gastos.
- **Fase 7 — Gamificação & Recompensas _(futuro)_:** o cliente ganha pontos ao atingir metas ou
  indicar amigos e evolui entre os níveis **Bronze · Prata · Ouro**, que destravam recompensas —
  camada de engajamento sobre as metas do Planejamento e o Portal do Cliente.

## 🧱 Modelo de dados (resumo)

`organization` é a raiz multi-tenant; tudo pendura em `client`. Entidades principais, derivadas
diretamente da planilha e da operação do CRM:

- **Núcleo/CRM:** `organization`, `app_user` (papéis), `client`, `meeting`, `report`
- **Planejamento:** `financial_plan` — **uma versão por período de acompanhamento** — e tudo
  que pendura nela: `plan_income` / `plan_expense`, `plan_change`, `plan_pension`,
  `plan_insurance`, `debt`, `goal`, `asset`, `liability`, `investment`, `retirement_plan`,
  `projection`. O realizado fica à parte, em `monthly_record` → `income_entry` /
  `expense_entry` / `card_statement`, com `budget_category` / `budget_target`.
- **Investimentos:** `investment`, `rendafixa_link`
- **Gamificação:** `point_event`, `referral`, `reward`, `reward_redemption` (e `client.pontos_total` / `client.tier` — níveis Bronze/Prata/Ouro)

> O diagrama entidade-relacionamento completo está em [`docs/plano-arquitetura.html`](docs/plano-arquitetura.html).

## 🚀 Tecnologias

- **[Next.js](https://nextjs.org/) (App Router)** — roteamento, Server Actions e renderização.
  ⚠️ Esta versão do Next tem mudanças importantes — consulte `node_modules/next/dist/docs/` e o
  `AGENTS.md` antes de codar.
- **[React](https://react.dev/)** — interfaces reativas.
- **[Supabase](https://supabase.com/)** — Postgres, autenticação, storage e RLS.
- **[Tailwind CSS v4](https://tailwindcss.com/)** — estilização utilitária.
- **[Lucide React](https://lucide.dev/)** — ícones.
- **[TypeScript](https://www.typescriptlang.org/)** — tipagem estática.

## 🛠️ Como executar localmente

```bash
npm install
cp .env.example .env.local     # e preencha as chaves do Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O acesso é por convite:
o primeiro admin é criado conforme `supabase/README.md`.

### Verificação

```bash
npm run verificar    # tipos + lint + testes
npm test             # só os testes
npm run paridade     # só com o fixture local — ver a nota de privacidade abaixo
```

> **Antes de publicar, verifique contra a árvore versionada, não contra a sua
> cópia local.** Arquivos em `.gitignore` existem na sua máquina e não no build
> da Vercel: um `import` para um deles passa no `tsc` local e quebra o deploy.
> Para reproduzir o que a Vercel vê:
>
> ```bash
> git ls-files -c -o --exclude-standard | while read f; do
>   mkdir -p /tmp/arvore/$(dirname "$f"); cp "$f" /tmp/arvore/"$f"
> done
> cd /tmp/arvore && npm ci && npm run build
> ```

## ▲ Publicação na Vercel

1. **Importe o repositório** na Vercel. O preset Next.js já resolve build e
   saída; não há `vercel.json` porque não há nada de fora do padrão.
2. **Cadastre as variáveis** de `.env.example` em *Settings → Environment
   Variables*, nos três ambientes (Production, Preview, Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DEFAULT_ORG_ID`
3. **Libere a URL no Supabase**, em *Authentication → URL Configuration*:
   a URL de produção em `Site URL`, e `https://*.vercel.app/**` em
   `Redirect URLs` para os previews funcionarem. Sem isso o link de
   confirmação de e-mail volta para `localhost`.
4. **Aplique as migrações** ao projeto Supabase de produção, na ordem de
   `supabase/migrations/`, antes do primeiro acesso.

Notas do ambiente:

- O runtime é **Node.js**, não Edge — `src/proxy.ts` usa o cliente SSR do
  Supabase, que precisa de Node.
- `serverActions.bodySizeLimit` está em 3 MB por causa do upload de foto de
  perfil (o padrão de 1 MB rejeitava imagens de 1,5 MB antes da validação).
- O relatório mensal é **HTML preparado para impressão**, não um PDF montado no
  servidor: um Chromium headless em função serverless custaria dezenas de
  megabytes por geração para produzir o que o navegador já produz.
- O servidor roda em UTC. Nenhum cálculo depende disso — o motor recebe o mês
  do plano, nunca do relógio.

## 📁 Estrutura de pastas (principais)

- `src/app/` — rotas e layouts (App Router).
  - `(hub)/` — casca do hub, visão geral e lista de clientes.
  - `clientes/[id]/` — painel individual do cliente.
    - `cadastro/` — quem é a pessoa e as premissas do plano.
    - `planejamento/` — o espaço de trabalho por período: fluxo de caixa,
      patrimônio, objetivos e mudanças, com o filtro de período no canto.
    - `acompanhamento/` — projeções, aposentadoria, metas congeladas e o
      fechamento mês a mês.
    - `relatorios/[mes]/` — o documento de 5 páginas de cada mês.
- `src/lib/planning/` — **o motor**: funções puras, sem I/O. É onde vive a
  tradução da planilha em código.
- `src/lib/forms/` — esquema dos formulários, compartilhado entre tela e
  Server Action.
- `src/lib/planning-dal.ts` — leitura; `src/lib/actions/` — escrita.
- `docs/` — plano mestre, plano de tradução da planilha e relatório de paridade.
- `past/` — planilha e relatório de referência. **Não versionado**: contém dados
  reais de cliente.

> ⚠️ **Este repositório é público.** Nada derivado de `past/` pode ser
> commitado. O `.gitignore` cobre o fixture do cliente de referência, o SQL de
> carga e o relatório de paridade; os testes versionados usam o cliente
> fictício `src/lib/planning/__fixtures__/exemplo.json`.

---

*Modernizando a rotina de planejamento financeiro da consultoria — de planilhas a uma plataforma.*
