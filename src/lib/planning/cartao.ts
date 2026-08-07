import type { YearMonth } from "./period";

/**
 * A fatura projetada do cartão.
 *
 * Não existe tabela de agenda de parcelas: uma compra em N vezes é três
 * colunas (valor da parcela, quantidade, mês da primeira), e a fatura de um
 * mês é derivada — a mesma mecânica de `parcelasEm` que o motor já usa para
 * dívidas. Materializar as parcelas geraria 12 linhas a partir de 3 números e
 * duas verdades para manter em dia.
 */

export interface CardPurchaseLine {
  descricao: string;
  cartao: string;
  valorParcela: number;
  parcelas: number;
  /** Mês da primeira parcela. */
  inicio: YearMonth;
}

/** Uma compra tem parcela caindo no mês `p`? */
export function parcelaAtiva(compra: CardPurchaseLine, p: YearMonth): boolean {
  return p >= compra.inicio && p < compra.inicio + compra.parcelas;
}

/** A fatura total (todos os cartões) do mês `p`. */
export function faturaEm(compras: CardPurchaseLine[], p: YearMonth): number {
  return compras.reduce(
    (total, c) => total + (parcelaAtiva(c, p) ? c.valorParcela : 0),
    0,
  );
}

/**
 * A matriz cartão × mês da tela: para cada cartão, a fatura em cada mês da
 * janela. Cartões saem na ordem alfabética para a tabela não trocar as linhas
 * de lugar a cada edição.
 */
export function faturasPorCartao(
  compras: CardPurchaseLine[],
  meses: YearMonth[],
): { cartao: string; valores: number[] }[] {
  const nomes = [...new Set(compras.map((c) => c.cartao))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

  return nomes.map((nome) => {
    const doCartao = compras.filter((c) => c.cartao === nome);
    return { cartao: nome, valores: meses.map((p) => faturaEm(doCartao, p)) };
  });
}
