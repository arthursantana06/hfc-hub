import { summarizeBaseline } from "./baseline";
import { deltaEm, expandChanges } from "./changes";
import { anoDe, fromISO, idadeEm, mesDe, ym, type YearMonth } from "./period";
import type {
  PlanInput,
  ProjectionMonth,
  ProjectionYear,
  RetirementOutcome,
} from "./types";

export interface ProjectionResult {
  meses: ProjectionMonth[];
  /** Os primeiros `mesesCurto` — a `PROJEÇÃO CURTA`. */
  curta: ProjectionMonth[];
  /** Anos completos, agregados dos mesmos meses — a `PROJEÇÃO LONGA`. */
  longa: ProjectionYear[];
  aposentadoria: ProjectionYear[];
  desfecho: RetirementOutcome;
}

/**
 * O motor.
 *
 * Uma única passagem mensal cobre os três horizontes da planilha. Ela mantinha
 * três abas com fórmulas diferentes — e foi aí que a projeção longa acabou
 * congelando a despesa do primeiro ano num `$F$8` absoluto (Achado 3). Com uma
 * recorrência só, essa classe de divergência não tem onde nascer: curta, longa
 * e aposentadoria são recortes da mesma série.
 *
 * O que muda ao longo do tempo é a taxa de capitalização (12% → 10% → 4%) e,
 * a partir da aposentadoria, a origem da renda (trabalho → INSS).
 */
export function project(plan: PlanInput): ProjectionResult {
  const a = plan.assumptions;
  const base = summarizeBaseline(plan);
  const expandido = expandChanges(plan);

  const nascimento = fromISO(plan.nascimento);
  const inicioAposentadoria = nascimento + plan.retirement.idadeAlvo * 12;
  const fimHorizonte = nascimento + a.idadeLimite * 12;
  const fimCurto = a.inicio + a.mesesCurto - 1;

  // Receitas e despesas anuais indexadas pelo mês em que caem cheias.
  const anuaisReceita = porMes(plan.incomes);
  const anuaisDespesa = porMes(plan.expenses);

  const meses: ProjectionMonth[] = [];
  let patrimonio = plan.patrimonioInicial;

  for (let p = a.inicio; p <= fimHorizonte; p++) {
    const delta = deltaEm(plan, expandido, p);
    const aposentado = p >= inicioAposentadoria;

    // Correção do Achado 3. No modo Real os valores já estão em poder de compra
    // de hoje e a inflação sai pelo lado do retorno; no Nominal ela precisa
    // entrar aqui, senão o patrimônio cresce nominalmente contra uma despesa
    // congelada — que é exatamente o que a planilha faz.
    const anos = Math.floor((p - a.inicio) / 12);
    const correcao =
      a.modoValor === "nominal" ? Math.pow(1 + a.inflacao, anos) : 1;

    const receitaTrabalho =
      (base.receitaMensal + (anuaisReceita.get(mesDe(p)) ?? 0)) * correcao;
    const receitas = aposentado
      ? plan.retirement.rendaInss * correcao
      : receitaTrabalho + delta.receita;

    const despesas =
      -(base.despesaMensal + (anuaisDespesa.get(mesDe(p)) ?? 0) + base.seguroMensal) *
        correcao +
      delta.despesa;

    const dividas = -parcelasEm(plan, p) + delta.divida;
    const previdencia = aposentado ? 0 : -base.previdenciaMensal * correcao;

    const sobras = receitas + despesas + dividas + previdencia;
    const fator = Math.pow(
      1 + taxaEm(p, a, fimCurto, inicioAposentadoria),
      1 / 12,
    );

    patrimonio = patrimonio * fator + sobras + delta.objetivo;

    meses.push({
      periodo: p,
      receitas,
      despesas,
      dividas,
      previdencia,
      sobras,
      objetivos: delta.objetivo,
      patrimonio,
      observacoes: delta.observacoes,
    });
  }

  const anos = agruparPorAno(meses, nascimento);
  const anoAposentadoria = anoDe(inicioAposentadoria);
  const noAposentar = anos.find((y) => y.ano === anoAposentadoria);
  const patrimonioNaAposentadoria = noAposentar?.patrimonio ?? 0;

  // Renda privada = o rendimento real de um mês do patrimônio, sem consumir o
  // principal. É a leitura que a planilha mostra em APOSENTADORIA!Q11.
  const rendaPrivada =
    patrimonioNaAposentadoria * (Math.pow(1 + a.jurosAposentadoria, 1 / 12) - 1);

  const ruina = anos.find((y) => y.ano >= anoAposentadoria && y.patrimonio < 0);

  return {
    meses,
    curta: meses.filter((m) => m.periodo <= fimCurto),
    longa: anos.filter((y) => y.ano <= anoAposentadoria),
    aposentadoria: anos.filter((y) => y.ano >= anoAposentadoria),
    desfecho: {
      anoAposentadoria,
      idadeAlvo: plan.retirement.idadeAlvo,
      patrimonioNaAposentadoria,
      rendaInss: plan.retirement.rendaInss,
      rendaPrivada,
      rendaTotal: plan.retirement.rendaInss + rendaPrivada,
      rendaDesejada: plan.retirement.rendaDesejada,
      anoDeRuina: ruina?.ano ?? null,
      idadeDeRuina: ruina ? ruina.idade : null,
    },
  };
}

/** 12% nos primeiros 36 meses, 10% até a aposentadoria, 4% depois. */
function taxaEm(
  p: YearMonth,
  a: PlanInput["assumptions"],
  fimCurto: YearMonth,
  inicioAposentadoria: YearMonth,
): number {
  const nominal =
    p <= fimCurto
      ? a.jurosCurto
      : p < inicioAposentadoria
        ? a.jurosLongo
        : a.jurosAposentadoria;

  // No modo Real o retorno é descontado da inflação; no Nominal ela já foi
  // aplicada do lado das receitas e despesas. Aplicar nos dois seria contá-la
  // duas vezes.
  return a.modoValor === "real" ? (1 + nominal) / (1 + a.inflacao) - 1 : nominal;
}

function porMes(linhas: { frequencia: string; mesOcorrencia: number | null; valor: number }[]) {
  const m = new Map<number, number>();
  for (const l of linhas) {
    if (l.frequencia !== "anual" || l.mesOcorrencia === null) continue;
    m.set(l.mesOcorrencia, (m.get(l.mesOcorrencia) ?? 0) + l.valor);
  }
  return m;
}

/** Achado 1: a dívida sabe quando acaba; não depende de alguém lembrar de cancelá-la. */
function parcelasEm(plan: PlanInput, p: YearMonth): number {
  let total = 0;
  for (const d of plan.debts) {
    const comecou = d.inicio === null || d.inicio <= p;
    const naoAcabou = d.fim === null || p <= d.fim;
    if (comecou && naoAcabou) total += d.parcela;
  }
  return total;
}

function agruparPorAno(meses: ProjectionMonth[], nascimento: YearMonth): ProjectionYear[] {
  const porAno = new Map<number, ProjectionMonth[]>();
  for (const m of meses) {
    const ano = anoDe(m.periodo);
    if (!porAno.has(ano)) porAno.set(ano, []);
    porAno.get(ano)!.push(m);
  }

  return [...porAno.entries()]
    .sort(([a], [b]) => a - b)
    .map(([ano, ms]) => ({
      ano,
      receitas: soma(ms, "receitas"),
      despesas: soma(ms, "despesas"),
      dividas: soma(ms, "dividas"),
      previdencia: soma(ms, "previdencia"),
      sobras: soma(ms, "sobras"),
      objetivos: soma(ms, "objetivos"),
      // Patrimônio é estoque, não fluxo: vale o do último mês do ano.
      patrimonio: ms[ms.length - 1].patrimonio,
      idade: idadeEm(isoDe(nascimento), ym(ano, 12)),
      observacoes: ms.flatMap((m) => m.observacoes),
    }));
}

const soma = (ms: ProjectionMonth[], k: keyof ProjectionMonth) =>
  ms.reduce((acc, m) => acc + (m[k] as number), 0);

const isoDe = (p: YearMonth) =>
  `${anoDe(p)}-${String(mesDe(p)).padStart(2, "0")}-01`;

/**
 * Impressão digital da entrada que gerou uma projeção.
 *
 * Serve para a tela saber que a série congelada foi tirada de premissas
 * diferentes das de hoje — caso em que comparar realizado com meta ainda é
 * legítimo (a meta é histórica de propósito), mas o planejador precisa saber
 * que o plano mudou desde então.
 *
 * djb2 sobre o JSON: não é criptográfico e não precisa ser. A pergunta é
 * "mudou?", não "quem mudou?".
 */
export function hashDoPlano(plan: PlanInput): string {
  const texto = JSON.stringify(plan);
  let h = 5381;
  for (let i = 0; i < texto.length; i++) {
    h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}
