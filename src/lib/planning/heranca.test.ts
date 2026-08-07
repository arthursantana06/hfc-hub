import { describe, expect, it } from "vitest";
import { montarPeriodoReal, type LinhaHerdavel } from "./heranca";

/**
 * A herança é a regra mais delicada do produto: um erro aqui não quebra a
 * tela, corrompe o histórico do cliente em silêncio — o planejador abre a
 * reunião do mês seguinte com números que ninguém combinou. Daí a bateria.
 */

const linha = (p: Partial<LinhaHerdavel> & { id: string }): LinhaHerdavel => ({
  base_id: null,
  persistencia: "herdado",
  suprimido: false,
  descricao: "linha",
  valor: 100,
  ...p,
});

/** Acha no resultado a linha que descende de uma base do HFC. */
const descendenteDe = (novas: LinhaHerdavel[], baseId: string) =>
  novas.find((l) => l.base_id === baseId);

describe("primeiro período do Real", () => {
  it("nasce sendo o HFC inteiro, tudo herdado", () => {
    const hfc = [linha({ id: "a", valor: 100 }), linha({ id: "b", valor: 200 })];

    const novas = montarPeriodoReal(hfc, null);

    expect(novas).toHaveLength(2);
    expect(novas.map((l) => l.base_id).sort()).toEqual(["a", "b"]);
    expect(novas.every((l) => l.persistencia === "herdado")).toBe(true);
    expect(novas.every((l) => !l.suprimido)).toBe(true);
  });

  it("não traz linha que já estava suprimida no HFC", () => {
    const hfc = [linha({ id: "a" }), linha({ id: "b", suprimido: true })];
    expect(montarPeriodoReal(hfc, null)).toHaveLength(1);
  });
});

describe("o que sobrevive à virada do mês", () => {
  it("ajuste pontual reverte ao valor do HFC", () => {
    // "Neste mês o mercado custou 3.000 por causa da festa" não pode virar a
    // nova verdade do cliente.
    const hfc = [linha({ id: "a", valor: 2000 })];
    const anterior = [
      linha({ id: "p1", base_id: "a", persistencia: "mes", valor: 3000 }),
    ];

    const novas = montarPeriodoReal(hfc, anterior);

    expect(novas).toHaveLength(1);
    expect(novas[0].valor).toBe(2000);
    expect(novas[0].persistencia).toBe("herdado");
  });

  it("ajuste permanente propaga com o valor editado", () => {
    // "O aluguel subiu para 2.800 e vai ficar assim."
    const hfc = [linha({ id: "a", valor: 2500 })];
    const anterior = [
      linha({ id: "p1", base_id: "a", persistencia: "permanente", valor: 2800 }),
    ];

    const novas = montarPeriodoReal(hfc, anterior);

    expect(novas).toHaveLength(1);
    expect(novas[0].valor).toBe(2800);
    expect(novas[0].persistencia).toBe("permanente");
    // A cadeia continua apontando para o HFC, não para o mês anterior — senão
    // dois períodos bastariam para a origem se perder.
    expect(novas[0].base_id).toBe("a");
  });

  it("linha não tocada recopia FRESCA do HFC — correção no HFC alcança o Real", () => {
    const hfc = [linha({ id: "a", valor: 999 })]; // corrigido depois de o Real começar
    const anterior = [
      linha({ id: "p1", base_id: "a", persistencia: "herdado", valor: 100 }),
    ];

    expect(montarPeriodoReal(hfc, anterior)[0].valor).toBe(999);
  });
});

describe("remoções", () => {
  it("supressão pontual ressuscita no mês seguinte", () => {
    // O planejador tirou a linha só daquele mês; ela é do plano e volta.
    const hfc = [linha({ id: "a" })];
    const anterior = [
      linha({ id: "p1", base_id: "a", persistencia: "mes", suprimido: true }),
    ];

    const novas = montarPeriodoReal(hfc, anterior);

    expect(novas).toHaveLength(1);
    expect(novas[0].suprimido).toBe(false);
  });

  it("supressão permanente persiste — o tombstone viaja", () => {
    // Sem carregar o tombstone, a varredura final ressuscitaria a linha e o
    // planejador teria de removê-la de novo todo mês, para sempre.
    const hfc = [linha({ id: "a" })];
    const anterior = [
      linha({ id: "p1", base_id: "a", persistencia: "permanente", suprimido: true }),
    ];

    const novas = montarPeriodoReal(hfc, anterior);

    expect(novas).toHaveLength(1);
    expect(novas[0].suprimido).toBe(true);
    expect(descendenteDe(novas, "a")?.suprimido).toBe(true);
  });
});

describe("linhas que nascem ou somem", () => {
  it("linha criada no HFC depois entra no período seguinte", () => {
    const hfc = [linha({ id: "a" }), linha({ id: "b", descricao: "nova no HFC" })];
    const anterior = [linha({ id: "p1", base_id: "a", persistencia: "herdado" })];

    const novas = montarPeriodoReal(hfc, anterior);

    expect(novas).toHaveLength(2);
    expect(descendenteDe(novas, "b")?.descricao).toBe("nova no HFC");
  });

  it("linha avulsa pontual (sem base no HFC) some", () => {
    // Nasceu no Real como ajuste do mês e não foi fixada: era do mês.
    const hfc = [linha({ id: "a" })];
    const anterior = [
      linha({ id: "p1", base_id: "a", persistencia: "herdado" }),
      linha({ id: "p2", base_id: null, persistencia: "mes", descricao: "conserto" }),
    ];

    const novas = montarPeriodoReal(hfc, anterior);

    expect(novas).toHaveLength(1);
    expect(novas.some((l) => l.descricao === "conserto")).toBe(false);
  });

  it("linha avulsa fixada como permanente sobrevive sem base", () => {
    const hfc = [linha({ id: "a" })];
    const anterior = [
      linha({ id: "p1", base_id: "a", persistencia: "herdado" }),
      linha({ id: "p2", base_id: null, persistencia: "permanente", descricao: "pensão" }),
    ];

    const novas = montarPeriodoReal(hfc, anterior);

    expect(novas).toHaveLength(2);
    expect(novas.some((l) => l.descricao === "pensão")).toBe(true);
  });

  it("linha cuja base saiu do HFC não é herdada de novo", () => {
    const hfc: LinhaHerdavel[] = [];
    const anterior = [linha({ id: "p1", base_id: "sumida", persistencia: "herdado" })];

    expect(montarPeriodoReal(hfc, anterior)).toHaveLength(0);
  });

  it("mas o ajuste permanente sobrevive à saída da base do HFC", () => {
    // O planejador fixou o valor de propósito; apagar a linha no HFC não pode
    // desfazer uma decisão tomada na reunião.
    const hfc: LinhaHerdavel[] = [];
    const anterior = [
      linha({ id: "p1", base_id: "sumida", persistencia: "permanente", valor: 700 }),
    ];

    const novas = montarPeriodoReal(hfc, anterior);
    expect(novas).toHaveLength(1);
    expect(novas[0].valor).toBe(700);
  });
});

describe("convergência", () => {
  it("dois períodos seguidos sem edição dão exatamente o mesmo conjunto", () => {
    // Sem esta propriedade o plano derivaria sozinho a cada reunião.
    const hfc = [linha({ id: "a", valor: 10 }), linha({ id: "b", valor: 20 })];

    const p1 = montarPeriodoReal(hfc, null).map((l, i) => ({ ...l, id: `p1-${i}` }));
    const p2 = montarPeriodoReal(hfc, p1);

    const resumo = (ls: LinhaHerdavel[]) =>
      ls.map((l) => `${l.base_id}:${l.valor}:${l.persistencia}:${l.suprimido}`).sort();

    expect(resumo(p2)).toEqual(resumo(p1));
  });
});
