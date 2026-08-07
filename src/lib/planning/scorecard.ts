import type { YearMonth } from "./period";
import type { ProjectionMonth } from "./types";

export type ScoreMetric = "receitas" | "despesas" | "sobras" | "investimentos";

export interface ScoreLine {
  metrica: ScoreMetric;
  rotulo: string;
  realizado: number;
  meta: number;
  /** realizado / meta. `null` quando a meta é zero. */
  atingido: number | null;
  estrelas: number;
  /** Por que a nota é essa — vai para a tela e para o relatório. */
  leitura: string;
}

const ROTULO: Record<ScoreMetric, string> = {
  receitas: "Receitas",
  despesas: "Despesas",
  sobras: "Sobras",
  investimentos: "Investimentos",
};

/**
 * Métricas em que superar a meta é bom, não desvio.
 *
 * Sobrar mais do que o planejado é uma boa notícia. Gastar mais do que o
 * planejado não é — e era exatamente aí que a planilha errava, dando cinco
 * estrelas para um mês que estourou o orçamento em 15%.
 */
const SUPERAR_E_BOM: ScoreMetric[] = ["sobras", "investimentos"];

/**
 * Faixas por desvio ABSOLUTO da meta, não por percentual atingido.
 *
 * Acertar o plano é o objetivo; desviar para qualquer lado é desvio. Uma
 * receita 40% acima do previsto merece conversa tanto quanto uma 40% abaixo —
 * ou o plano estava errado, ou entrou dinheiro que ninguém planejou onde alocar.
 */
const FAIXAS: { desvioMax: number; estrelas: number }[] = [
  { desvioMax: 0.05, estrelas: 5 },
  { desvioMax: 0.1, estrelas: 4 },
  { desvioMax: 0.2, estrelas: 3 },
  { desvioMax: 0.35, estrelas: 2 },
  { desvioMax: Infinity, estrelas: 1 },
];

export function estrelasPara(metrica: ScoreMetric, atingido: number | null): number {
  if (atingido === null) return 0;
  if (SUPERAR_E_BOM.includes(metrica) && atingido >= 1) return 5;

  const desvio = Math.abs(atingido - 1);
  // A margem absorve o ruído de ponto flutuante: `1.05 - 1` dá 0,050000000000000044,
  // e sem ela um mês exatamente 5% fora cairia na faixa de baixo — o planejador
  // veria quatro estrelas onde a régua promete cinco.
  return FAIXAS.find((f) => desvio <= f.desvioMax + 1e-9)!.estrelas;
}

function lerNota(metrica: ScoreMetric, atingido: number | null): string {
  if (atingido === null) return "Sem meta definida para o mês.";

  const pp = Math.round(Math.abs(atingido - 1) * 1000) / 10;
  if (pp < 0.05) return "Exatamente no plano.";

  const acima = atingido > 1;
  const quanto = `${pp.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

  switch (metrica) {
    case "despesas":
      return acima
        ? `Gastou ${quanto} acima do orçado.`
        : `Gastou ${quanto} abaixo do orçado.`;
    case "receitas":
      return acima
        ? `Entrou ${quanto} a mais que o previsto.`
        : `Entrou ${quanto} a menos que o previsto.`;
    case "sobras":
      return acima ? `Sobrou ${quanto} a mais que a meta.` : `Sobrou ${quanto} a menos que a meta.`;
    case "investimentos":
      return acima
        ? `Patrimônio ${quanto} acima da meta.`
        : `Patrimônio ${quanto} abaixo da meta.`;
  }
}

/**
 * O placar de um mês: quatro métricas, realizado contra meta, com estrelas.
 *
 * A função é agnóstica quanto à origem das duas séries — ela compara o mês de
 * uma com o mesmo mês da outra. Hoje serve a dois chamadores:
 *
 * - **Acompanhamento** (modelo novo): `realizado` é a projeção do período do
 *   Planejamento Real e `meta` é a do HFC. É a leitura que o planejador abre
 *   na reunião, e o que substituiu as estrelas digitadas à mão da planilha.
 * - **Relatório mensal** (fluxo antigo): `realizado` é a projeção corrente e
 *   `meta` é a série congelada no fechamento do plano.
 *
 * Em ambos é plano contra plano, não extrato contra plano — nenhum dos dois
 * lados vem de lançamento bancário.
 */
export function buildScorecard(
  refMes: YearMonth,
  realizado: ProjectionMonth[],
  meta: ProjectionMonth[],
): ScoreLine[] {
  const atual = realizado.find((m) => m.periodo === refMes);
  const alvo = meta.find((m) => m.periodo === refMes);
  if (!atual || !alvo) return [];

  const valores = (m: ProjectionMonth): Record<ScoreMetric, number> => ({
    receitas: m.receitas,
    // Despesas somam gastos, dívidas e previdência, e viram positivo para leitura.
    despesas: -(m.despesas + m.dividas + m.previdencia),
    sobras: m.sobras,
    investimentos: m.patrimonio,
  });

  const a = valores(atual);
  const b = valores(alvo);

  return (Object.keys(ROTULO) as ScoreMetric[]).map((metrica) => {
    const feito = a[metrica];
    const previsto = b[metrica];
    const atingido = previsto === 0 ? null : feito / previsto;
    return {
      metrica,
      rotulo: ROTULO[metrica],
      realizado: feito,
      meta: previsto,
      atingido,
      estrelas: estrelasPara(metrica, atingido),
      leitura: lerNota(metrica, atingido),
    };
  });
}
