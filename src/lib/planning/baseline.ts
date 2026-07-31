import type {
  BaselineSummary,
  BudgetBucketSummary,
  ExpenseBucket,
  PlanInput,
} from "./types";

const soma = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

/** Uma linha de receita ou custo, no que interessa para mensalizar. */
type LinhaPeriodica = {
  valor: number;
  frequencia: string;
  meses?: number[] | null;
};

/**
 * Quantas vezes por ano a linha acontece.
 *
 * `meses` é a frequência caótica: o IPVA em três parcelas acontece 3 vezes,
 * não 1 nem 12. Sem esta contagem o rateio erraria por um fator de 3.
 */
export function ocorrenciasNoAno(l: LinhaPeriodica): number {
  if (l.frequencia === "mensal") return 12;
  if (l.frequencia === "meses") return l.meses?.length ?? 0;
  return 1;
}

/** O que a linha custa no ano inteiro. */
export const totalNoAno = (l: LinhaPeriodica) => l.valor * ocorrenciasNoAno(l);

/**
 * O valor da linha diluído num mês típico.
 *
 * É o número que soma com os outros na mesma coluna — e o único jeito honesto
 * de comparar um aluguel mensal com um IPVA em três parcelas.
 */
export const mensalizar = (l: LinhaPeriodica) => totalNoAno(l) / 12;

/**
 * A linha de base do plano — o bloco superior de `PLANILHA MENSAL`.
 *
 * A distinção que importa: o "mês comum" exclui tudo que é anual. Um mês comum
 * não tem 13º nem IPVA; eles voltam cheios no mês em que caem. A planilha
 * guardava o valor já dividido por 12 e reconstituía com `SUMIF(...)*12`;
 * aqui guardamos o valor cheio e dividimos só quando queremos a média.
 */
export function summarizeBaseline(plan: PlanInput): BaselineSummary {
  // "Mês comum" = o mês sem nada de calendário. Tudo que depende do mês do ano
  // — anual ou em meses escolhidos — sai daqui e volta cheio no mês em que cai.
  const doMesComum = (l: { frequencia: string }) => l.frequencia === "mensal";

  const receitasMensais = plan.incomes.filter(doMesComum);
  const receitasSazonais = plan.incomes.filter((i) => !doMesComum(i));
  const despesasMensais = plan.expenses.filter(doMesComum);
  const despesasSazonais = plan.expenses.filter((e) => !doMesComum(e));

  const receitaMensal = soma(receitasMensais.map((i) => i.valor));
  const receitaAnualTotal = soma(receitasSazonais.map(totalNoAno));
  const despesaMensal = soma(despesasMensais.map((e) => e.valor));
  const despesaAnualTotal = soma(despesasSazonais.map(totalNoAno));

  const parcelasMensais = soma(plan.debts.map((d) => d.parcela));
  const previdenciaMensal = soma(plan.pensions.map((p) => p.valor));
  const seguroMensal = soma(plan.insurances.map((s) => s.valor));

  const receitaTotalMensalizada = receitaMensal + receitaAnualTotal / 12;
  const despesaTotalMensalizada = despesaMensal + despesaAnualTotal / 12;

  return {
    receitaMensal,
    receitaAnualTotal,
    receitaTotalMensalizada,
    despesaMensal,
    despesaAnualTotal,
    despesaTotalMensalizada,
    parcelasMensais,
    previdenciaMensal,
    seguroMensal,
    sobrasMensais:
      receitaTotalMensalizada -
      despesaTotalMensalizada -
      parcelasMensais -
      previdenciaMensal -
      seguroMensal,
    sobrasMesComum:
      receitaMensal - despesaMensal - parcelasMensais - previdenciaMensal - seguroMensal,
    ...buildBudget(plan),
  };
}

const ROTULO: Record<ExpenseBucket, string> = {
  fixo: "Custos Fixos",
  extra: "Gastos extras",
  parcela: "Parcelas",
  adicional: "Adicionais do mês",
};

/**
 * O bloco ORÇAMENTO: os mesmos custos vistos por controlabilidade em vez de
 * natureza (Achado 7).
 *
 * `fixo` e `extra` vêm das linhas de custo; `parcela` vem das dívidas. O balde
 * `adicional` fica vazio na linha de base por definição — ele é o que aparece
 * de extraordinário num mês específico, e vive nas mudanças de curto prazo.
 */
function buildBudget(plan: PlanInput): {
  orcamento: BudgetBucketSummary[];
  orcamentoTotal: number;
} {
  const porBucket = new Map<ExpenseBucket, { nome: string; valor: number }[]>([
    ["fixo", []],
    ["extra", []],
    ["parcela", []],
    ["adicional", []],
  ]);

  for (const e of plan.expenses) {
    // O que não é mensal entra rateado: o orçamento responde "quanto custa um
    // mês típico", e um IPVA em três parcelas custa 3/12 de si mesmo por mês.
    porBucket.get(e.bucket)!.push({
      nome: e.descricao || e.categoria,
      valor: mensalizar(e),
    });
  }
  for (const d of plan.debts) {
    porBucket.get("parcela")!.push({ nome: d.descricao, valor: d.parcela });
  }

  const totais = new Map<ExpenseBucket, number>();
  for (const [bucket, linhas] of porBucket) {
    totais.set(bucket, soma(linhas.map((l) => l.valor)));
  }
  const orcamentoTotal = soma([...totais.values()]);
  const pct = (v: number) => (orcamentoTotal === 0 ? 0 : v / orcamentoTotal);

  const orcamento: BudgetBucketSummary[] = [...porBucket].map(([bucket, linhas]) => ({
    bucket,
    rotulo: ROTULO[bucket],
    total: totais.get(bucket)!,
    percentual: pct(totais.get(bucket)!),
    linhas: linhas
      .sort((a, b) => b.valor - a.valor)
      .map((l) => ({ ...l, percentual: pct(l.valor) })),
  }));

  return { orcamento, orcamentoTotal };
}
