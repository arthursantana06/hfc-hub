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
| **Planejamento (Raio-X)** | Nativo, **dentro do CRM**: fluxo de caixa, orçamento (ideal × real), patrimônio, objetivos, linha do tempo, projeções e aposentadoria. | **MVP** (Fase 2) |
| **Análise de Investimentos** | Sistema externo **`rendafixa`** (em desenvolvimento). O Hub se integra por **API** e traz os dados. | Integração (Fase 5) |
| **Investimentos** | Adaptação do CRM focada na área de investimentos (alocação, rentabilidade, carteira). | Planejado (Fase 5) |
| **Portal do Cliente** | Ferramenta de *report* voltada ao cliente final: acompanha gastos, metas e evolução e lê os relatórios publicados (papel `client`, modo leitura). | Futuro |
| **MyFinancialGeek** | Ferramenta de *report* via **Open Finance** que, no futuro, conecta as contas bancárias do cliente e alimenta o Portal com gastos automáticos. | Futuro (fora do escopo atual) |

## 🏛️ Decisões de arquitetura (travadas no kickoff)

- **Escopo:** interno à consultoria agora, mas com `org_id` em todas as tabelas desde o dia 1 —
  pronto para virar **SaaS multi-consultoria** sem re-migração.
- **Backend:** **Supabase** (Postgres + Auth + Storage), com **Row-Level Security** por organização.
- **Acesso / papéis:** internos — **Admin · Planejador · Assistente**. O **portal do cliente** entra
  em fase posterior (o papel `client` já é reservado no modelo).
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
- **Planejamento:** `monthly_record` → `income_entry` / `expense_entry`, `budget_category`,
  `budget_target`, `debt`, `asset`, `liability`, `goal`, `timeline_event`, `retirement_plan`, `projection`
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
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O painel de clientes está em `/clientes`.

## 📁 Estrutura de pastas (principais)

- `src/app/` — rotas e layouts (App Router).
  - `(hub)/` — casca do hub e página inicial.
  - `clientes/` — Hub de Clientes (lista).
  - `clientes/[id]/` — painel individual do cliente.
    - `ponto-de-partida/` — Raio-X: visão geral, fluxo de caixa, patrimônio, objetivos, linha do tempo.
- `src/components/` — layout (sidebars, navegação) e UI.
- `src/lib/` — tipos e dados mock (temporários, a serem substituídos pelo Supabase).
- `docs/` — plano mestre e arquitetura.
- `past/` — planilha e relatório de referência (base do modelo de dados).

---

*Modernizando a rotina de planejamento financeiro da consultoria — de planilhas a uma plataforma.*
