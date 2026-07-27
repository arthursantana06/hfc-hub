import type {
  BaselineSummary,
  BudgetBucketSummary,
  ExpenseBucket,
  PlanInput,
} from "./types";

const soma = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

/**
 * A linha de base do plano — o bloco superior de `PLANILHA MENSAL`.
 *
 * A distinção que importa: o "mês comum" exclui tudo que é anual. Um mês comum
 * não tem 13º nem IPVA; eles voltam cheios no mês em que caem. A planilha
 * guardava o valor já dividido por 12 e reconstituía com `SUMIF(...)*12`;
 * aqui guardamos o valor cheio e dividimos só quando queremos a média.
 */
export function summarizeBaseline(plan: PlanInput): BaselineSummary {
  const receitasMensais = plan.incomes.filter((i) => i.frequencia === "mensal");
  const receitasAnuais = plan.incomes.filter((i) => i.frequencia === "anual");
  const despesasMensais = plan.expenses.filter((e) => e.frequencia === "mensal");
  const despesasAnuais = plan.expenses.filter((e) => e.frequencia === "anual");

  const receitaMensal = soma(receitasMensais.map((i) => i.valor));
  const receitaAnualTotal = soma(receitasAnuais.map((i) => i.valor));
  const despesaMensal = soma(despesasMensais.map((e) => e.valor));
  const despesaAnualTotal = soma(despesasAnuais.map((e) => e.valor));

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
    // Anual entra rateado: o orçamento responde "quanto custa um mês típico".
    const valor = e.frequencia === "anual" ? e.valor / 12 : e.valor;
    porBucket.get(e.bucket)!.push({ nome: e.descricao || e.categoria, valor });
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
