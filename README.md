# HFC Hub - Planejador Financeiro

## 📖 Contexto do Projeto

O **HFC Hub** é uma plataforma moderna e intuitiva de planejamento e gestão financeira voltada para consultores e planejadores financeiros. O sistema centraliza as informações dos clientes, oferecendo uma visão completa e estruturada da saúde financeira, do perfil de risco e da evolução patrimonial de cada indivíduo. 

Através de uma interface limpa e focada na experiência do usuário, o HFC Hub substitui planilhas complexas por painéis interativos que facilitam a análise, a apresentação de dados e o acompanhamento de longo prazo.

## 🎯 Objetivo Final

O objetivo principal do HFC Hub é fornecer um ecossistema completo ("Hub") onde o planejador financeiro possa:
1. Cadastrar e gerenciar sua carteira de clientes de forma ágil e unificada.
2. Realizar diagnósticos financeiros precisos e traçar o "Ponto de Partida" de cada cliente.
3. Monitorar e simular metas e objetivos de vida (ex: Independência Financeira, Compra de Imóveis, etc).
4. Gerar relatórios consolidados e atrativos para agregar valor na entrega do serviço ao cliente final.

## ✨ Funcionalidades Desejadas

- **Hub de Clientes (Client Hub):**
  - Listagem geral da carteira de clientes.
  - Busca rápida e filtros.
  - Resumo de indicadores essenciais: perfil de risco, e-mail e patrimônio total.

- **Painel do Cliente - Ponto de Partida (Raio-X Financeiro):**
  - **Visão Geral:** Dashboard resumido com os 4 quadrantes principais da vida financeira.
  - **Fluxo de Caixa:** Controle detalhado de entradas, custo de vida, dívidas e capacidade mensal de aporte (investimento).
  - **Patrimônio:** Visão consolidada de Ativos e Passivos, com cálculo automático do Patrimônio Líquido.
  - **Objetivos:** Acompanhamento gamificado do progresso de metas financeiras através de barras de progresso.
  - **Linha do Tempo:** Controle de marcos, eventos futuros e datas importantes (ex: quitação de financiamento, viagens).

- **Módulos Futuros / Em Desenvolvimento:**
  - **Diagnóstico & Metas:** Análise profunda da situação atual e definição de plano de ação.
  - **Simuladores:** Ferramentas dinâmicas para projetar juros compostos, evolução patrimonial e cenários de aposentadoria.
  - **Geração de Relatórios:** Exportação do Raio-X Financeiro em PDF.
  - **Painel de Investimentos:** Acompanhamento detalhado da rentabilidade e alocação do portfólio de ativos.

## 🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando as melhores e mais recentes tecnologias do ecossistema front-end:

- **[Next.js](https://nextjs.org/):** Framework React com App Router para roteamento, renderização otimizada e facilidade de deploy.
- **[React 19](https://react.dev/):** Biblioteca base para construção de interfaces de usuário reativas.
- **[Tailwind CSS v4](https://tailwindcss.com/):** Framework CSS utilitário para estilização rápida, responsiva e padronizada.
- **[Lucide React](https://lucide.dev/):** Biblioteca de ícones moderna e customizável.
- **[TypeScript](https://www.typescriptlang.org/):** Tipagem estática para garantir um código robusto, escalável e com menos bugs.

## 🛠️ Como executar o projeto localmente

Primeiro, certifique-se de ter o Node.js instalado e instale as dependências do projeto:

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

Em seguida, inicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação rodando. O painel principal pode ser visualizado acessando a rota `/clientes`.

## 📁 Estrutura de Pastas (Principais)

- `src/app/`: Contém as rotas e layouts da aplicação (baseado no App Router do Next.js).
  - `clientes/`: Página principal do Hub de Clientes (lista de clientes).
  - `clientes/[id]/`: Layout e sub-páginas do painel individual de um cliente específico.
    - `ponto-de-partida/`: Módulo contendo as views de Visão Geral, Fluxo de Caixa, Patrimônio, Objetivos, etc.
- `src/app/globals.css`: Configurações e variáveis globais do Tailwind CSS.

---
*Desenvolvido para modernizar e facilitar a rotina de planejamento financeiro.*
