import { describe, expect, it } from "vitest";
import { buildScorecard, estrelasPara } from "./scorecard";
import { fromISO } from "./period";
import type { ProjectionMonth } from "./types";

/**
 * A régua decidida em 27/07/2026: desvio ABSOLUTO da meta, não percentual
 * atingido. Superar só vale 5★ em sobras e investimentos.
 *
 * A planilha de origem não tinha regra — as estrelas eram texto digitado à mão,
 * e um mês que estourou o orçamento em 15% recebia cinco estrelas. Estes testes
 * existem principalmente para impedir que isso volte.
 */
describe("régua das estrelas", () => {
  it("acertar o plano vale nota máxima em qualquer métrica", () => {
    for (const m of ["receitas", "despesas", "sobras", "investimentos"] as const) {
      expect(estrelasPara(m, 1.0)).toBe(5);
      expect(estrelasPara(m, 1.04)).toBe(5);
      expect(estrelasPara(m, 0.96)).toBe(5);
    }
  });

  it("estourar o orçamento nunca vira nota alta — o defeito da planilha", () => {
    // Gastar 15% a mais que o orçado.
    expect(estrelasPara("despesas", 1.15)).toBe(3);
    // E o simétrico: gastar 15% a menos vale a mesma nota, porque também é
    // desvio do plano — só que na direção confortável.
    expect(estrelasPara("despesas", 0.85)).toBe(3);
  });

  it("desviar para qualquer lado conta igual em receitas e despesas", () => {
    for (const m of ["receitas", "despesas"] as const) {
      expect(estrelasPara(m, 1.3)).toBe(estrelasPara(m, 0.7));
      expect(estrelasPara(m, 1.5)).toBe(estrelasPara(m, 0.5));
    }
  });

  it("superar a meta é sempre 5★ em sobras e investimentos", () => {
    for (const m of ["sobras", "investimentos"] as const) {
      expect(estrelasPara(m, 1.0)).toBe(5);
      expect(estrelasPara(m, 1.5)).toBe(5);
      expect(estrelasPara(m, 10)).toBe(5);
    }
  });

  it("ficar abaixo da meta desce a nota mesmo em sobras", () => {
    expect(estrelasPara("sobras", 0.92)).toBe(4);
    expect(estrelasPara("sobras", 0.81)).toBe(3);
    expect(estrelasPara("sobras", 0.66)).toBe(2);
    expect(estrelasPara("sobras", 0.4)).toBe(1);
  });

  it("as faixas são as decididas", () => {
    expect(estrelasPara("receitas", 1.05)).toBe(5);
    expect(estrelasPara("receitas", 1.1)).toBe(4);
    expect(estrelasPara("receitas", 1.2)).toBe(3);
    expect(estrelasPara("receitas", 1.35)).toBe(2);
    expect(estrelasPara("receitas", 1.36)).toBe(1);
  });

  it("sem meta não há nota", () => {
    expect(estrelasPara("receitas", null)).toBe(0);
  });

  it("reproduz o placar de junho/26 do caso de referência", () => {
    // Números do relatório de junho da planilha de origem.
    // A planilha dava 5★ para despesas num mês que estourou 5,4% do orçamento;
    // aqui são 4★. E o mês é mais duro do que parecia: sobras 21,3% abaixo da
    // meta e patrimônio 10,7% abaixo dão 2★ e 3★, não 3★ e 4★.
    expect(estrelasPara("receitas", 49421.14 / 49421.14)).toBe(5);
    expect(estrelasPara("despesas", 41596.14 / 39476.43)).toBe(4);
    expect(estrelasPara("sobras", 7825 / 9944.71)).toBe(2);
    expect(estrelasPara("investimentos", 34429.87 / 38549.58)).toBe(3);
  });
});

/**
 * O uso novo (Fase 2): o placar do Acompanhamento compara o período do
 * Planejamento Real com o HFC no mesmo mês. É a mesma função de sempre — o que
 * muda é de onde vêm as duas séries.
 */
describe("placar do Acompanhamento — Real contra HFC", () => {
  const mes = (periodo: number, p: Partial<ProjectionMonth>): ProjectionMonth => ({
    periodo,
    receitas: 10000,
    despesas: -6000,
    dividas: -1000,
    previdencia: -500,
    sobras: 2500,
    objetivos: 0,
    patrimonio: 100000,
    observacoes: [],
    ...p,
  });

  const refMes = fromISO("2026-08-01");

  it("mês idêntico ao HFC dá cinco estrelas nas quatro métricas", () => {
    const linhas = buildScorecard(refMes, [mes(refMes, {})], [mes(refMes, {})]);

    expect(linhas).toHaveLength(4);
    expect(linhas.every((l) => l.estrelas === 5)).toBe(true);
  });

  it("estourar a despesa no mês derruba a nota daquela métrica só", () => {
    // O Real gastou 7.800 onde o HFC previa 6.000 — 20% acima somando dívidas
    // e previdência, que é como a linha "Despesas" é composta.
    const real = [mes(refMes, { despesas: -7800 })];
    const hfc = [mes(refMes, {})];

    const linhas = buildScorecard(refMes, real, hfc);
    const por = (m: string) => linhas.find((l) => l.metrica === m)!;

    expect(por("despesas").estrelas).toBeLessThan(5);
    expect(por("despesas").leitura).toContain("acima do orçado");
    expect(por("receitas").estrelas).toBe(5);
  });

  it("sobrar mais que o combinado continua valendo nota máxima", () => {
    const real = [mes(refMes, { sobras: 4000 })];
    const hfc = [mes(refMes, { sobras: 2500 })];

    expect(buildScorecard(refMes, real, hfc).find((l) => l.metrica === "sobras")!.estrelas).toBe(5);
  });

  it("mês fora da janela de um dos lados não inventa placar", () => {
    // O período do Real pode ser anterior ao início do HFC — devolver zeros
    // ali seria mostrar "0% da meta" para um mês que ninguém planejou.
    expect(buildScorecard(refMes, [], [mes(refMes, {})])).toEqual([]);
    expect(buildScorecard(refMes, [mes(refMes, {})], [])).toEqual([]);
  });
});
