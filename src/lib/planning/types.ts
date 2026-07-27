import type { YearMonth } from "./period";

export type ValueMode = "nominal" | "real";
export type Frequency = "mensal" | "anual";
export type ExpenseBucket = "fixo" | "extra" | "parcela" | "adicional";
export type ChangeCategory = "receita" | "despesa" | "divida";
export type GoalTerm = "curto" | "longo";

export interface Assumptions {
  /** Primeiro mês projetado. */
  inicio: YearMonth;
  modoValor: ValueMode;
  jurosCurto: number;
  jurosLongo: number;
  inflacao: number;
  jurosAposentadoria: number;
  idadeLimite: number;
  mesesCurto: number;
}

export interface IncomeLine {
  fonte: string;
  /** Valor CHEIO. Anual não vem dividido por 12 — ver Achado 6. */
  valor: number;
  frequencia: Frequency;
  mesOcorrencia: number | null;
}

export interface ExpenseLine {
  categoria: string;
  grupo: string;
  descricao?: string | null;
  valor: number;
  frequencia: Frequency;
  mesOcorrencia: number | null;
  bucket: "fixo" | "extra";
}

export interface DebtLine {
  descricao: string;
  parcela: number;
  inicio: YearMonth | null;
  /** Último mês com parcela. `null` = ainda sem data — tratada como perpétua. */
  fim: YearMonth | null;
}

export interface NamedAmount {
  nome: string;
  valor: number;
}

export interface GoalLine {
  titulo: string;
  prazo: GoalTerm;
  /** Positivo = consome patrimônio. Negativo = entrada (ex.: "dinheiro a receber"). */
  alvo: number;
  dataAlvo: YearMonth | null;
  periodicidadeAnos: number | null;
  concluido: boolean;
}

export interface ChangeLine {
  titulo: string;
  /** Efeito no fluxo a partir de `inicio`. Positivo melhora, negativo piora. */
  valor: number;
  categoria: ChangeCategory;
  inicio: YearMonth;
  fim: YearMonth | null;
  observacao?: string | null;
}

export interface RetirementInput {
  idadeAlvo: number;
  rendaInss: number;
  rendaDesejada: number;
}

export interface PlanInput {
  assumptions: Assumptions;
  /** `YYYY-MM-DD`. Necessário para saber quando a aposentadoria começa. */
  nascimento: string;
  incomes: IncomeLine[];
  expenses: ExpenseLine[];
  debts: DebtLine[];
  pensions: NamedAmount[];
  insurances: NamedAmount[];
  goals: GoalLine[];
  changes: ChangeLine[];
  /** Patrimônio investido no mês zero. */
  patrimonioInicial: number;
  retirement: RetirementInput;
}

/** Uma linha da projeção — as colunas de `PROJEÇÃO CURTA`. */
export interface ProjectionMonth {
  periodo: YearMonth;
  receitas: number;
  despesas: number;
  dividas: number;
  previdencia: number;
  sobras: number;
  objetivos: number;
  patrimonio: number;
  observacoes: string[];
}

export interface ProjectionYear {
  ano: number;
  receitas: number;
  despesas: number;
  dividas: number;
  previdencia: number;
  sobras: number;
  objetivos: number;
  /** Patrimônio ao fim do ano. */
  patrimonio: number;
  idade: number;
  observacoes: string[];
}

export interface RetirementOutcome {
  anoAposentadoria: number;
  idadeAlvo: number;
  patrimonioNaAposentadoria: number;
  rendaInss: number;
  rendaPrivada: number;
  rendaTotal: number;
  rendaDesejada: number;
  /** Primeiro ano com patrimônio negativo, ou `null` se o dinheiro não acaba. */
  anoDeRuina: number | null;
  idadeDeRuina: number | null;
}

export interface BudgetBucketSummary {
  bucket: ExpenseBucket;
  rotulo: string;
  total: number;
  percentual: number;
  linhas: { nome: string; valor: number; percentual: number }[];
}

export interface BaselineSummary {
  /** Receita dos meses sem nada de anual — o "MÊS COMUM" da planilha. */
  receitaMensal: number;
  receitaAnualTotal: number;
  receitaTotalMensalizada: number;
  despesaMensal: number;
  despesaAnualTotal: number;
  despesaTotalMensalizada: number;
  parcelasMensais: number;
  previdenciaMensal: number;
  seguroMensal: number;
  sobrasMensais: number;
  sobrasMesComum: number;
  orcamento: BudgetBucketSummary[];
  orcamentoTotal: number;
}
