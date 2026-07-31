import type { YearMonth } from "./period";
import type { BalanceSummary, DebtLine, PlanInput } from "./types";

/**
 * O balanço patrimonial do período.
 *
 * Duas correções da Fase 2 moram aqui:
 *
 *   1. **A carteira é ativo.** Antes o patrimônio líquido era `asset − liability`
 *      e ignorava `investment` — o mesmo dinheiro que a projeção capitaliza mês
 *      a mês não aparecia no balanço. O cliente via dois patrimônios diferentes
 *      na mesma tela.
 *   2. **A dívida é passivo.** O saldo devedor entra no balanço sem ser
 *      redigitado como `liability`. Duas cópias do mesmo número divergem no
 *      primeiro mês em que alguém atualiza só uma delas.
 */
export function summarizeBalance(
  plan: Pick<
    PlanInput,
    "ativosNaoInvestidos" | "passivosDeclarados" | "patrimonioInicial" | "debts" | "assumptions"
  >,
): BalanceSummary {
  const saldoDevedor = plan.debts.reduce(
    (a, d) => a + saldoDevedorEm(d, plan.assumptions.inicio),
    0,
  );

  const ativos = plan.ativosNaoInvestidos + plan.patrimonioInicial;
  const passivos = plan.passivosDeclarados + saldoDevedor;

  return {
    ativosNaoInvestidos: plan.ativosNaoInvestidos,
    carteira: plan.patrimonioInicial,
    ativos,
    passivosDeclarados: plan.passivosDeclarados,
    saldoDevedor,
    passivos,
    liquido: ativos - passivos,
  };
}

/**
 * Quanto ainda se deve de uma dívida no mês `p`.
 *
 * O saldo informado à mão ganha de qualquer estimativa: quem tem o extrato do
 * banco sabe o número com juros embutidos, e o nosso cálculo é só o desembolso
 * que falta. Sem ele, `parcela × meses restantes` — contados de `p`, não do
 * início, senão uma dívida quase quitada seguiria pesando no balanço como no
 * dia em que foi contratada.
 *
 * Dívida sem última parcela devolve 0: a projeção já a trata como perpétua e a
 * tela avisa. Chutar um saldo aqui seria inventar passivo.
 */
export function saldoDevedorEm(d: DebtLine, p: YearMonth): number {
  if (d.saldo !== null && d.saldo !== undefined) return d.saldo;
  if (d.fim === null) return 0;

  const de = d.inicio !== null && d.inicio > p ? d.inicio : p;
  return Math.max(0, d.fim - de + 1) * d.parcela;
}
