import { describe, expect, it } from "vitest";
import bruto from "./__fixtures__/exemplo.json";
import { carregarFixture, type FixtureBruto } from "./__fixtures__/carregar";
import { mensalizar, ocorrenciasNoAno, summarizeBaseline } from "./baseline";
import { summarizeBalance, saldoDevedorEm } from "./balance";
import { project } from "./project";
import { ym } from "./period";
import type { PlanInput } from "./types";

const base = carregarFixture(bruto as unknown as FixtureBruto);

/**
 * A despesa "caótica": o IPVA que o cliente paga em três parcelas, e não de
 * uma vez. É o caso que a planilha nunca soube representar — ela guardava o
 * anual dividido por 12 e o caixa de janeiro a março saía errado.
 */
describe("frequência em meses escolhidos", () => {
  it("conta uma ocorrência por mês marcado", () => {
    expect(ocorrenciasNoAno({ valor: 100, frequencia: "mensal" })).toBe(12);
    expect(ocorrenciasNoAno({ valor: 100, frequencia: "anual" })).toBe(1);
    expect(ocorrenciasNoAno({ valor: 100, frequencia: "meses", meses: [1, 2, 3] })).toBe(3);
    expect(ocorrenciasNoAno({ valor: 100, frequencia: "meses", meses: null })).toBe(0);
  });

  it("mensaliza pelo total do ano, não pela parcela", () => {
    // 1.200 em três parcelas custam 3.600 no ano, 300 por mês típico.
    expect(mensalizar({ valor: 1200, frequencia: "meses", meses: [1, 2, 3] })).toBe(300);
  });

  it("três parcelas custam o mesmo que o anual equivalente", () => {
    const anual = comDespesa(base, {
      valor: 3600,
      frequencia: "anual",
      mesOcorrencia: 1,
      meses: null,
    });
    const parcelado = comDespesa(base, {
      valor: 1200,
      frequencia: "meses",
      mesOcorrencia: null,
      meses: [1, 2, 3],
    });

    expect(summarizeBaseline(parcelado).despesaTotalMensalizada).toBeCloseTo(
      summarizeBaseline(anual).despesaTotalMensalizada,
      6,
    );
  });

  it("mas o caixa sente a diferença mês a mês", () => {
    const parcelado = comDespesa(base, {
      valor: 1200,
      frequencia: "meses",
      mesOcorrencia: null,
      meses: [1, 2, 3],
    });

    const meses = new Map(project(parcelado).meses.map((m) => [m.periodo, m]));
    const jan = meses.get(ym(2027, 1))!;
    const fev = meses.get(ym(2027, 2))!;
    const abr = meses.get(ym(2027, 4))!;

    // Janeiro e fevereiro carregam a parcela; abril não carrega nada.
    expect(abr.despesas - jan.despesas).toBeCloseTo(1200, 4);
    expect(jan.despesas).toBeCloseTo(fev.despesas, 4);
  });
});

/**
 * O balanço: a carteira é ativo e a dívida é passivo, sem redigitação.
 */
describe("balanço patrimonial", () => {
  const plano: PlanInput = {
    ...base,
    patrimonioInicial: 100_000,
    ativosNaoInvestidos: 400_000,
    passivosDeclarados: 20_000,
    debts: [
      {
        descricao: "Financiamento",
        parcela: 1_000,
        inicio: ym(2026, 1),
        fim: ym(2026, 12),
        saldo: null,
      },
    ],
    assumptions: { ...base.assumptions, inicio: ym(2026, 7) },
  };

  it("soma a carteira nos ativos", () => {
    expect(summarizeBalance(plano).ativos).toBe(500_000);
  });

  it("o saldo devedor entra no passivo sem cadastro à parte", () => {
    // De julho a dezembro faltam 6 parcelas de 1.000.
    const b = summarizeBalance(plano);
    expect(b.saldoDevedor).toBe(6_000);
    expect(b.passivos).toBe(26_000);
    expect(b.liquido).toBe(474_000);
  });

  it("o saldo informado ganha da estimativa", () => {
    const comSaldo = summarizeBalance({
      ...plano,
      debts: [{ ...plano.debts[0], saldo: 5_500 }],
    });
    expect(comSaldo.saldoDevedor).toBe(5_500);
  });

  it("dívida sem última parcela não inventa passivo", () => {
    const perpetua = {
      descricao: "Cartão rotativo",
      parcela: 800,
      inicio: ym(2026, 1),
      fim: null,
      saldo: null,
    };
    expect(saldoDevedorEm(perpetua, ym(2026, 7))).toBe(0);
  });

  it("uma dívida que ainda não começou conta do começo dela", () => {
    const futura = {
      descricao: "Consórcio",
      parcela: 500,
      inicio: ym(2027, 1),
      fim: ym(2027, 4),
      saldo: null,
    };
    expect(saldoDevedorEm(futura, ym(2026, 7))).toBe(2_000);
  });
});

type LinhaDespesa = {
  valor: number;
  frequencia: PlanInput["expenses"][number]["frequencia"];
  mesOcorrencia: number | null;
  meses: number[] | null;
};

/** O plano do fixture com UMA despesa, para isolar o efeito da frequência. */
function comDespesa(plano: PlanInput, linha: LinhaDespesa): PlanInput {
  return {
    ...plano,
    expenses: [
      {
        categoria: "IPVA",
        grupo: "transporte",
        bucket: "fixo",
        ...linha,
      },
    ],
  };
}
