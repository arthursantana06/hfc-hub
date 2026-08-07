/**
 * Esquema dos formulários do planejamento.
 *
 * Uma definição só, usada pelos dois lados: o componente cliente monta os campos
 * a partir dela, e a Server Action valida contra ela. Sem isso os dois saem de
 * sincronia — e a divergência aparece como um campo que a tela deixa preencher
 * mas o servidor descarta em silêncio.
 *
 * Este arquivo NÃO é `server-only`: é importado por componentes client.
 */

export type TipoCampo =
  | "texto"
  | "moeda"
  | "inteiro"
  | "mes"
  /** Dia exato — vencimento, data de aplicação. `mes` só dá mês e ano. */
  | "data"
  /** Número fracionário não monetário: 110 (% do CDI), 6,2 (IPCA+), 250 (cotas). */
  | "decimal"
  /** Quadradinhos de janeiro a dezembro — a despesa que cai em meses escolhidos. */
  | "meses"
  | "select"
  | "ref"
  | "bool";

export interface Campo {
  key: string;
  label: string;
  tipo: TipoCampo;
  obrigatorio?: boolean;
  ajuda?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  /** Sufixo mostrado dentro do campo — "% do CDI", "a.a.". Só decoração. */
  sufixo?: string;
  opcoes?: { valor: string; rotulo: string }[];
  /** Fonte das opções resolvida em tempo de execução (ex.: categorias da org). */
  fonte?: "categoria";
  /** Campo só aparece — e só é gravado — quando outro campo tem certo valor. */
  visivelSe?: { campo: string; valor: string };
  /**
   * O campo aparece e é validado, mas NÃO é coluna da tabela da entidade — quem
   * decide o que fazer com ele é a Server Action da entidade.
   *
   * Existe por causa do valor de uma posição: ele pertence a
   * `position_snapshot`, com a data ao lado, e não à posição. Sem isto o
   * formulário teria de perguntar o valor numa segunda tela, o que é pior de
   * usar e não descreve melhor o domínio.
   */
  virtual?: boolean;
  /** Largura na grade do formulário. */
  span?: 1 | 2;
  /**
   * Valor inicial de uma linha criada pelo grid (a "linha fantasma" do rodapé).
   *
   * O diálogo antigo não precisava disto: o formulário só gravava no envio, com
   * tudo preenchido. O grid cria a linha assim que a primeira célula é digitada,
   * e os demais campos obrigatórios precisam nascer com um valor válido.
   */
  padrao?: string;
}

/** Lista branca das tabelas que os formulários genéricos podem tocar. */
export type TabelaEditavel =
  | "plan_income"
  | "plan_expense"
  | "debt"
  | "goal"
  | "plan_change"
  | "asset"
  | "liability"
  | "investment"
  | "plan_pension"
  | "plan_insurance"
  | "income_entry"
  | "expense_entry"
  | "card_statement"
  | "report_directive"
  | "investment_account"
  | "investment_position"
  | "plan_expense_category"
  | "plan_card_purchase";

export interface Entidade {
  tabela: TabelaEditavel;
  /**
   * De onde vêm as chaves estrangeiras obrigatórias.
   *
   * `registro` é o fechamento de um mês; `relatorio` é o documento gerado a
   * partir dele. Os dois só existem depois que o mês é aberto.
   *
   * `conta` é a conta de investimento: a posição pertence a ela, não ao período
   * do plano. A carteira real não se clona a cada reunião — ela é a mesma coisa
   * vista em datas diferentes, e é o `position_snapshot` que carrega a data.
   */
  escopo: "plano" | "cliente" | "registro" | "relatorio" | "conta";
  /**
   * Só para `escopo: "plano"`: a tabela também tem `client_id not null` e
   * precisa recebê-lo ao gravar.
   *
   * São as tabelas que nasceram penduradas no cliente (dívida, objetivo, ativo,
   * passivo, carteira) e passaram a pertencer ao período na Fase 2. A coluna
   * antiga continua lá e continua obrigatória — o insert precisa das duas.
   */
  vinculaAoCliente?: boolean;
  singular: string;
  plural: string;
  campos: Campo[];
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
].map((rotulo, i) => ({ valor: String(i + 1), rotulo }));

const FREQUENCIA: Campo = {
  key: "frequencia",
  label: "Frequência",
  tipo: "select",
  obrigatorio: true,
  // Mensal é o caso de longe mais comum, e a linha fantasma do grid precisa
  // nascer com um valor válido para a criação não travar na obrigatoriedade.
  padrao: "mensal",
  opcoes: [
    { valor: "mensal", rotulo: "Mensal" },
    { valor: "anual", rotulo: "Anual" },
    { valor: "meses", rotulo: "Meses escolhidos" },
  ],
};

const MES_OCORRENCIA: Campo = {
  key: "mes_ocorrencia",
  label: "Mês de ocorrência",
  tipo: "select",
  obrigatorio: true,
  opcoes: MESES,
  visivelSe: { campo: "frequencia", valor: "anual" },
  ajuda: "Em que mês o valor cheio entra ou sai.",
};

/**
 * Os quadradinhos de janeiro a dezembro.
 *
 * Existe porque metade das despesas anuais não é anual de verdade: o IPVA vem
 * em três parcelas, o material escolar em duas, o seguro em quatro. Guardar
 * isso como "anual ÷ 12" acerta a média e erra o caixa dos meses em que a
 * parcela realmente sai — que é onde o cliente sente o aperto.
 */
const MESES_ESCOLHIDOS: Campo = {
  key: "meses",
  label: "Em que meses",
  tipo: "meses",
  obrigatorio: true,
  span: 2,
  visivelSe: { campo: "frequencia", valor: "meses" },
  ajuda: "O valor acima é o de CADA parcela, não o total do ano.",
};

export const ENTIDADES: Record<string, Entidade> = {
  receita: {
    tabela: "plan_income",
    escopo: "plano",
    singular: "Receita",
    plural: "Receitas",
    campos: [
      { key: "fonte", label: "Fonte", tipo: "texto", obrigatorio: true, span: 2, placeholder: "Plantões, salário, aluguel…" },
      {
        key: "valor",
        label: "Valor",
        tipo: "moeda",
        obrigatorio: true,
        ajuda: "Valor cheio. Uma receita anual não entra dividida por 12.",
      },
      FREQUENCIA,
      MES_OCORRENCIA,
      MESES_ESCOLHIDOS,
      {
        key: "derivado",
        label: "Tipo",
        tipo: "select",
        opcoes: [
          { valor: "", rotulo: "Comum" },
          { valor: "decimo_terceiro", rotulo: "13º salário" },
          { valor: "ferias", rotulo: "Férias" },
        ],
        visivelSe: { campo: "frequencia", valor: "anual" },
      },
    ],
  },

  // A categoria não é campo da linha: é o bloco do grid a que a linha pertence
  // (`plan_expense_category`), passado como vínculo `__categoriaPlanId` na
  // criação. Um select de categoria aqui obrigaria cada linha a redeclarar o
  // bloco em que ela já está visualmente.
  despesa: {
    tabela: "plan_expense",
    escopo: "plano",
    singular: "Despesa",
    plural: "Despesas",
    campos: [
      { key: "descricao", label: "Nome", tipo: "texto", obrigatorio: true, span: 2, placeholder: "Aluguel, supermercado…" },
      { key: "valor", label: "Valor", tipo: "moeda", obrigatorio: true },
      {
        key: "bucket",
        label: "Controlabilidade",
        tipo: "select",
        obrigatorio: true,
        padrao: "fixo",
        opcoes: [
          // No banco o enum continua `fixo|extra` (0013). O rótulo mudou para o
          // vocabulário do modelo novo; renomear o enum custaria migração e um
          // toque no motor para trocar uma palavra que o cliente nunca vê.
          { valor: "fixo", rotulo: "Fixo" },
          { valor: "extra", rotulo: "Variável" },
        ],
        ajuda: "Fixo é o que não dá para cortar no mês; variável é o que dá.",
      },
      {
        key: "pagamento",
        label: "Pagamento",
        tipo: "select",
        obrigatorio: true,
        padrao: "debito",
        opcoes: [
          { valor: "debito", rotulo: "Débito" },
          { valor: "credito", rotulo: "Crédito" },
        ],
        ajuda: "Crédito compõe a leitura de fatura; débito sai direto do fluxo.",
      },
      FREQUENCIA,
      MES_OCORRENCIA,
      MESES_ESCOLHIDOS,
    ],
  },

  // O bloco do grid de Despesa. Uma entidade mínima de propósito: o título
  // editável do bloco é o único campo, e o resto (ordem, linhagem) é do sistema.
  categoria_despesa: {
    tabela: "plan_expense_category",
    escopo: "plano",
    singular: "Categoria",
    plural: "Categorias",
    campos: [
      { key: "nome", label: "Categoria", tipo: "texto", obrigatorio: true, span: 2, placeholder: "Moradia, Transporte, Filhos…" },
    ],
  },

  compra_cartao: {
    tabela: "plan_card_purchase",
    escopo: "plano",
    singular: "Compra parcelada",
    plural: "Compras parceladas",
    campos: [
      { key: "descricao", label: "Compra", tipo: "texto", obrigatorio: true, span: 2, placeholder: "Sofá, passagem aérea…" },
      { key: "cartao", label: "Cartão", tipo: "texto", obrigatorio: true, placeholder: "Nubank, Itaú…" },
      {
        key: "valor_parcela",
        label: "Valor da parcela",
        tipo: "moeda",
        obrigatorio: true,
        ajuda: "De CADA parcela, não o total da compra.",
      },
      { key: "parcelas", label: "Nº de parcelas", tipo: "inteiro", obrigatorio: true, min: 1, max: 120, padrao: "1" },
      { key: "inicio", label: "Primeira parcela", tipo: "mes", obrigatorio: true },
    ],
  },

  divida: {
    tabela: "debt",
    escopo: "plano",
    vinculaAoCliente: true,
    singular: "Dívida",
    plural: "Dívidas",
    campos: [
      { key: "descricao", label: "Descrição", tipo: "texto", obrigatorio: true, span: 2 },
      { key: "parcela", label: "Parcela mensal", tipo: "moeda", obrigatorio: true },
      { key: "credor", label: "Credor", tipo: "texto" },
      { key: "inicio", label: "Primeira parcela", tipo: "mes" },
      {
        key: "fim",
        label: "Última parcela",
        tipo: "mes",
        ajuda: "Sem isto a projeção trata a dívida como perpétua.",
      },
      {
        key: "saldo",
        label: "Saldo devedor",
        tipo: "moeda",
        span: 2,
        ajuda:
          "Quanto ainda se deve, como está no extrato. É este valor que entra no passivo do balanço. Em branco, estimamos por parcela × meses restantes.",
      },
    ],
  },

  objetivo: {
    tabela: "goal",
    escopo: "plano",
    vinculaAoCliente: true,
    singular: "Objetivo",
    plural: "Objetivos",
    campos: [
      { key: "titulo", label: "Objetivo", tipo: "texto", obrigatorio: true, span: 2 },
      {
        key: "prazo",
        label: "Tipo",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { valor: "curto", rotulo: "Evento único — acontece uma vez" },
          { valor: "longo", rotulo: "Recorrente — se repete a cada N anos" },
        ],
      },
      {
        key: "alvo",
        label: "Valor",
        tipo: "moeda",
        obrigatorio: true,
        ajuda: "Negativo quando é entrada de dinheiro, não compra.",
      },
      {
        key: "data_alvo",
        label: "Quando",
        tipo: "mes",
        obrigatorio: true,
        visivelSe: { campo: "prazo", valor: "curto" },
      },
      {
        key: "periodicidade_anos",
        label: "A cada quantos anos",
        tipo: "inteiro",
        obrigatorio: true,
        min: 1,
        max: 50,
        visivelSe: { campo: "prazo", valor: "longo" },
      },
      { key: "concluido", label: "Já concluído", tipo: "bool" },
    ],
  },

  mudanca: {
    tabela: "plan_change",
    escopo: "plano",
    singular: "Mudança",
    plural: "Mudanças",
    campos: [
      { key: "titulo", label: "O que muda", tipo: "texto", obrigatorio: true, span: 2, placeholder: "Deixar de pagar aluguel, redução de trabalho…" },
      {
        key: "valor",
        label: "Efeito no caixa",
        tipo: "moeda",
        obrigatorio: true,
        ajuda: "Positivo melhora o fluxo, negativo piora — em qualquer categoria.",
      },
      {
        key: "categoria",
        label: "Categoria",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { valor: "receita", rotulo: "Receita" },
          { valor: "despesa", rotulo: "Despesa" },
          { valor: "divida", rotulo: "Dívida" },
        ],
      },
      { key: "inicio", label: "A partir de", tipo: "mes", obrigatorio: true },
      { key: "fim", label: "Até", tipo: "mes", ajuda: "Em branco = vale para sempre." },
      { key: "observacao", label: "Observação", tipo: "texto", span: 2, placeholder: "Aparece na projeção" },
    ],
  },

  ativo: {
    tabela: "asset",
    escopo: "plano",
    vinculaAoCliente: true,
    singular: "Ativo",
    plural: "Ativos",
    campos: [
      {
        key: "nome",
        label: "Ativo",
        tipo: "texto",
        obrigatorio: true,
        span: 2,
        placeholder: "Imóvel, veículo, participação…",
      },
      {
        key: "valor",
        label: "Valor",
        tipo: "moeda",
        obrigatorio: true,
        ajuda: "Bens que não rendem juros. A carteira investida tem lista própria.",
      },
    ],
  },

  passivo: {
    tabela: "liability",
    escopo: "plano",
    vinculaAoCliente: true,
    singular: "Passivo",
    plural: "Passivos",
    campos: [
      {
        key: "nome",
        label: "Passivo",
        tipo: "texto",
        obrigatorio: true,
        span: 2,
        placeholder: "Empréstimo com familiar, tributo em aberto…",
      },
      {
        key: "valor",
        label: "Valor",
        tipo: "moeda",
        obrigatorio: true,
        ajuda: "Só o que NÃO tem parcela mensal — o que tem, cadastre como dívida.",
      },
    ],
  },

  investimento: {
    tabela: "investment",
    escopo: "plano",
    vinculaAoCliente: true,
    singular: "Investimento",
    plural: "Investimentos",
    campos: [
      { key: "nome", label: "Nome", tipo: "texto", obrigatorio: true, span: 2 },
      {
        key: "classe",
        label: "Classe",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { valor: "renda_fixa", rotulo: "Renda Fixa" },
          { valor: "renda_variavel", rotulo: "Renda Variável" },
          { valor: "previdencia", rotulo: "Previdência" },
        ],
      },
      { key: "valor", label: "Valor", tipo: "moeda", obrigatorio: true },
      { key: "instituicao", label: "Instituição", tipo: "texto" },
      { key: "liquidez", label: "Liquidez", tipo: "texto", placeholder: "D+0, 90 dias…" },
    ],
  },

  previdencia: {
    tabela: "plan_pension",
    escopo: "plano",
    singular: "Contribuição",
    plural: "Previdência",
    campos: [
      { key: "nome", label: "Plano", tipo: "texto", obrigatorio: true, span: 2, placeholder: "INSS, previdência privada…" },
      { key: "valor", label: "Contribuição mensal", tipo: "moeda", obrigatorio: true },
    ],
  },

  receita_realizada: {
    tabela: "income_entry",
    escopo: "registro",
    singular: "Receita do mês",
    plural: "Receitas realizadas",
    campos: [
      { key: "fonte", label: "Fonte", tipo: "texto", obrigatorio: true, span: 2 },
      { key: "valor", label: "Valor recebido", tipo: "moeda", obrigatorio: true },
    ],
  },

  despesa_realizada: {
    tabela: "expense_entry",
    escopo: "registro",
    singular: "Gasto do mês",
    plural: "Gastos realizados",
    campos: [
      { key: "categoria_id", label: "Categoria", tipo: "ref", fonte: "categoria", obrigatorio: true, span: 2 },
      { key: "descricao", label: "Descrição", tipo: "texto", span: 2 },
      { key: "valor", label: "Valor gasto", tipo: "moeda", obrigatorio: true },
      {
        key: "bucket",
        label: "Balde",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { valor: "fixo", rotulo: "Custo fixo" },
          { valor: "extra", rotulo: "Gasto extra" },
          { valor: "parcela", rotulo: "Parcela" },
          { valor: "adicional", rotulo: "Adicional do mês" },
        ],
      },
    ],
  },

  fatura: {
    tabela: "card_statement",
    escopo: "registro",
    singular: "Fatura",
    plural: "Faturas",
    campos: [
      { key: "cartao", label: "Cartão", tipo: "texto", obrigatorio: true, placeholder: "Itaú, Porto Seguro…" },
      {
        key: "categoria",
        label: "Categoria da fatura",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { valor: "alimentacao", rotulo: "Alimentação" },
          { valor: "transporte", rotulo: "Transporte" },
          { valor: "compras", rotulo: "Compras" },
          { valor: "saude", rotulo: "Saúde" },
          { valor: "vestuario", rotulo: "Vestuário" },
          { valor: "lazer", rotulo: "Lazer" },
          { valor: "outros", rotulo: "Outros" },
        ],
      },
      { key: "valor", label: "Valor", tipo: "moeda", obrigatorio: true, span: 2 },
    ],
  },

  direcionamento: {
    tabela: "report_directive",
    escopo: "relatorio",
    singular: "Direcionamento",
    plural: "Direcionamentos",
    campos: [
      {
        key: "texto",
        label: "Direcionamento",
        tipo: "texto",
        obrigatorio: true,
        span: 2,
        placeholder: "Juntar R$1.000 ao longo do mês…",
        ajuda: "Vai para a última página do relatório, como orientação do mês seguinte.",
      },
    ],
  },

  seguro: {
    tabela: "plan_insurance",
    escopo: "plano",
    singular: "Seguro",
    plural: "Seguros",
    campos: [
      { key: "nome", label: "Seguro", tipo: "texto", obrigatorio: true, span: 2, placeholder: "Seguro de vida…" },
      { key: "valor", label: "Prêmio mensal", tipo: "moeda", obrigatorio: true },
    ],
  },

  // ── Investimentos ────────────────────────────────────────────
  // A conta não tem campo "Ativo": desmarcada, uma caixa não viaja no FormData,
  // então um campo booleano num formulário novo nasceria falso e criaria contas
  // encerradas. Encerrar conta é ação de tela, não campo de cadastro.
  conta_investimento: {
    tabela: "investment_account",
    escopo: "cliente",
    singular: "Conta",
    plural: "Contas",
    campos: [
      {
        key: "apelido",
        label: "Apelido",
        tipo: "texto",
        obrigatorio: true,
        span: 2,
        placeholder: "XP — conta principal",
        ajuda: "Como esta conta é chamada na conversa com o cliente.",
      },
      { key: "instituicao", label: "Instituição", tipo: "texto", obrigatorio: true, placeholder: "XP, BTG Pactual…" },
      { key: "numero", label: "Número da conta", tipo: "texto", placeholder: "Opcional" },
      {
        key: "titular_tipo",
        label: "Titular",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { valor: "pf", rotulo: "Pessoa física (CPF)" },
          { valor: "pj", rotulo: "Pessoa jurídica (CNPJ)" },
        ],
        ajuda: "O tratamento fiscal difere entre os dois.",
      },
      { key: "custodiante", label: "Custodiante", tipo: "texto", placeholder: "Opcional — quando difere da instituição" },
    ],
  },

  posicao: {
    tabela: "investment_position",
    escopo: "conta",
    vinculaAoCliente: true,
    singular: "Posição",
    plural: "Posições",
    campos: [
      {
        key: "nome",
        label: "Ativo",
        tipo: "texto",
        obrigatorio: true,
        span: 2,
        placeholder: "CDB Banco Master 2027",
      },
      {
        key: "classe",
        label: "Classe",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { valor: "renda_fixa", rotulo: "Renda Fixa" },
          { valor: "renda_variavel", rotulo: "Renda Variável" },
          { valor: "previdencia", rotulo: "Previdência" },
        ],
        ajuda: "O mesmo eixo da alocação do patrimônio.",
      },
      {
        key: "tipo_instrumento",
        label: "Tipo",
        tipo: "texto",
        placeholder: "CDB, LCI, Tesouro IPCA+, FII…",
      },
      // O valor e a data andam juntos de propósito: um valor sem data é um
      // número que envelhece em silêncio. Ambos vão para position_snapshot.
      {
        key: "valor_bruto",
        label: "Valor atual",
        tipo: "moeda",
        obrigatorio: true,
        virtual: true,
        ajuda: "Quanto vale hoje, bruto.",
      },
      {
        key: "data_referencia",
        label: "Data da posição",
        tipo: "data",
        obrigatorio: true,
        virtual: true,
        ajuda: "A que dia este valor se refere. É esta data que a tela mostra.",
      },
      { key: "emissor_nome", label: "Emissor", tipo: "texto", placeholder: "Banco Master, Tesouro Nacional…" },
      {
        key: "indexador",
        label: "Indexador",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { valor: "cdi", rotulo: "CDI" },
          { valor: "ipca", rotulo: "IPCA+" },
          { valor: "prefixado", rotulo: "Prefixado" },
          { valor: "selic", rotulo: "Selic" },
          { valor: "nao_aplica", rotulo: "Não se aplica" },
        ],
      },
      {
        key: "taxa",
        label: "Taxa",
        tipo: "decimal",
        ajuda: "110 = 110% do CDI · 6,2 = IPCA + 6,2% · 11,5 = 11,5% prefixado.",
      },
      { key: "quantidade", label: "Quantidade", tipo: "decimal", ajuda: "Cotas ou papéis. Deixe vazio na renda fixa." },
      {
        key: "custo",
        label: "Custo de aquisição",
        tipo: "moeda",
        ajuda: "Base do imposto. Nenhum importador traz este campo — ele é sempre seu.",
      },
      { key: "data_aplicacao", label: "Data da aplicação", tipo: "data" },
      {
        key: "vencimento",
        label: "Vencimento",
        tipo: "data",
        ajuda: "Alimenta o calendário de vencimentos. Vazio = sem vencimento.",
      },
      { key: "liquidez", label: "Liquidez", tipo: "texto", placeholder: "D+0, 90 dias…" },
      { key: "isento_ir", label: "Isento de IR", tipo: "bool", ajuda: "LCI, LCA, debênture incentivada." },
      { key: "coberto_fgc", label: "Coberto pelo FGC", tipo: "bool" },
    ],
  },
};

export type ChaveEntidade = keyof typeof ENTIDADES;

// ─────────────────────────────────────────────────────────────
// Conversões
// ─────────────────────────────────────────────────────────────

/**
 * Lê um valor monetário digitado por gente.
 *
 * Aceita "1.234,56", "1234,56", "1234.56" e "R$ 1.234,56". A regra: se há
 * vírgula, ela é o separador decimal e os pontos são de milhar — que é o
 * inverso do que `Number()` assume, e a origem de erros de mil vezes.
 */
export function lerMoeda(bruto: string): number | null {
  const limpo = bruto.replace(/[^\d,.-]/g, "").trim();
  if (limpo === "" || limpo === "-") return null;

  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo.replace(/\./g, "");

  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

/** 1234.5 → "1.234,50" — o formato que o campo de edição mostra. */
export function escreverMoeda(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Lê os meses marcados nos quadradinhos.
 *
 * Chegam como "1,2,3" num campo escondido — uma string em vez de doze
 * checkboxes com o mesmo `name`, para que o valor sobreviva à ida e volta pelo
 * `FormData` na mesma forma em que a coluna `smallint[]` o guarda.
 *
 * Devolve `null` para entrada inválida (e não uma lista vazia): quem chama
 * precisa distinguir "não escolheu nada" de "escolheu errado".
 */
export function lerMeses(bruto: string): number[] | null {
  const partes = bruto
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const meses: number[] = [];
  for (const p of partes) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 1 || n > 12) return null;
    if (!meses.includes(n)) meses.push(n);
  }
  return meses.sort((a, b) => a - b);
}

export function escreverMeses(meses: number[] | null | undefined): string {
  return (meses ?? []).join(",");
}

/** "jan · fev · mar" — como a lista mostra os meses marcados. */
export function rotuloDosMeses(meses: number[] | null | undefined): string {
  const curtos = (meses ?? []).map((m) => MESES[m - 1]?.rotulo.slice(0, 3).toLowerCase());
  return curtos.filter(Boolean).join(" · ");
}

/** `<input type="month">` devolve "YYYY-MM"; a coluna é `date`. */
export function mesParaData(mes: string): string | null {
  return /^\d{4}-\d{2}$/.test(mes) ? `${mes}-01` : null;
}

/**
 * Valida a data que o DatePicker devolve, em "YYYY-MM-DD".
 *
 * Confere o dia de verdade, e não só o formato: "2026-02-31" casa com a regex e
 * o Postgres rejeitaria com uma mensagem que ninguém quer ver numa tela.
 */
export function lerData(bruto: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bruto)) return null;
  const [ano, mes, dia] = bruto.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  const real =
    d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
  return real ? bruto : null;
}

/**
 * Número fracionário não monetário, como a tela o mostra.
 *
 * Sem forçar duas casas como `escreverMoeda`: uma taxa de 110% do CDI é "110",
 * não "110,00", e uma quantidade de cotas pode ter seis casas.
 */
export function escreverDecimal(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 6 });
}

export function dataParaMes(data: string | null | undefined): string {
  return data ? data.slice(0, 7) : "";
}

/** Campos que somem por `visivelSe` não devem ser gravados. */
export function camposVisiveis(entidade: Entidade, valores: Record<string, unknown>) {
  return entidade.campos.filter(
    (c) => !c.visivelSe || String(valores[c.visivelSe.campo] ?? "") === c.visivelSe.valor,
  );
}

/**
 * O que ainda falta para a linha poder ser gravada.
 *
 * Existe por causa dos campos que só nascem obrigatórios depois de outra
 * escolha: marcar a frequência como "meses escolhidos" torna `meses`
 * obrigatório, e nesse instante a linha fica momentaneamente inválida. O grid
 * grava a cada célula confirmada, então sem esta checagem ele mandaria a linha
 * incompleta ao servidor, tomaria o erro e reverteria a escolha — apagando
 * justamente a frequência que a pessoa acabou de escolher, e escondendo de
 * novo o campo que ela precisa preencher.
 *
 * `bool` fica de fora: uma caixa desmarcada é uma resposta, não uma ausência.
 */
export function camposPendentes(
  entidade: Entidade,
  valores: Record<string, unknown>,
): Campo[] {
  return camposVisiveis(entidade, valores).filter(
    (c) =>
      c.obrigatorio &&
      c.tipo !== "bool" &&
      String(valores[c.key] ?? "").trim() === "",
  );
}

/**
 * Converte uma linha do banco nos textos que as células do grid mostram.
 *
 * O inverso de `converter`: moeda vira "1.234,56", `date` de mês vira
 * "YYYY-MM", `smallint[]` vira "1,2,3". Uma função só, ao lado do esquema,
 * para que um tipo novo de campo obrigue a decidir as duas direções juntas.
 */
export function valoresDoRegistro(
  entidade: Entidade,
  registro: Record<string, unknown>,
): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const c of entidade.campos) {
    const v = registro[c.key];
    if (v === null || v === undefined) {
      valores[c.key] = "";
      continue;
    }
    switch (c.tipo) {
      case "moeda":
        valores[c.key] = escreverMoeda(Number(v));
        break;
      case "decimal":
        valores[c.key] = escreverDecimal(Number(v));
        break;
      case "mes":
        valores[c.key] = dataParaMes(String(v));
        break;
      case "meses":
        valores[c.key] = escreverMeses(v as number[]);
        break;
      case "bool":
        valores[c.key] = v ? "true" : "";
        break;
      default:
        valores[c.key] = String(v);
    }
  }
  return valores;
}

// ─────────────────────────────────────────────────────────────
// Validação — o mesmo caminho para o diálogo e para o grid
// ─────────────────────────────────────────────────────────────
// Moradia original: `actions/planejamento.ts`. Mudaram para cá quando o grid
// nasceu: um arquivo `"use server"` só pode exportar funções assíncronas, e
// tanto a action do diálogo quanto a do grid precisam DESTA validação —
// duplicá-la recriaria exatamente a dessincronia que este módulo existe para
// impedir.

/** `undefined` sinaliza formato inválido; `null` é ausência legítima. */
export function converter(c: Campo, bruto: string): unknown {
  if (c.tipo === "bool") return bruto === "on" || bruto === "true";
  if (bruto === "") return null;

  switch (c.tipo) {
    case "moeda": {
      const n = lerMoeda(bruto);
      return n === null ? undefined : n;
    }
    case "inteiro": {
      const n = Number(bruto);
      if (!Number.isInteger(n)) return undefined;
      if (c.min !== undefined && n < c.min) return undefined;
      if (c.max !== undefined && n > c.max) return undefined;
      return n;
    }
    case "mes":
      return mesParaData(bruto) ?? undefined;
    case "data":
      return lerData(bruto) ?? undefined;
    case "decimal": {
      // Mesma leitura do monetário: quem digita "6,2" num teclado pt-BR quer
      // seis inteiros e dois décimos, não seis mil e duzentos.
      const n = lerMoeda(bruto);
      if (n === null) return undefined;
      if (c.min !== undefined && n < c.min) return undefined;
      if (c.max !== undefined && n > c.max) return undefined;
      return n;
    }
    case "meses": {
      const meses = lerMeses(bruto);
      return meses === null || meses.length === 0 ? undefined : meses;
    }
    case "select":
      return c.opcoes?.some((o) => o.valor === bruto) ? bruto || null : undefined;
    default:
      return bruto;
  }
}

/**
 * Converte o formulário no registro, campo a campo, contra o esquema.
 *
 * Nada que não esteja no esquema atravessa: o nome da tabela vem de uma lista
 * branca e as colunas vêm da definição da entidade, nunca do que o navegador
 * mandou. Sem isso, um `role=admin` extra no FormData seria gravado.
 */
export function montarRegistro(
  entidade: Entidade,
  form: FormData,
):
  | { dados: Record<string, unknown>; virtuais: Record<string, unknown> }
  | { erro: string } {
  const brutos: Record<string, string> = {};
  for (const c of entidade.campos) {
    brutos[c.key] = String(form.get(c.key) ?? "");
  }

  const dados: Record<string, unknown> = {};
  // Campos que passam pela mesma validação mas não são coluna desta tabela —
  // quem decide o destino deles é a action da entidade.
  const virtuais: Record<string, unknown> = {};
  const visiveis = camposVisiveis(entidade, brutos);

  // Campo escondido por `visivelSe` é apagado de propósito: um objetivo que
  // deixa de ser de curto prazo não pode manter a data-alvo antiga.
  for (const c of entidade.campos) {
    if (!visiveis.includes(c) && !c.virtual) dados[c.key] = null;
  }

  for (const c of visiveis) {
    const bruto = brutos[c.key].trim();

    if (c.obrigatorio && bruto === "" && c.tipo !== "bool") {
      return { erro: `Preencha "${c.label}".` };
    }

    const valor = converter(c, bruto);
    if (valor === undefined) {
      return { erro: `"${c.label}" está em formato inválido.` };
    }
    if (c.virtual) virtuais[c.key] = valor;
    else dados[c.key] = valor;
  }

  return { dados, virtuais };
}
