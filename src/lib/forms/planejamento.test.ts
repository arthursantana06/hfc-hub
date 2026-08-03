import { describe, expect, it } from "vitest";
import { Constants } from "@/lib/supabase/database.types";
import {
  ENTIDADES,
  camposVisiveis,
  dataParaMes,
  escreverMoeda,
  lerMoeda,
  mesParaData,
} from "./planejamento";

describe("leitura de valores monetários", () => {
  it("lê o formato brasileiro", () => {
    expect(lerMoeda("1.234,56")).toBe(1234.56);
    expect(lerMoeda("10.538,30")).toBe(10538.3);
    expect(lerMoeda("1.000.000,00")).toBe(1000000);
  });

  it("lê o formato sem separador de milhar", () => {
    expect(lerMoeda("1234,56")).toBe(1234.56);
    expect(lerMoeda("0,50")).toBe(0.5);
  });

  it("ponto é sempre milhar, mesmo sem vírgula — é o que InputMoeda produz ao digitar", () => {
    // InputMoeda insere o ponto de milhar assim que há 4+ dígitos, mesmo
    // antes de qualquer vírgula ser digitada. Se o ponto virasse decimal
    // aqui, "1.000" (mil reais) seria salvo como 1 real.
    expect(lerMoeda("1.000")).toBe(1000);
    expect(lerMoeda("1.234.567")).toBe(1234567);
    expect(lerMoeda("7000")).toBe(7000);
  });

  it("ignora o símbolo da moeda e espaços", () => {
    expect(lerMoeda("R$ 4.261,98")).toBe(4261.98);
    expect(lerMoeda("  2.750,52  ")).toBe(2750.52);
  });

  it("aceita negativo — objetivo pode ser entrada de dinheiro", () => {
    expect(lerMoeda("-124.800,00")).toBe(-124800);
  });

  it("devolve null para vazio, e não zero", () => {
    // Zero e "não informado" são coisas diferentes: um seguro de R$0 é uma
    // decisão registrada; um campo em branco é ausência de decisão.
    expect(lerMoeda("")).toBeNull();
    expect(lerMoeda("   ")).toBeNull();
    expect(lerMoeda("-")).toBeNull();
  });

  it("não confunde milhar com decimal — o erro de mil vezes", () => {
    // Number("1.234") daria 1,234. Com vírgula presente, o ponto é milhar.
    expect(lerMoeda("1.234,00")).toBe(1234);
    expect(lerMoeda("1.234,00")).not.toBe(1.234);
  });

  it("volta ao formato brasileiro na escrita", () => {
    expect(escreverMoeda(1234.5)).toBe("1.234,50");
    expect(escreverMoeda(0)).toBe("0,00");
    expect(escreverMoeda(null)).toBe("");
  });

  it("sobrevive à ida e volta", () => {
    for (const n of [0, 0.01, 1234.56, 10538.3, -124800, 1000000]) {
      expect(lerMoeda(escreverMoeda(n))).toBeCloseTo(n, 2);
    }
  });
});

describe("mês e data", () => {
  it("converte o valor do input month para date", () => {
    expect(mesParaData("2026-08")).toBe("2026-08-01");
  });

  it("rejeita o que não é mês", () => {
    expect(mesParaData("")).toBeNull();
    expect(mesParaData("2026")).toBeNull();
    expect(mesParaData("agosto")).toBeNull();
  });

  it("volta de date para o input month", () => {
    expect(dataParaMes("2026-08-01")).toBe("2026-08");
    expect(dataParaMes(null)).toBe("");
  });
});

describe("campos condicionais", () => {
  const receita = ENTIDADES.receita;

  it("esconde o mês de ocorrência quando a receita é mensal", () => {
    const chaves = camposVisiveis(receita, { frequencia: "mensal" }).map((c) => c.key);
    expect(chaves).not.toContain("mes_ocorrencia");
  });

  it("mostra o mês de ocorrência quando a receita é anual", () => {
    const chaves = camposVisiveis(receita, { frequencia: "anual" }).map((c) => c.key);
    expect(chaves).toContain("mes_ocorrencia");
  });

  it("objetivo de curto prazo pede data; recorrente pede periodicidade", () => {
    const curto = camposVisiveis(ENTIDADES.objetivo, { prazo: "curto" }).map((c) => c.key);
    const longo = camposVisiveis(ENTIDADES.objetivo, { prazo: "longo" }).map((c) => c.key);

    expect(curto).toContain("data_alvo");
    expect(curto).not.toContain("periodicidade_anos");
    expect(longo).toContain("periodicidade_anos");
    expect(longo).not.toContain("data_alvo");
  });
});

/**
 * Deriva do banco: se alguém acrescentar um valor a um enum por migração e
 * esquecer do formulário, o campo passa a existir sem opção na tela. Este teste
 * transforma esse esquecimento em falha de build.
 */
describe("opções dos selects batem com os enums do banco", () => {
  const casos: [string, string, readonly string[]][] = [
    ["receita", "frequencia", Constants.public.Enums.entry_frequency],
    ["despesa", "frequencia", Constants.public.Enums.entry_frequency],
    ["objetivo", "prazo", Constants.public.Enums.goal_term],
    ["mudanca", "categoria", Constants.public.Enums.change_category],
    ["investimento", "classe", Constants.public.Enums.investment_class],
  ];

  for (const [entidade, campo, enumerado] of casos) {
    it(`${entidade}.${campo}`, () => {
      const opcoes = ENTIDADES[entidade].campos
        .find((c) => c.key === campo)!
        .opcoes!.map((o) => o.valor)
        .filter(Boolean);

      expect(opcoes.sort()).toEqual([...enumerado].sort());
    });
  }

  it("o balde de custo só oferece o que o CHECK da tabela aceita", () => {
    // `plan_expense` restringe a fixo|extra; parcela e adicional vêm de dívidas
    // e de eventos, não de linhas de custo.
    const opcoes = ENTIDADES.despesa.campos
      .find((c) => c.key === "bucket")!
      .opcoes!.map((o) => o.valor);

    expect(opcoes).toEqual(["fixo", "extra"]);
    expect(Constants.public.Enums.budget_bucket).toContain("fixo");
    expect(Constants.public.Enums.budget_bucket).toContain("extra");
  });
});

describe("integridade do esquema", () => {
  it("toda entidade declara escopo e tabela", () => {
    for (const [chave, e] of Object.entries(ENTIDADES)) {
      expect(e.tabela, chave).toBeTruthy();
      expect(["plano", "cliente", "registro", "relatorio"], chave).toContain(
        e.escopo,
      );
      expect(e.campos.length, chave).toBeGreaterThan(0);
    }
  });

  it("nenhum campo condicional aponta para um campo inexistente", () => {
    for (const [chave, e] of Object.entries(ENTIDADES)) {
      const keys = e.campos.map((c) => c.key);
      for (const c of e.campos) {
        if (c.visivelSe) {
          expect(keys, `${chave}.${c.key}`).toContain(c.visivelSe.campo);
        }
      }
    }
  });

  it("nenhuma entidade usa nome de campo reservado do formulário", () => {
    // `__id`, `__planId`, `__clientId` e `__entidade` são do envelope; uma
    // coluna com esse nome seria sobrescrita em silêncio.
    for (const [chave, e] of Object.entries(ENTIDADES)) {
      for (const c of e.campos) {
        expect(c.key.startsWith("__"), `${chave}.${c.key}`).toBe(false);
      }
    }
  });
});
