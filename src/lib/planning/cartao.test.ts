import { describe, expect, it } from "vitest";
import { faturaEm, faturasPorCartao, type CardPurchaseLine } from "./cartao";
import { fromISO } from "./period";

const compra = (
  inicio: string,
  parcelas: number,
  valorParcela: number,
  cartao = "Nubank",
): CardPurchaseLine => ({
  descricao: "compra",
  cartao,
  valorParcela,
  parcelas,
  inicio: fromISO(inicio),
});

describe("fatura projetada do cartão", () => {
  it("parcela única cai só no mês da compra", () => {
    const compras = [compra("2026-08-01", 1, 500)];
    expect(faturaEm(compras, fromISO("2026-07-01"))).toBe(0);
    expect(faturaEm(compras, fromISO("2026-08-01"))).toBe(500);
    expect(faturaEm(compras, fromISO("2026-09-01"))).toBe(0);
  });

  it("compra em 10x atravessa a virada do ano sem perder parcela", () => {
    // O erro clássico de somar meses via Date: novembro + 2 virar março.
    // Como YearMonth é inteiro, a janela precisa sair exata: nov/26 a ago/27.
    const compras = [compra("2026-11-01", 10, 300)];

    expect(faturaEm(compras, fromISO("2026-10-01"))).toBe(0); // antes
    expect(faturaEm(compras, fromISO("2026-11-01"))).toBe(300); // 1ª
    expect(faturaEm(compras, fromISO("2027-01-01"))).toBe(300); // atravessou o ano
    expect(faturaEm(compras, fromISO("2027-08-01"))).toBe(300); // 10ª e última
    expect(faturaEm(compras, fromISO("2027-09-01"))).toBe(0); // acabou
  });

  it("compra com início futuro não aparece antes da hora", () => {
    const compras = [compra("2027-01-01", 3, 100)];
    expect(faturaEm(compras, fromISO("2026-12-01"))).toBe(0);
    expect(faturaEm(compras, fromISO("2027-01-01"))).toBe(100);
  });

  it("duas compras no mesmo cartão somam na mesma fatura", () => {
    const compras = [
      compra("2026-08-01", 10, 500),
      compra("2026-09-01", 3, 200),
    ];
    expect(faturaEm(compras, fromISO("2026-08-01"))).toBe(500);
    expect(faturaEm(compras, fromISO("2026-09-01"))).toBe(700);
    expect(faturaEm(compras, fromISO("2026-12-01"))).toBe(500); // a 3x acabou em nov
  });

  it("a matriz separa por cartão e mantém ordem estável", () => {
    // Ordem alfabética, não de digitação: a tabela não pode trocar as linhas
    // de lugar a cada edição do grid.
    const compras = [
      compra("2026-08-01", 2, 100, "XP"),
      compra("2026-08-01", 2, 50, "Itaú"),
    ];
    const meses = [fromISO("2026-08-01"), fromISO("2026-09-01"), fromISO("2026-10-01")];
    const matriz = faturasPorCartao(compras, meses);

    expect(matriz.map((c) => c.cartao)).toEqual(["Itaú", "XP"]);
    expect(matriz[0].valores).toEqual([50, 50, 0]);
    expect(matriz[1].valores).toEqual([100, 100, 0]);
  });
});
