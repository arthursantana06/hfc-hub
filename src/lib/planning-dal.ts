import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { verifySession, signedAvatarUrl } from "@/lib/dal";
import { iniciaisDe, type Client } from "@/lib/types";
import { fromISO } from "@/lib/planning/period";
import type { Tables } from "@/lib/supabase/database.types";
import type { PlanInput, ProjectionMonth } from "@/lib/planning/types";
import { project, type ProjectionResult } from "@/lib/planning/project";

/**
 * Leitura do domínio de planejamento.
 *
 * A RLS já filtra por organização, então nenhuma consulta aqui passa `org_id`:
 * fazer isso daria uma falsa sensação de segurança sobre quem realmente
 * autoriza a leitura. Quem autoriza é a política, não o `where`.
 */

// ─────────────────────────────────────────────────────────────
// Clientes
// ─────────────────────────────────────────────────────────────

export const listClients = cache(async (): Promise<Client[]> => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("client")
    .select(
      "id, nome, email, risco, plano_status, avatar_path, nascimento, profissao, adesao, notas, asset(valor), liability(valor)",
    )
    .order("nome");

  return Promise.all((data ?? []).map(toClient));
});

export const getClient = cache(async (id: string): Promise<Client | null> => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("client")
    .select(
      "id, nome, email, risco, plano_status, avatar_path, nascimento, profissao, adesao, notas, asset(valor), liability(valor)",
    )
    .eq("id", id)
    .maybeSingle();

  return data ? toClient(data) : null;
});

type ClientRow = {
  id: string;
  nome: string;
  email: string | null;
  risco: Client["risco"];
  plano_status: Client["planoStatus"];
  avatar_path: string | null;
  nascimento: string | null;
  profissao: string | null;
  adesao: string | null;
  notas: string | null;
  asset: { valor: number }[] | null;
  liability: { valor: number }[] | null;
};

async function toClient(row: ClientRow): Promise<Client> {
  const ativos = (row.asset ?? []).reduce((a, x) => a + Number(x.valor), 0);
  const passivos = (row.liability ?? []).reduce((a, x) => a + Number(x.valor), 0);

  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    iniciais: iniciaisDe(row.nome),
    risco: row.risco,
    patrimonio: ativos - passivos,
    planoStatus: row.plano_status,
    avatarUrl: await signedAvatarUrl(row.avatar_path),
    nascimento: row.nascimento,
    profissao: row.profissao,
    adesao: row.adesao,
    notas: row.notas,
  };
}

// ─────────────────────────────────────────────────────────────
// Plano
// ─────────────────────────────────────────────────────────────

/**
 * Monta a entrada do motor a partir do plano ativo do cliente.
 *
 * Devolve `null` quando o cliente ainda não tem plano — é estado legítimo, não
 * erro: um cliente recém-cadastrado passa por aqui antes do primeiro raio-x.
 */
export const getPlanInput = cache(
  async (clientId: string): Promise<PlanInput | null> => {
    await verifySession();
    const supabase = await createClient();

    const { data: plano } = await supabase
      .from("financial_plan")
      .select("*, client!inner(nascimento)")
      .eq("client_id", clientId)
      .eq("status", "ativo")
      .maybeSingle();

    if (!plano) return null;

    const [receitas, despesas, dividas, previdencia, seguros, objetivos, mudancas, investimentos, aposentadoria] =
      await Promise.all([
        supabase.from("plan_income").select("*").eq("plan_id", plano.id).order("ordem"),
        supabase
          .from("plan_expense")
          .select("*, budget_category(nome, grupo)")
          .eq("plan_id", plano.id)
          .order("ordem"),
        supabase.from("debt").select("*").eq("plan_id", plano.id).order("ordem"),
        supabase.from("plan_pension").select("*").eq("plan_id", plano.id).order("ordem"),
        supabase.from("plan_insurance").select("*").eq("plan_id", plano.id).order("ordem"),
        supabase.from("goal").select("*").eq("plan_id", plano.id).order("ordem"),
        supabase.from("plan_change").select("*").eq("plan_id", plano.id).order("ordem"),
        supabase.from("investment").select("valor").eq("client_id", clientId),
        supabase.from("retirement_plan").select("*").eq("plan_id", plano.id).maybeSingle(),
      ]);

    const nascimento =
      (plano.client as unknown as { nascimento: string | null })?.nascimento;
    if (!nascimento) return null;

    return {
      assumptions: {
        inicio: fromISO(plano.inicio),
        modoValor: plano.modo_valor,
        jurosCurto: Number(plano.juros_curto),
        jurosLongo: Number(plano.juros_longo),
        inflacao: Number(plano.inflacao),
        jurosAposentadoria: Number(plano.juros_aposentadoria),
        idadeLimite: plano.idade_limite,
        mesesCurto: plano.meses_curto,
      },
      nascimento,
      // O patrimônio de partida é o que já está investido hoje.
      patrimonioInicial: (investimentos.data ?? []).reduce(
        (a, i) => a + Number(i.valor),
        0,
      ),
      retirement: {
        idadeAlvo: aposentadoria.data?.idade_alvo ?? 65,
        rendaInss: Number(aposentadoria.data?.renda_inss ?? 0),
        rendaDesejada: Number(aposentadoria.data?.renda_desejada ?? 0),
      },
      incomes: (receitas.data ?? []).map((r) => ({
        fonte: r.fonte,
        valor: Number(r.valor),
        frequencia: r.frequencia,
        mesOcorrencia: r.mes_ocorrencia,
      })),
      expenses: (despesas.data ?? []).map((e) => {
        const cat = e.budget_category as unknown as { nome: string; grupo: string } | null;
        return {
          categoria: cat?.nome ?? e.descricao ?? "—",
          grupo: cat?.grupo ?? "outros",
          descricao: e.descricao,
          valor: Number(e.valor),
          frequencia: e.frequencia,
          mesOcorrencia: e.mes_ocorrencia,
          bucket: e.bucket as "fixo" | "extra",
        };
      }),
      debts: (dividas.data ?? []).map((d) => ({
        descricao: d.descricao,
        parcela: Number(d.parcela ?? 0),
        inicio: d.inicio ? fromISO(d.inicio) : null,
        fim: d.fim ? fromISO(d.fim) : null,
      })),
      pensions: (previdencia.data ?? []).map((p) => ({
        nome: p.nome,
        valor: Number(p.valor),
      })),
      insurances: (seguros.data ?? []).map((s) => ({
        nome: s.nome,
        valor: Number(s.valor),
      })),
      goals: (objetivos.data ?? []).map((g) => ({
        titulo: g.titulo,
        prazo: g.prazo,
        alvo: Number(g.alvo),
        dataAlvo: g.data_alvo ? fromISO(g.data_alvo) : null,
        periodicidadeAnos: g.periodicidade_anos,
        concluido: g.concluido,
      })),
      changes: (mudancas.data ?? []).map((m) => ({
        titulo: m.titulo,
        valor: Number(m.valor),
        categoria: m.categoria,
        inicio: fromISO(m.inicio),
        fim: m.fim ? fromISO(m.fim) : null,
        observacao: m.observacao,
      })),
    };
  },
);

/**
 * A projeção do cliente, recalculada no servidor a cada render.
 *
 * 620 meses levam menos de um milissegundo — cachear em `projection.serie`
 * antes de precisar seria otimizar contra um problema que não existe, e trocar
 * um número sempre correto por um que pode estar velho.
 */
export const getProjection = cache(
  async (clientId: string): Promise<ProjectionResult | null> => {
    const plan = await getPlanInput(clientId);
    return plan ? project(plan) : null;
  },
);

// ─────────────────────────────────────────────────────────────
// Leituras cruas, para as telas de edição
// ─────────────────────────────────────────────────────────────

/**
 * As telas de leitura consomem `PlanInput`, que já é o formato do motor — sem
 * `id`, e com datas convertidas. As de edição precisam da linha como está no
 * banco. São duas necessidades diferentes; misturá-las tornaria o `PlanInput`
 * um saco de campos que o motor ignora.
 */
export const getPlanoAtivo = cache(async (clientId: string) => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("financial_plan")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "ativo")
    .maybeSingle();

  return data;
});

export const getAposentadoria = cache(async (clientId: string) => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("retirement_plan")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();

  return data;
});

export const listCategorias = cache(async () => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("budget_category")
    .select("id, nome, grupo")
    .order("ordem");

  return (data ?? []).map((c) => ({
    valor: c.id,
    rotulo: c.nome,
    grupo: c.grupo as string,
  }));
});

/**
 * Visão sem tipos do cliente, para as leituras genéricas abaixo.
 *
 * Com a tabela vinda de um parâmetro genérico, o cliente tipado não consegue
 * resolver `.eq("plan_id", …)` — ele exigiria a coluna como literal. O retorno
 * é reafirmado como `Tables<T>`, que é o tipo correto: a lista de tabelas
 * permitidas está no próprio parâmetro.
 */
function generico(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase as unknown as SupabaseClient;
}

type TabelaPlano =
  | "plan_income"
  | "plan_expense"
  | "plan_change"
  | "plan_pension"
  | "plan_insurance";

type TabelaCliente = "debt" | "goal" | "asset" | "liability" | "investment";

/**
 * Linhas cruas de uma tabela ligada ao plano.
 *
 * Genérica no nome da tabela para que o retorno seja a linha daquela tabela e
 * não a união de todas — sem isso a tela teria de estreitar o tipo à mão a cada
 * acesso a campo.
 */
export async function linhasDoPlano<T extends TabelaPlano>(
  tabela: T,
  planId: string,
): Promise<Tables<T>[]> {
  await verifySession();
  const supabase = await createClient();
  const { data } = await generico(supabase)
    .from(tabela)
    .select("*")
    .eq("plan_id", planId)
    .order("ordem");
  return (data ?? []) as Tables<T>[];
}

/** Linhas cruas de uma tabela ligada ao cliente. */
export async function linhasDoCliente<T extends TabelaCliente>(
  tabela: T,
  clientId: string,
): Promise<Tables<T>[]> {
  await verifySession();
  const supabase = await createClient();
  const { data } = await generico(supabase)
    .from(tabela)
    .select("*")
    .eq("client_id", clientId)
    .order("ordem");
  return (data ?? []) as Tables<T>[];
}

/**
 * As metas congeladas do plano — a `PROJEÇÃO ORIGINAL` da planilha.
 *
 * Devolve `null` quando o planejador ainda não congelou. Sem elas não há
 * denominador para o placar do mês: comparar o mês contra a projeção corrente
 * seria comparar o cliente com ele mesmo.
 */
export const getMetas = cache(async (clientId: string) => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("projection")
    .select("serie, gerado_em, rotulo, premissas_hash")
    .eq("client_id", clientId)
    .eq("horizonte", "curta")
    .eq("congelada", true)
    .maybeSingle();

  if (!data?.serie) return null;

  return {
    serie: data.serie as unknown as ProjectionMonth[],
    geradoEm: data.gerado_em,
    rotulo: data.rotulo,
    hash: data.premissas_hash,
  };
});

/** Registros mensais do cliente, do mais recente para o mais antigo. */
export const listRegistrosMensais = cache(async (clientId: string) => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("monthly_record")
    .select("*")
    .eq("client_id", clientId)
    .order("ref_mes", { ascending: false });

  return data ?? [];
});

export const getRegistroMensal = cache(
  async (clientId: string, refMes: string) => {
    await verifySession();
    const supabase = await createClient();

    const { data } = await supabase
      .from("monthly_record")
      .select("*")
      .eq("client_id", clientId)
      .eq("ref_mes", refMes)
      .maybeSingle();

    return data;
  },
);

/** Lançamentos e faturas de um mês fechado. */
export async function linhasDoRegistro(recordId: string) {
  await verifySession();
  const supabase = await createClient();

  const [receitas, despesas, faturas] = await Promise.all([
    supabase.from("income_entry").select("*").eq("record_id", recordId),
    supabase
      .from("expense_entry")
      .select("*, budget_category(nome, grupo)")
      .eq("record_id", recordId),
    supabase.from("card_statement").select("*").eq("record_id", recordId),
  ]);

  return {
    receitas: receitas.data ?? [],
    despesas: despesas.data ?? [],
    faturas: faturas.data ?? [],
  };
}
