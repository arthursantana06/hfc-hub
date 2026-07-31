import type { YearMonth } from "./period";

export type ValueMode = "nominal" | "real";
/**
 * `meses` é a despesa (ou receita) que cai em meses escolhidos do ano.
 *
 * O IPVA é anual, mas muita gente o paga em três parcelas entre janeiro e
 * março. Guardar isso como "anual/12" acerta a média e erra o caixa dos meses
 * em que a parcela de fato sai — que é justamente onde o cliente sente.
 */
export type Frequency = "mensal" | "anual" | "meses";
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
  /** Meses (1–12) em que o valor entra, quando a frequência é `meses`. */
  meses?: number[] | null;
}

export interface ExpenseLine {
  categoria: string;
  grupo: string;
  descricao?: string | null;
  valor: number;
  frequencia: Frequency;
  mesOcorrencia: number | null;
  /** Meses (1–12) em que o valor sai, quando a frequência é `meses`. */
  meses?: number[] | null;
  bucket: "fixo" | "extra";
}

export interface DebtLine {
  descricao: string;
  parcela: number;
  inicio: YearMonth | null;
  /** Último mês com parcela. `null` = ainda sem data — tratada como perpétua. */
  fim: YearMonth | null;
  /** Quanto ainda se deve. `null` = estimar por parcela × meses restantes. */
  saldo?: number | null;
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
  /** Patrimônio investido no mês zero — a carteira, e só ela, é o que rende. */
  patrimonioInicial: number;
  /** Bens que não estão investidos (imóvel, veículo). Não rendem na projeção. */
  ativosNaoInvestidos: number;
  /** Passivos sem parcela mensal. Os que têm parcela vivem em `debts`. */
  passivosDeclarados: number;
  retirement: RetirementInput;
}

/**
 * O balanço patrimonial como as telas o mostram.
 *
 * A carteira investida é ATIVO: até a Fase 2 ela ficava fora do patrimônio
 * líquido, embora a projeção partisse dela — o cliente via dois números que
 * deveriam ser o mesmo. E o saldo devedor das dívidas é PASSIVO, sem precisar
 * ser redigitado: a dívida já sabe quanto falta pagar.
 */
export interface BalanceSummary {
  ativosNaoInvestidos: number;
  carteira: number;
  ativos: number;
  passivosDeclarados: number;
  saldoDevedor: number;
  passivos: number;
  liquido: number;
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
