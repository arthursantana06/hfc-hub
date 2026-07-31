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
  opcoes?: { valor: string; rotulo: string }[];
  /** Fonte das opções resolvida em tempo de execução (ex.: categorias da org). */
  fonte?: "categoria";
  /** Campo só aparece — e só é gravado — quando outro campo tem certo valor. */
  visivelSe?: { campo: string; valor: string };
  /** Largura na grade do formulário. */
  span?: 1 | 2;
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
  | "report_directive";

export interface Entidade {
  tabela: TabelaEditavel;
  /**
   * De onde vêm as chaves estrangeiras obrigatórias.
   *
   * `registro` é o fechamento de um mês; `relatorio` é o documento gerado a
   * partir dele. Os dois só existem depois que o mês é aberto.
   */
  escopo: "plano" | "cliente" | "registro" | "relatorio";
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

  despesa: {
    tabela: "plan_expense",
    escopo: "plano",
    singular: "Custo",
    plural: "Custos",
    campos: [
      { key: "categoria_id", label: "Categoria", tipo: "ref", fonte: "categoria", obrigatorio: true, span: 2 },
      { key: "descricao", label: "Descrição", tipo: "texto", span: 2, placeholder: "Opcional — detalha a categoria" },
      { key: "valor", label: "Valor", tipo: "moeda", obrigatorio: true },
      {
        key: "bucket",
        label: "Controlabilidade",
        tipo: "select",
        obrigatorio: true,
        opcoes: [
          { valor: "fixo", rotulo: "Custo fixo" },
          { valor: "extra", rotulo: "Gasto extra" },
        ],
        ajuda: "Fixo é o que não dá para cortar no mês; extra é o que dá.",
      },
      FREQUENCIA,
      MES_OCORRENCIA,
      MESES_ESCOLHIDOS,
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
    : limpo;

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

export function dataParaMes(data: string | null | undefined): string {
  return data ? data.slice(0, 7) : "";
}

/** Campos que somem por `visivelSe` não devem ser gravados. */
export function camposVisiveis(entidade: Entidade, valores: Record<string, unknown>) {
  return entidade.campos.filter(
    (c) => !c.visivelSe || String(valores[c.visivelSe.campo] ?? "") === c.visivelSe.valor,
  );
}
