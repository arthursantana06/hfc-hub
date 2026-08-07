import { describe, expect, it } from "vitest";
import { Constants } from "@/lib/supabase/database.types";
import {
  ENTIDADES,
  camposVisiveis,
  dataParaMes,
  escreverDecimal,
  escreverMoeda,
  lerData,
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
    ["despesa", "pagamento", Constants.public.Enums.payment_method],
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

describe("remodelação — três tipos e grid (0024)", () => {
  it("os três tipos de planejamento existem no enum do banco", () => {
    expect([...Constants.public.Enums.plan_kind].sort()).toEqual(
      ["hfc", "pre_hfc", "real"].sort(),
    );
  });

  it("a persistência de linha do Real tem os três estados", () => {
    expect([...Constants.public.Enums.row_persistence].sort()).toEqual(
      ["herdado", "mes", "permanente"].sort(),
    );
  });

  it("despesa não tem mais campo de categoria — a categoria é o bloco, não a linha", () => {
    // Se um campo `categoria_id`/`categoria_plan_id` reaparecer no esquema, o
    // formulário tentaria gravar o vínculo como dado, duplicando a verdade que
    // o envelope `__categoriaPlanId` já carrega.
    const keys = ENTIDADES.despesa.campos.map((c) => c.key);
    expect(keys).not.toContain("categoria_id");
    expect(keys).not.toContain("categoria_plan_id");
  });

  it("todo campo `padrao` de select é uma das opções do próprio campo", () => {
    // Um padrão fora da lista passaria na tela (o hidden envia qualquer string)
    // e explodiria só no enum do banco.
    for (const [nome, ent] of Object.entries(ENTIDADES)) {
      for (const campo of ent.campos) {
        if (campo.padrao === undefined || campo.tipo !== "select") continue;
        const valores = (campo.opcoes ?? []).map((o) => o.valor);
        expect(valores, `${nome}.${campo.key}`).toContain(campo.padrao);
      }
    }
  });

  it("compra de cartão exige o mínimo que a fatura projetada precisa", () => {
    // Sem `inicio` ou `parcelas` obrigatórios, a compra não tem como entrar na
    // conta da fatura do mês N — viraria linha morta.
    const campos = ENTIDADES.compra_cartao.campos;
    for (const key of ["descricao", "cartao", "valor_parcela", "parcelas", "inicio"]) {
      expect(campos.find((c) => c.key === key)?.obrigatorio, key).toBe(true);
    }
  });
});

describe("leitura de datas", () => {
  it("aceita a data que o DatePicker devolve", () => {
    expect(lerData("2026-08-05")).toBe("2026-08-05");
    expect(lerData("2028-02-29")).toBe("2028-02-29"); // 2028 é bissexto
  });

  it("recusa o que casa com o formato mas não é dia real", () => {
    // Sem esta checagem o Postgres é quem recusaria, e a mensagem dele não
    // serve para mostrar numa tela.
    expect(lerData("2026-02-31")).toBeNull();
    expect(lerData("2026-13-01")).toBeNull();
    expect(lerData("2027-02-29")).toBeNull(); // 2027 não é bissexto
  });

  it("recusa formato errado", () => {
    expect(lerData("05/08/2026")).toBeNull();
    expect(lerData("2026-08")).toBeNull();
    expect(lerData("")).toBeNull();
  });
});

describe("escrita de decimais", () => {
  it("não força duas casas — 110% do CDI é 110, não 110,00", () => {
    expect(escreverDecimal(110)).toBe("110");
    expect(escreverDecimal(6.2)).toBe("6,2");
  });

  it("vazio para ausência", () => {
    expect(escreverDecimal(null)).toBe("");
    expect(escreverDecimal(undefined)).toBe("");
  });
});

describe("entidades de investimento", () => {
  it("a classe da posição usa o mesmo enum do banco", () => {
    const opcoes = ENTIDADES.posicao.campos
      .find((c) => c.key === "classe")!
      .opcoes!.map((o) => o.valor);

    expect(opcoes).toEqual([...Constants.public.Enums.investment_class]);
  });

  it("o indexador da posição usa o mesmo enum do banco", () => {
    const opcoes = ENTIDADES.posicao.campos
      .find((c) => c.key === "indexador")!
      .opcoes!.map((o) => o.valor);

    expect(opcoes.sort()).toEqual([...Constants.public.Enums.position_indexer].sort());
  });

  it("valor e data da posição são virtuais — vão para o retrato, não para a posição", () => {
    // Se um deles deixar de ser virtual, o insert tentaria gravar uma coluna que
    // `investment_position` não tem, e o erro apareceria só em tempo de execução.
    for (const key of ["valor_bruto", "data_referencia"]) {
      expect(ENTIDADES.posicao.campos.find((c) => c.key === key)?.virtual, key).toBe(
        true,
      );
    }
  });

  it("a conta não tem campo booleano — caixa desmarcada não viaja no FormData", () => {
    // Um booleano num formulário novo nasceria falso, e `ativo` nasceria
    // encerrada. Ver o comentário em ENTIDADES.conta_investimento.
    for (const c of ENTIDADES.conta_investimento.campos) {
      expect(c.tipo, c.key).not.toBe("bool");
    }
  });
});

describe("integridade do esquema", () => {
  it("toda entidade declara escopo e tabela", () => {
    for (const [chave, e] of Object.entries(ENTIDADES)) {
      expect(e.tabela, chave).toBeTruthy();
      expect(
        ["plano", "cliente", "registro", "relatorio", "conta"],
        chave,
      ).toContain(e.escopo);
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
