import { fromISO } from "../period";
import type { PlanInput } from "../types";

/**
 * A forma dos JSONs de fixture — ver `exemplo.json`.
 *
 * Espelha o que o banco guarda, e não o que o motor consome: é a mesma forma
 * que `scripts/seed_referencia.py` lê para popular as tabelas. Se o carregador e o
 * script divergissem, os testes deixariam de dizer alguma coisa sobre o que
 * está gravado.
 */
export interface FixtureBruto {
  cliente: { nome: string; nascimento: string };
  premissas: {
    inicio: string;
    modo_valor: string;
    juros_curto: number;
    juros_longo: number;
    inflacao: number;
    juros_aposentadoria: number;
    idade_limite: number;
    meses_curto: number;
  };
  patrimonio_inicial: number;
  aposentadoria: { idade_alvo: number; renda_inss: number; renda_desejada: number };
  receitas: {
    fonte: string;
    valor: number;
    frequencia: string;
    mes_ocorrencia?: number;
  }[];
  despesas: {
    categoria: string;
    grupo?: string;
    valor: number;
    frequencia: string;
    mes_ocorrencia?: number;
    bucket: string;
  }[];
  dividas: {
    descricao: string;
    parcela: number;
    inicio?: string;
    fim?: string | null;
  }[];
  previdencia: { nome: string; valor: number }[];
  seguros: { nome: string; valor: number }[];
  objetivos_curto: { titulo: string; alvo: number; data_alvo: string }[];
  objetivos_longo: { titulo: string; alvo: number; periodicidade_anos: number }[];
  mudancas: {
    titulo: string;
    valor: number;
    categoria: string;
    inicio: string;
    fim?: string | null;
    observacao?: string;
  }[];
}

/** Converte um JSON de fixture na entrada do motor. */
export function carregarFixture(raw: FixtureBruto): PlanInput {
  return {
    assumptions: {
      inicio: fromISO(raw.premissas.inicio),
      modoValor: raw.premissas.modo_valor as "nominal" | "real",
      jurosCurto: raw.premissas.juros_curto,
      jurosLongo: raw.premissas.juros_longo,
      inflacao: raw.premissas.inflacao,
      jurosAposentadoria: raw.premissas.juros_aposentadoria,
      idadeLimite: raw.premissas.idade_limite,
      mesesCurto: raw.premissas.meses_curto,
    },
    nascimento: raw.cliente.nascimento,
    patrimonioInicial: raw.patrimonio_inicial,
    retirement: {
      idadeAlvo: raw.aposentadoria.idade_alvo,
      rendaInss: raw.aposentadoria.renda_inss,
      rendaDesejada: raw.aposentadoria.renda_desejada,
    },
    incomes: raw.receitas.map((r) => ({
      fonte: r.fonte,
      valor: r.valor,
      frequencia: r.frequencia as "mensal" | "anual",
      mesOcorrencia: r.mes_ocorrencia ?? null,
    })),
    expenses: raw.despesas.map((d) => ({
      categoria: d.categoria,
      grupo: d.grupo ?? "",
      valor: d.valor,
      frequencia: d.frequencia as "mensal" | "anual",
      mesOcorrencia: d.mes_ocorrencia ?? null,
      bucket: d.bucket as "fixo" | "extra",
    })),
    debts: raw.dividas.map((d) => ({
      descricao: d.descricao,
      parcela: d.parcela,
      inicio: d.inicio ? fromISO(d.inicio) : null,
      fim: d.fim ? fromISO(d.fim) : null,
    })),
    pensions: raw.previdencia,
    insurances: raw.seguros,
    goals: [
      ...raw.objetivos_curto.map((g) => ({
        titulo: g.titulo,
        prazo: "curto" as const,
        alvo: g.alvo,
        dataAlvo: fromISO(g.data_alvo),
        periodicidadeAnos: null,
        concluido: false,
      })),
      ...raw.objetivos_longo.map((g) => ({
        titulo: g.titulo,
        prazo: "longo" as const,
        alvo: g.alvo,
        dataAlvo: null,
        periodicidadeAnos: g.periodicidade_anos,
        concluido: false,
      })),
    ],
    changes: raw.mudancas.map((m) => ({
      titulo: m.titulo,
      valor: m.valor,
      categoria: m.categoria as "receita" | "despesa" | "divida",
      inicio: fromISO(m.inicio),
      fim: m.fim ? fromISO(m.fim) : null,
      observacao: m.observacao ?? null,
    })),
  };
}
