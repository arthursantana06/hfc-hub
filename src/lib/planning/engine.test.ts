import { describe, expect, it } from "vitest";
import bruto from "./__fixtures__/exemplo.json";
import { carregarFixture, type FixtureBruto } from "./__fixtures__/carregar";
import { summarizeBaseline } from "./baseline";
import { project, hashDoPlano } from "./project";
import { ym } from "./period";

/**
 * Testes do motor contra um cliente FICTÍCIO.
 *
 * A paridade célula a célula contra a planilha de referência vive em
 * `parity.test.ts`, que não vai para o git: o repositório é público e aquele
 * arquivo carrega a vida financeira de uma pessoa real. Aqui ficam as
 * propriedades que valem para qualquer plano — e são elas que impedem uma
 * regressão de passar despercebida em quem não tem o fixture real.
 */
const plano = carregarFixture(bruto as unknown as FixtureBruto);
const r = project(plano);
const porMes = new Map(r.meses.map((m) => [m.periodo, m]));
const base = summarizeBaseline(plano);

describe("linha de base", () => {
  it("separa o mês comum das receitas anuais", () => {
    expect(base.receitaMensal).toBe(20000);
    expect(base.receitaAnualTotal).toBe(20000);
    // 20.000 por mês mais um décimo-terceiro de 20.000 diluído.
    expect(base.receitaTotalMensalizada).toBeCloseTo(20000 + 20000 / 12, 6);
  });

  it("separa o mês comum dos custos anuais", () => {
    expect(base.despesaMensal).toBe(5500);
    expect(base.despesaTotalMensalizada).toBeCloseTo(5500 + 3600 / 12, 6);
  });

  it("o orçamento fecha em 100%", () => {
    const total = base.orcamento.reduce((a, o) => a + o.percentual, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it("as parcelas entram no balde de parcelas, não nos custos", () => {
    const parcelas = base.orcamento.find((b) => b.bucket === "parcela")!;
    expect(parcelas.total).toBe(1200);
  });
});

describe("receitas e custos anuais caem no mês certo", () => {
  it("o 13º entra cheio em dezembro e em nenhum outro mês", () => {
    const dez = porMes.get(ym(2026, 12))!;
    const nov = porMes.get(ym(2026, 11))!;
    expect(dez.receitas - nov.receitas).toBeCloseTo(20000, 6);
  });

  it("o IPVA sai cheio em janeiro", () => {
    const jan = porMes.get(ym(2027, 1))!;
    const fev = porMes.get(ym(2027, 2))!;
    expect(fev.despesas - jan.despesas).toBeCloseTo(3600, 6);
  });
});

describe("dívidas com fim próprio", () => {
  it("a parcela some no mês seguinte ao fim, sem mudança que a cancele", () => {
    expect(porMes.get(ym(2027, 12))!.dividas).toBeCloseTo(-1200, 6);
    expect(porMes.get(ym(2028, 1))!.dividas).toBeCloseTo(0, 6);
  });
});

describe("mudanças", () => {
  it("uma mudança sem fim vale até o fim do horizonte", () => {
    const antes = porMes.get(ym(2026, 12))!.receitas;
    const depois = porMes.get(ym(2027, 1))!.receitas;
    // Dezembro tem o 13º; comparar janeiro com janeiro isola a promoção.
    expect(depois - porMes.get(ym(2026, 1))!.receitas).toBeCloseTo(3000, 6);
    expect(antes).toBeGreaterThan(depois);
  });

  it("uma mudança com fim para de valer depois dele", () => {
    // Comparar com fevereiro, e não com janeiro: janeiro carrega o IPVA anual
    // e a diferença deixaria de isolar a mudança.
    const dentro = porMes.get(ym(2040, 12))!.despesas;
    const fora = porMes.get(ym(2041, 2))!.despesas;
    expect(fora - dentro).toBeCloseTo(2500, 6);
  });
});

describe("objetivos", () => {
  it("um objetivo datado sai do patrimônio no mês marcado", () => {
    expect(porMes.get(ym(2026, 12))!.objetivos).toBeCloseTo(-60000, 6);
    expect(porMes.get(ym(2026, 11))!.objetivos).toBe(0);
  });

  it("um objetivo recorrente volta a cada N anos", () => {
    const disparos = r.meses.filter((m) => m.objetivos <= -80000).length;
    expect(disparos).toBeGreaterThan(1);
  });
});

describe("coerência da série", () => {
  it("sobras = receitas + despesas + dívidas + previdência, em todo mês", () => {
    for (const m of r.meses) {
      expect(m.sobras).toBeCloseTo(
        m.receitas + m.despesas + m.dividas + m.previdencia,
        6,
      );
    }
  });

  it("a janela curta tem exatamente os meses configurados", () => {
    expect(r.curta).toHaveLength(plano.assumptions.mesesCurto);
    expect(r.curta[0].periodo).toBe(plano.assumptions.inicio);
  });

  it("o ano agregado bate com a soma dos seus meses", () => {
    const ano = r.longa.find((y) => y.ano === 2030)!;
    const meses = r.meses.filter((m) => Math.floor(m.periodo / 12) === 2030);
    expect(ano.receitas).toBeCloseTo(
      meses.reduce((a, m) => a + m.receitas, 0),
      6,
    );
    // Patrimônio é estoque: vale o do último mês, não a soma.
    expect(ano.patrimonio).toBeCloseTo(meses[11].patrimonio, 6);
  });

  it("a série vai até a idade limite", () => {
    const ultimo = r.meses[r.meses.length - 1];
    expect(ultimo.periodo).toBe(ym(1985, 6) + 95 * 12);
  });

  it("nenhum mês é NaN", () => {
    for (const m of r.meses) {
      expect(Number.isFinite(m.patrimonio)).toBe(true);
      expect(Number.isFinite(m.sobras)).toBe(true);
    }
  });
});

describe("aposentadoria", () => {
  it("começa no ano em que o cliente atinge a idade-alvo", () => {
    expect(r.desfecho.anoAposentadoria).toBe(2050);
    expect(r.desfecho.idadeAlvo).toBe(65);
  });

  it("a renda do trabalho é substituída pelo INSS", () => {
    const trabalhando = porMes.get(ym(2050, 5))!.receitas;
    const aposentado = porMes.get(ym(2050, 7))!.receitas;
    expect(aposentado).toBeCloseTo(5000, 6);
    expect(trabalhando).toBeGreaterThan(aposentado);
  });

  it("a renda privada é o rendimento real de um mês do patrimônio", () => {
    const esperado =
      r.desfecho.patrimonioNaAposentadoria * (Math.pow(1.04, 1 / 12) - 1);
    expect(r.desfecho.rendaPrivada).toBeCloseTo(esperado, 6);
  });
});

describe("impressão digital do plano", () => {
  it("é estável para a mesma entrada", () => {
    expect(hashDoPlano(plano)).toBe(hashDoPlano(plano));
  });

  it("muda quando uma premissa muda", () => {
    const outro = {
      ...plano,
      assumptions: { ...plano.assumptions, jurosCurto: 0.11 },
    };
    expect(hashDoPlano(outro)).not.toBe(hashDoPlano(plano));
  });
});
