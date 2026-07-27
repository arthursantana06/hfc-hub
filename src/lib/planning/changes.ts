import { anoDe, mesDe, type YearMonth } from "./period";
import type { ChangeCategory, ChangeLine, GoalLine, PlanInput } from "./types";

export interface MonthlyDelta {
  receita: number;
  despesa: number;
  divida: number;
  /** Negativo consome patrimônio; positivo é entrada. */
  objetivo: number;
  observacoes: string[];
}

const ZERO: MonthlyDelta = {
  receita: 0,
  despesa: 0,
  divida: 0,
  objetivo: 0,
  observacoes: [],
};

const ativa = (c: ChangeLine, p: YearMonth) =>
  c.inicio <= p && (c.fim === null || p <= c.fim);

/**
 * Expande as mudanças e os objetivos em deltas mês a mês.
 *
 * Substitui a aba `objetivos planilha` inteira — 242 linhas de `SUMIFS` que não
 * guardavam informação nenhuma, só reexpressavam as duas tabelas de mudanças.
 */
export function expandChanges(plan: PlanInput): Map<YearMonth, MonthlyDelta> {
  const mapa = new Map<YearMonth, MonthlyDelta>();

  const em = (p: YearMonth): MonthlyDelta => {
    let d = mapa.get(p);
    if (!d) {
      d = { ...ZERO, observacoes: [] };
      mapa.set(p, d);
    }
    return d;
  };

  for (const c of plan.changes) {
    // Uma mudança sem fim vale até o horizonte; o motor só consulta os meses
    // que projeta, então não precisamos materializar o infinito.
    const fim = c.fim ?? c.inicio;
    for (let p = c.inicio; p <= fim; p++) {
      const d = em(p);
      d[c.categoria] += c.valor;
      if (c.observacao && p === c.inicio) d.observacoes.push(c.observacao);
    }
  }

  for (const g of plan.goals) {
    if (g.concluido) continue;
    if (g.prazo === "curto" && g.dataAlvo !== null) {
      // Sinal invertido: um objetivo com valor positivo é uma saída de caixa.
      em(g.dataAlvo).objetivo -= g.alvo;
      em(g.dataAlvo).observacoes.push(g.titulo);
    }
  }

  return mapa;
}

/**
 * Delta de um mês, já considerando mudanças sem data de fim.
 *
 * `expandChanges` só materializa a janela declarada; as perpétuas precisam ser
 * somadas na consulta, senão sumiriam depois do `fim` fictício.
 */
export function deltaEm(
  plan: PlanInput,
  expandido: Map<YearMonth, MonthlyDelta>,
  p: YearMonth,
): MonthlyDelta {
  const base = expandido.get(p);
  const out: MonthlyDelta = {
    receita: 0,
    despesa: 0,
    divida: 0,
    objetivo: base?.objetivo ?? 0,
    observacoes: base ? [...base.observacoes] : [],
  };

  for (const c of plan.changes) {
    if (ativa(c, p)) out[c.categoria] += c.valor;
  }

  // Objetivos de longo prazo: a compra que se repete a cada N anos. A planilha
  // testa `(ano - 1 - anoInicial) % N == 0` — mantido, é regra e não defeito.
  for (const g of plan.goals) {
    if (g.concluido || g.prazo !== "longo" || !g.periodicidadeAnos) continue;
    if (mesDe(p) !== 12) continue; // a compra recorrente cai no fim do ano
    const desde = anoDe(p) - 1 - anoDe(plan.assumptions.inicio);
    if (desde >= 0 && desde % g.periodicidadeAnos === 0) {
      out.objetivo -= g.alvo;
    }
  }

  return out;
}

/** Total vitalício de um objetivo recorrente — o que a planilha mostra em TOTAL. */
export function totalVitalicio(g: GoalLine, idadeAtual: number, idadeLimite = 100): number {
  if (g.prazo !== "longo" || !g.periodicidadeAnos) return g.alvo;
  return (g.alvo * (idadeLimite - idadeAtual)) / g.periodicidadeAnos;
}

export type { ChangeCategory };
