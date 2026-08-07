import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { verifySession, signedAvatarUrl } from "@/lib/dal";
import { iniciaisDe, type Client } from "@/lib/types";
import { fromISO } from "@/lib/planning/period";
import type { Tables } from "@/lib/supabase/database.types";
import type { PlanInput, ProjectionMonth } from "@/lib/planning/types";
import { summarizeBalance } from "@/lib/planning/balance";
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

// Uma string literal só, sem concatenação: o cliente tipado deduz as colunas do
// literal, e quebrar a linha com `+` faz a dedução degradar para
// `GenericStringError` — o erro aparece longe daqui, em quem consome a linha.
const CAMPOS_CLIENTE =
  "id, nome, email, risco, avatar_path, nascimento, profissao, adesao, notas, tem_planejamento, tem_investimento";

export const listClients = cache(async (): Promise<Client[]> => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase.from("client").select(CAMPOS_CLIENTE).order("nome");
  const linhas = data ?? [];

  const balancos = await balancosPorCliente(linhas.map((c) => c.id));
  return Promise.all(linhas.map((c) => toClient(c, balancos.get(c.id))));
});

export const getClient = cache(async (id: string): Promise<Client | null> => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("client")
    .select(CAMPOS_CLIENTE)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const balancos = await balancosPorCliente([id]);
  return toClient(data, balancos.get(id));
});

type ClientRow = {
  id: string;
  nome: string;
  email: string | null;
  risco: Client["risco"];
  avatar_path: string | null;
  nascimento: string | null;
  profissao: string | null;
  adesao: string | null;
  notas: string | null;
  tem_planejamento: boolean;
  tem_investimento: boolean;
};

async function toClient(
  row: ClientRow,
  balanco: BalancoDoCliente | undefined,
): Promise<Client> {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    iniciais: iniciaisDe(row.nome),
    risco: row.risco,
    patrimonio: balanco?.liquido ?? 0,
    temPlano: balanco !== undefined,
    avatarUrl: await signedAvatarUrl(row.avatar_path),
    nascimento: row.nascimento,
    profissao: row.profissao,
    adesao: row.adesao,
    notas: row.notas,
    temPlanejamento: row.tem_planejamento,
    temInvestimento: row.tem_investimento,
  };
}

interface BalancoDoCliente {
  liquido: number;
}

/**
 * Patrimônio líquido de cada cliente, lido do período corrente.
 *
 * Duas idas ao banco em vez de uma por cliente: primeiro os planos ativos,
 * depois só as linhas que pertencem a eles. Sem o filtro por plano a soma
 * misturaria todos os períodos já registrados e o patrimônio cresceria a cada
 * reunião sem que nada tivesse acontecido.
 */
async function balancosPorCliente(
  clientIds: string[],
): Promise<Map<string, BalancoDoCliente>> {
  const saida = new Map<string, BalancoDoCliente>();
  if (clientIds.length === 0) return saida;

  const supabase = await createClient();
  // Só o Real: Pré-HFC e HFC também ficam `ativo` para sempre (0024), e sem o
  // filtro o patrimônio do hub poderia sair de um retrato em vez do corrente.
  const { data: planos } = await supabase
    .from("financial_plan")
    .select("id, client_id, inicio")
    .eq("status", "ativo")
    .eq("tipo", "real")
    .in("client_id", clientIds);

  if (!planos?.length) return saida;

  const planIds = planos.map((p) => p.id);
  const [ativos, passivos, carteira, dividas] = await Promise.all([
    supabase.from("asset").select("valor, plan_id").in("plan_id", planIds).eq("suprimido", false),
    supabase.from("liability").select("valor, plan_id").in("plan_id", planIds).eq("suprimido", false),
    supabase.from("investment").select("valor, plan_id").in("plan_id", planIds).eq("suprimido", false),
    supabase
      .from("debt")
      .select("parcela, inicio, fim, saldo, plan_id")
      .in("plan_id", planIds)
      .eq("suprimido", false),
  ]);

  for (const plano of planos) {
    const meu = <T extends { plan_id: string | null }>(linhas: T[] | null) =>
      (linhas ?? []).filter((l) => l.plan_id === plano.id);

    const soma = (linhas: { valor: number }[]) =>
      linhas.reduce((a, x) => a + Number(x.valor), 0);

    const balanco = summarizeBalance({
      assumptions: { inicio: fromISO(plano.inicio) } as PlanInput["assumptions"],
      ativosNaoInvestidos: soma(meu(ativos.data)),
      passivosDeclarados: soma(meu(passivos.data)),
      patrimonioInicial: soma(meu(carteira.data)),
      debts: meu(dividas.data).map(paraDivida),
    });

    saida.set(plano.client_id, { liquido: balanco.liquido });
  }

  return saida;
}

type DividaBruta = {
  parcela: number | null;
  inicio: string | null;
  fim: string | null;
  saldo: number | null;
};

const paraDivida = (d: DividaBruta) => ({
  descricao: "",
  parcela: Number(d.parcela ?? 0),
  inicio: d.inicio ? fromISO(d.inicio) : null,
  fim: d.fim ? fromISO(d.fim) : null,
  saldo: d.saldo === null ? null : Number(d.saldo),
});

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
  async (clientId: string, planId?: string): Promise<PlanInput | null> => {
    await verifySession();
    const supabase = await createClient();

    const consulta = supabase
      .from("financial_plan")
      .select("*, client!inner(nascimento)")
      .eq("client_id", clientId);

    // Sem `planId` o período é o corrente do Real. Com ele, a tela está olhando
    // um planejamento específico (Pré-HFC, HFC ou um período anterior do Real) —
    // e a projeção precisa partir daquele retrato, não deste.
    const { data: plano } = await (planId
      ? consulta.eq("id", planId)
      : consulta.eq("status", "ativo").eq("tipo", "real")
    ).maybeSingle();

    if (!plano) return null;

    const [
      receitas,
      despesas,
      dividas,
      previdencia,
      seguros,
      objetivos,
      mudancas,
      investimentos,
      ativos,
      passivos,
      aposentadoria,
      compras,
    ] = await Promise.all([
        supabase.from("plan_income").select("*").eq("plan_id", plano.id).eq("suprimido", false).order("ordem"),
        supabase
          .from("plan_expense")
          .select("*, plan_expense_category(nome)")
          .eq("plan_id", plano.id)
          .eq("suprimido", false)
          .order("ordem"),
        supabase.from("debt").select("*").eq("plan_id", plano.id).eq("suprimido", false).order("ordem"),
        supabase.from("plan_pension").select("*").eq("plan_id", plano.id).eq("suprimido", false).order("ordem"),
        supabase.from("plan_insurance").select("*").eq("plan_id", plano.id).eq("suprimido", false).order("ordem"),
        supabase.from("goal").select("*").eq("plan_id", plano.id).eq("suprimido", false).order("ordem"),
        supabase.from("plan_change").select("*").eq("plan_id", plano.id).eq("suprimido", false).order("ordem"),
        supabase.from("investment").select("valor").eq("plan_id", plano.id).eq("suprimido", false),
        supabase.from("asset").select("valor").eq("plan_id", plano.id).eq("suprimido", false),
        supabase.from("liability").select("valor").eq("plan_id", plano.id).eq("suprimido", false),
        // Por `client_id`, não `plan_id`: a aposentadoria é 1:1 com o cliente e
        // vale para os três planejamentos — repontá-la a cada período era um
        // resto do modelo antigo.
        supabase.from("retirement_plan").select("*").eq("client_id", clientId).maybeSingle(),
        supabase
          .from("plan_card_purchase")
          .select("*")
          .eq("plan_id", plano.id)
          .eq("suprimido", false),
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
      // O patrimônio de partida é o que já está investido hoje: só a carteira
      // rende juros. Imóvel e veículo entram no balanço, não na capitalização.
      patrimonioInicial: somar(investimentos.data),
      ativosNaoInvestidos: somar(ativos.data),
      passivosDeclarados: somar(passivos.data),
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
        meses: r.meses,
      })),
      expenses: (despesas.data ?? []).map((e) => {
        const cat = e.plan_expense_category as unknown as { nome: string } | null;
        return {
          categoria: cat?.nome ?? e.descricao ?? "—",
          descricao: e.descricao,
          valor: Number(e.valor),
          frequencia: e.frequencia,
          mesOcorrencia: e.mes_ocorrencia,
          meses: e.meses,
          bucket: e.bucket as "fixo" | "extra",
        };
      }),
      debts: (dividas.data ?? []).map((d) => ({
        ...paraDivida(d),
        descricao: d.descricao,
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
      cardPurchases: (compras.data ?? []).map((c) => ({
        descricao: c.descricao,
        cartao: c.cartao,
        valorParcela: Number(c.valor_parcela),
        parcelas: c.parcelas,
        inicio: fromISO(c.inicio),
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
  async (clientId: string, planId?: string): Promise<ProjectionResult | null> => {
    const plan = await getPlanInput(clientId, planId);
    return plan ? project(plan) : null;
  },
);

const somar = (linhas: { valor: number }[] | null) =>
  (linhas ?? []).reduce((a, x) => a + Number(x.valor), 0);

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
    .eq("tipo", "real")
    .maybeSingle();

  return data;
});

/**
 * Um dos três planejamentos do cliente.
 *
 * Pré-HFC e HFC são retratos únicos — a consulta é direta pelo tipo. Para o
 * Real, "o planejamento" é o período corrente (status ativo); períodos
 * anteriores chegam por `getPlanoDoPeriodo` com o id explícito.
 */
export const getPlanejamento = cache(
  async (clientId: string, tipo: "pre_hfc" | "hfc" | "real") => {
    await verifySession();
    const supabase = await createClient();

    const consulta = supabase
      .from("financial_plan")
      .select("*")
      .eq("client_id", clientId)
      .eq("tipo", tipo);

    const { data } = await (tipo === "real"
      ? consulta.eq("status", "ativo")
      : consulta
    ).maybeSingle();

    return data;
  },
);

/**
 * Os blocos de categoria do grid de Despesa, na ordem do planejador.
 *
 * As despesas de cada bloco chegam por `linhasDoPlano("plan_expense", …)` e são
 * agrupadas na tela por `categoria_plan_id` — duas consultas chatas de juntar
 * aqui virariam um tipo aninhado que só uma tela consome.
 */
export const blocosDeDespesa = cache(async (planId: string) => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("plan_expense_category")
    .select("*")
    .eq("plan_id", planId)
    .eq("suprimido", false)
    .order("ordem");

  return data ?? [];
});

export const comprasDeCartao = cache(async (planId: string) => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("plan_card_purchase")
    .select("*")
    .eq("plan_id", planId)
    .eq("suprimido", false)
    .order("ordem");

  return data ?? [];
});

/**
 * Nomes de categoria já usados na organização, para o autocomplete do bloco.
 *
 * Distinct feito aqui e não no SQL: o cliente do Supabase não expõe distinct, e
 * a lista é pequena (dezenas de nomes). A RLS já limita à org do planejador.
 */
export const nomesDeCategoriaDaOrg = cache(async () => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("plan_expense_category")
    .select("nome")
    .eq("suprimido", false)
    .order("nome");

  return [...new Set((data ?? []).map((c) => c.nome.trim()).filter(Boolean))];
});

/**
 * Os períodos já registrados do cliente, do mais recente para o mais antigo.
 *
 * Cada linha é uma versão do plano — um retrato tirado numa reunião. A versão 1
 * é o Ponto de Partida; as seguintes são o acompanhamento.
 */
export const listPeriodos = cache(async (clientId: string) => {
  await verifySession();
  const supabase = await createClient();

  // Só o Real tem série de períodos; Pré-HFC e HFC são retratos fora do tempo.
  const { data } = await supabase
    .from("financial_plan")
    .select("id, versao, inicio, status, cadencia, created_at")
    .eq("client_id", clientId)
    .eq("tipo", "real")
    .order("inicio", { ascending: false });

  return data ?? [];
});

/**
 * O período que a tela está mostrando.
 *
 * Sem `planId`, o corrente. Com um `planId` que não é do cliente, `null` — a
 * RLS já barraria, mas devolver o plano de outra pessoa por um id na URL seria
 * um jeito ruim de descobrir isso.
 */
export const getPlanoDoPeriodo = cache(
  async (clientId: string, planId?: string) => {
    await verifySession();
    const supabase = await createClient();

    const consulta = supabase
      .from("financial_plan")
      .select("*")
      .eq("client_id", clientId);

    const { data } = await (planId
      ? consulta.eq("id", planId)
      : consulta.eq("status", "ativo").eq("tipo", "real")
    ).maybeSingle();

    return data;
  },
);

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

/**
 * Tudo que compõe um raio-x pende do plano, e não do cliente.
 *
 * Antes, dívida, objetivo, ativo, passivo e carteira eram do cliente: com um
 * plano por período isso faria as cinco listas serem as mesmas em todos os
 * períodos, e o acompanhamento não teria o que mostrar.
 */
type TabelaPlano =
  | "plan_income"
  | "plan_expense"
  | "plan_change"
  | "plan_pension"
  | "plan_insurance"
  | "debt"
  | "goal"
  | "asset"
  | "liability"
  | "investment";

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
    // Tombstones do período Real ficam no banco e fora da tela — é o filtro
    // central; quem precisar das suprimidas consulta por conta própria.
    .eq("suprimido", false)
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
