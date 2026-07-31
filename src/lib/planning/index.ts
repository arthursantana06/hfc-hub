/**
 * Motor de planejamento financeiro.
 *
 * Funções puras: recebem a linha de base, as mudanças e as premissas; devolvem
 * as séries. Sem I/O, sem Supabase, sem `Date.now()` — o mês inicial vem do
 * plano. É o que torna a paridade contra a planilha testável célula a célula.
 */
export * from "./period";
export * from "./types";
export {
  summarizeBaseline,
  mensalizar,
  ocorrenciasNoAno,
  totalNoAno,
} from "./baseline";
export { summarizeBalance, saldoDevedorEm } from "./balance";
export { expandChanges, deltaEm, totalVitalicio } from "./changes";
export type { MonthlyDelta } from "./changes";
export { project } from "./project";
export type { ProjectionResult } from "./project";
export { buildScorecard, estrelasPara } from "./scorecard";
export type { ScoreLine, ScoreMetric } from "./scorecard";
