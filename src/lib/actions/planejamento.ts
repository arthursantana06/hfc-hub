"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import {
  ENTIDADES,
  camposVisiveis,
  lerMoeda,
  mesParaData,
  type Campo,
  type Entidade,
} from "@/lib/forms/planejamento";

export type Estado = { erro?: string; ok?: string } | undefined;

/**
 * Visão sem tipos do cliente, para as escritas dirigidas por esquema.
 *
 * O cliente tipado exige a tabela como literal em tempo de compilação, e aqui
 * ela vem de `ENTIDADES` em tempo de execução. Quem garante a segurança neste
 * caminho é a lista branca `TabelaEditavel` mais o payload montado campo a
 * campo contra o esquema — não o sistema de tipos. Fora daqui, use o cliente
 * tipado normalmente.
 */
function generico(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase as unknown as SupabaseClient;
}

/**
 * Quem pode escrever no planejamento.
 *
 * A RLS é quem autoriza de verdade (`can_write()` = admin | planner). A
 * checagem daqui existe só para devolver uma mensagem legível em vez de
 * "0 linhas afetadas", que é como uma escrita barrada por política aparece.
 */
async function autor() {
  const user = await getCurrentUser();
  if (!user) return { erro: "Sessão expirada. Entre novamente." as const };
  if (user.role !== "admin" && user.role !== "planner") {
    return { erro: "Seu papel não permite editar o planejamento." as const };
  }
  return { user };
}

// ─────────────────────────────────────────────────────────────
// Linhas genéricas (receitas, custos, dívidas, objetivos, …)
// ─────────────────────────────────────────────────────────────

/**
 * Converte o formulário no registro, campo a campo, contra o esquema.
 *
 * Nada que não esteja no esquema atravessa: o nome da tabela vem de uma lista
 * branca e as colunas vêm da definição da entidade, nunca do que o navegador
 * mandou. Sem isso, um `role=admin` extra no FormData seria gravado.
 */
function montarRegistro(
  entidade: Entidade,
  form: FormData,
): { dados: Record<string, unknown> } | { erro: string } {
  const brutos: Record<string, string> = {};
  for (const c of entidade.campos) {
    brutos[c.key] = String(form.get(c.key) ?? "");
  }

  const dados: Record<string, unknown> = {};
  const visiveis = camposVisiveis(entidade, brutos);

  // Campo escondido por `visivelSe` é apagado de propósito: um objetivo que
  // deixa de ser de curto prazo não pode manter a data-alvo antiga.
  for (const c of entidade.campos) {
    if (!visiveis.includes(c)) dados[c.key] = null;
  }

  for (const c of visiveis) {
    const bruto = brutos[c.key].trim();

    if (c.obrigatorio && bruto === "" && c.tipo !== "bool") {
      return { erro: `Preencha "${c.label}".` };
    }

    const valor = converter(c, bruto);
    if (valor === undefined) {
      return { erro: `"${c.label}" está em formato inválido.` };
    }
    dados[c.key] = valor;
  }

  return { dados };
}

/** `undefined` sinaliza formato inválido; `null` é ausência legítima. */
function converter(c: Campo, bruto: string): unknown {
  if (c.tipo === "bool") return bruto === "on" || bruto === "true";
  if (bruto === "") return c.tipo === "texto" ? null : null;

  switch (c.tipo) {
    case "moeda": {
      const n = lerMoeda(bruto);
      return n === null ? undefined : n;
    }
    case "inteiro": {
      const n = Number(bruto);
      if (!Number.isInteger(n)) return undefined;
      if (c.min !== undefined && n < c.min) return undefined;
      if (c.max !== undefined && n > c.max) return undefined;
      return n;
    }
    case "mes":
      return mesParaData(bruto) ?? undefined;
    case "select":
      return c.opcoes?.some((o) => o.valor === bruto) ? bruto || null : undefined;
    default:
      return bruto;
  }
}

export async function salvarLinha(
  _estado: Estado,
  form: FormData,
): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const chave = String(form.get("__entidade") ?? "");
  const entidade = ENTIDADES[chave];
  if (!entidade) return { erro: "Entidade desconhecida." };

  const montado = montarRegistro(entidade, form);
  if ("erro" in montado) return montado;

  const id = String(form.get("__id") ?? "");
  const planId = String(form.get("__planId") ?? "");
  const clientId = String(form.get("__clientId") ?? "");
  const recordId = String(form.get("__recordId") ?? "");
  const reportId = String(form.get("__reportId") ?? "");
  const supabase = await createClient();

  if (id) {
    const { error } = await generico(supabase)
      .from(entidade.tabela)
      .update(montado.dados)
      .eq("id", id);
    if (error) return { erro: mensagem(error.message) };
  } else {
    const vinculo: Record<string, unknown> = { org_id: a.user.org_id };
    if (entidade.escopo === "plano") {
      if (!planId) return { erro: "Este cliente ainda não tem um plano." };
      vinculo.plan_id = planId;
    } else if (entidade.escopo === "registro") {
      if (!recordId) return { erro: "Mês não identificado." };
      vinculo.record_id = recordId;
    } else if (entidade.escopo === "relatorio") {
      if (!reportId) return { erro: "Relatório não identificado." };
      vinculo.report_id = reportId;
    } else {
      if (!clientId) return { erro: "Cliente não identificado." };
      vinculo.client_id = clientId;
      // Tabelas de escopo cliente também carregam plan_id quando há plano —
      // é o que liga a dívida ou o objetivo à versão do raio-x.
      if (planId) vinculo.plan_id = planId;
    }

    // `income_entry`, `expense_entry` e `card_statement` não têm coluna `ordem`;
    // são lançamentos de um mês, e a ordem que importa é a do valor.
    const temOrdem = !["income_entry", "expense_entry", "card_statement"].includes(
      entidade.tabela,
    );

    const { error } = await generico(supabase)
      .from(entidade.tabela)
      .insert({
        ...vinculo,
        ...montado.dados,
        ...(temOrdem
          ? { ordem: await proximaOrdem(entidade, planId, clientId, recordId, reportId) }
          : {}),
      });
    if (error) return { erro: mensagem(error.message) };
  }

  revalidatePath("/", "layout");
  return { ok: id ? `${entidade.singular} atualizada.` : `${entidade.singular} adicionada.` };
}

export async function removerLinha(form: FormData): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const entidade = ENTIDADES[String(form.get("__entidade") ?? "")];
  const id = String(form.get("__id") ?? "");
  if (!entidade || !id) return { erro: "Registro não identificado." };

  const supabase = await createClient();
  const { error } = await generico(supabase)
    .from(entidade.tabela)
    .delete()
    .eq("id", id);
  if (error) return { erro: mensagem(error.message) };

  revalidatePath("/", "layout");
  return { ok: `${entidade.singular} removida.` };
}

/** Novas linhas vão para o fim da lista, sem embaralhar o que já existe. */
async function proximaOrdem(
  entidade: Entidade,
  planId: string,
  clientId: string,
  recordId = "",
  reportId = "",
) {
  const supabase = await createClient();
  const { coluna, valor } = {
    plano: { coluna: "plan_id", valor: planId },
    cliente: { coluna: "client_id", valor: clientId },
    registro: { coluna: "record_id", valor: recordId },
    relatorio: { coluna: "report_id", valor: reportId },
  }[entidade.escopo];

  const { data } = await generico(supabase)
    .from(entidade.tabela)
    .select("ordem")
    .eq(coluna, valor)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data as { ordem?: number } | null)?.ordem ?? 0) + 10;
}

// ─────────────────────────────────────────────────────────────
// Cliente
// ─────────────────────────────────────────────────────────────

export async function salvarCliente(
  _estado: Estado,
  form: FormData,
): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const nome = String(form.get("nome") ?? "").trim();
  if (nome.length < 2) return { erro: "Informe o nome do cliente." };

  const nascimento = String(form.get("nascimento") ?? "").trim() || null;
  const risco = String(form.get("risco") ?? "").trim() || null;
  const planoStatus = String(form.get("plano_status") ?? "diagnostico");

  const dados = {
    nome,
    email: String(form.get("email") ?? "").trim() || null,
    nascimento,
    profissao: String(form.get("profissao") ?? "").trim() || null,
    risco: risco as "conservador" | "moderado" | "arrojado" | null,
    plano_status: planoStatus as "ativo" | "diagnostico" | "pendente",
    adesao: String(form.get("adesao") ?? "").trim() || null,
    notas: String(form.get("notas") ?? "").trim() || null,
  };

  const supabase = await createClient();
  const id = String(form.get("__id") ?? "");

  if (id) {
    const { error } = await supabase.from("client").update(dados).eq("id", id);
    if (error) return { erro: mensagem(error.message) };
    revalidatePath("/", "layout");
    return { ok: "Cadastro atualizado." };
  }

  const { data, error } = await supabase
    .from("client")
    .insert({ ...dados, org_id: a.user.org_id, planner_id: a.user.id })
    .select("id")
    .single();

  if (error || !data) return { erro: mensagem(error?.message ?? "") };

  revalidatePath("/", "layout");
  redirect(`/clientes/${data.id}/ponto-de-partida/cadastro`);
}

// ─────────────────────────────────────────────────────────────
// Plano e premissas
// ─────────────────────────────────────────────────────────────

const PREMISSAS_PERCENTUAIS = [
  "juros_curto",
  "juros_longo",
  "inflacao",
  "juros_aposentadoria",
] as const;

export async function salvarPlano(
  _estado: Estado,
  form: FormData,
): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const clientId = String(form.get("__clientId") ?? "");
  const id = String(form.get("__id") ?? "");
  if (!clientId) return { erro: "Cliente não identificado." };

  const inicio = mesParaData(String(form.get("inicio") ?? ""));
  if (!inicio) return { erro: "Informe o mês de início do plano." };

  // A tela pede "12" e o banco guarda 0,12 — converter aqui evita que alguém
  // digite 0,12 achando que é 12% e projete o plano a 0,12% ao ano.
  const taxas: Partial<Record<(typeof PREMISSAS_PERCENTUAIS)[number], number>> = {};
  for (const chave of PREMISSAS_PERCENTUAIS) {
    const pct = lerMoeda(String(form.get(chave) ?? ""));
    if (pct === null) return { erro: "Preencha todas as taxas." };
    if (pct < -100 || pct > 100) return { erro: "Taxas devem estar entre -100% e 100%." };
    taxas[chave] = pct / 100;
  }

  const dados = {
    inicio,
    modo_valor: (String(form.get("modo_valor") ?? "nominal") === "real"
      ? "real"
      : "nominal") as "real" | "nominal",
    dia_referencia: inteiro(form.get("dia_referencia"), 1, 31) ?? 1,
    dia_pagamento: inteiro(form.get("dia_pagamento"), 1, 31),
    dia_fatura: inteiro(form.get("dia_fatura"), 1, 31),
    idade_limite: inteiro(form.get("idade_limite"), 60, 120) ?? 101,
    meses_curto: inteiro(form.get("meses_curto"), 1, 120) ?? 36,
    juros_curto: taxas.juros_curto!,
    juros_longo: taxas.juros_longo!,
    inflacao: taxas.inflacao!,
    juros_aposentadoria: taxas.juros_aposentadoria!,
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("financial_plan").update(dados).eq("id", id);
    if (error) return { erro: mensagem(error.message) };
    revalidatePath("/", "layout");
    return { ok: "Premissas atualizadas." };
  }

  // O índice parcial garante um plano ativo por cliente; a versão nova pega o
  // número seguinte para não colidir com planos arquivados.
  const { data: ultimo } = await supabase
    .from("financial_plan")
    .select("versao")
    .eq("client_id", clientId)
    .order("versao", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("financial_plan").insert({
    ...dados,
    org_id: a.user.org_id,
    client_id: clientId,
    versao: (ultimo?.versao ?? 0) + 1,
    status: "ativo",
  });

  if (error) return { erro: mensagem(error.message) };

  revalidatePath("/", "layout");
  return { ok: "Plano criado. Agora monte o fluxo de caixa." };
}

export async function salvarAposentadoria(
  _estado: Estado,
  form: FormData,
): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const clientId = String(form.get("__clientId") ?? "");
  const planId = String(form.get("__planId") ?? "");
  if (!clientId || !planId) return { erro: "Plano não identificado." };

  const dados = {
    idade_alvo: inteiro(form.get("idade_alvo"), 40, 100),
    renda_inss: lerMoeda(String(form.get("renda_inss") ?? "")) ?? 0,
    renda_desejada: lerMoeda(String(form.get("renda_desejada") ?? "")) ?? 0,
  };

  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("retirement_plan")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();

  const { error } = existente
    ? await supabase.from("retirement_plan").update(dados).eq("id", existente.id)
    : await supabase.from("retirement_plan").insert({
        ...dados,
        org_id: a.user.org_id,
        client_id: clientId,
        plan_id: planId,
      });

  if (error) return { erro: mensagem(error.message) };

  revalidatePath("/", "layout");
  return { ok: "Aposentadoria atualizada." };
}

// ─────────────────────────────────────────────────────────────
// Categorias de custo
// ─────────────────────────────────────────────────────────────

/** Categoria criada por um planejador para um cliente específico. */
export async function criarCategoria(
  _estado: Estado,
  form: FormData,
): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const nome = String(form.get("nome") ?? "").trim();
  const grupo = String(form.get("grupo") ?? "outros");
  if (nome.length < 2) return { erro: "Informe o nome da categoria." };

  const supabase = await createClient();
  const { error } = await supabase.from("budget_category").insert({
    // Sempre a org do autor — nunca um padrão de ambiente. Um fallback aqui
    // gravaria a categoria na organização errada no dia em que houver duas.
    org_id: a.user.org_id,
    nome,
    grupo: grupo as "casa" | "saude" | "transporte" | "lazer" | "filhos_pets" | "outros",
    is_padrao: false,
    ordem: 900,
  });

  if (error) {
    return {
      erro: error.message.includes("duplicate")
        ? "Já existe uma categoria com esse nome."
        : mensagem(error.message),
    };
  }

  revalidatePath("/", "layout");
  return { ok: "Categoria criada." };
}

// ─────────────────────────────────────────────────────────────

function inteiro(v: FormDataEntryValue | null, min: number, max: number) {
  const n = Number(String(v ?? "").trim());
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** Traduz o que o Postgres devolve no que o planejador precisa saber. */
function mensagem(raw: string): string {
  if (raw.includes("row-level security")) {
    return "Você não tem permissão para esta alteração.";
  }
  if (raw.includes("financial_plan_um_ativo_idx")) {
    return "Este cliente já tem um plano ativo. Arquive-o antes de criar outro.";
  }
  if (raw.includes("violates foreign key")) {
    return "Há um vínculo inválido no formulário. Recarregue a página.";
  }
  if (raw.includes("_fim_apos_inicio")) {
    return "A data final não pode ser anterior à inicial.";
  }
  if (raw.includes("card_statement_record_id_cartao_categoria_key")) {
    return "Já existe uma linha para esse cartão nessa categoria. Edite a existente.";
  }
  if (raw.includes("monthly_record_client_id_ref_mes_key")) {
    return "Este mês já foi aberto.";
  }
  return "Não foi possível salvar. Tente de novo.";
}

// ─────────────────────────────────────────────────────────────
// Metas congeladas
// ─────────────────────────────────────────────────────────────

/**
 * Congela a projeção atual como as metas do plano.
 *
 * É a `PROJEÇÃO ORIGINAL` da planilha: a foto tirada no dia em que o plano foi
 * fechado, contra a qual cada mês é medido depois. Nunca é recalculada — se
 * fosse, o cliente seria comparado a um alvo que se move junto com ele, e o
 * acompanhamento perderia o sentido.
 *
 * Recongelar substitui a foto anterior. É uma decisão do planejador, e a tela
 * avisa que os meses já fechados passam a ser lidos contra uma meta diferente.
 */
export async function congelarMetas(
  _estado: Estado,
  form: FormData,
): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const clientId = String(form.get("__clientId") ?? "");
  if (!clientId) return { erro: "Cliente não identificado." };

  const { getPlanInput, getPlanoAtivo } = await import("@/lib/planning-dal");
  const [plan, plano] = await Promise.all([
    getPlanInput(clientId),
    getPlanoAtivo(clientId),
  ]);

  if (!plan || !plano) return { erro: "Este cliente ainda não tem um plano." };

  const { project, hashDoPlano } = await import("@/lib/planning/project");
  const proj = project(plan);
  const hash = hashDoPlano(plan);
  const supabase = await createClient();

  const series = [
    { horizonte: "curta" as const, serie: proj.curta },
    { horizonte: "longa" as const, serie: proj.longa },
  ];

  for (const { horizonte, serie } of series) {
    const registro = {
      org_id: a.user.org_id,
      client_id: clientId,
      plan_id: plano.id,
      horizonte,
      congelada: true,
      rotulo: `Metas do plano v${plano.versao}`,
      serie: JSON.parse(JSON.stringify(serie)),
      premissas_hash: hash,
      gerado_em: new Date().toISOString(),
    };

    const { data: existente } = await supabase
      .from("projection")
      .select("id")
      .eq("plan_id", plano.id)
      .eq("horizonte", horizonte)
      .eq("congelada", true)
      .maybeSingle();

    const { error } = existente
      ? await supabase.from("projection").update(registro).eq("id", existente.id)
      : await supabase.from("projection").insert(registro);

    if (error) return { erro: mensagem(error.message) };
  }

  revalidatePath("/", "layout");
  return { ok: "Metas congeladas. É contra elas que cada mês será medido." };
}

// ─────────────────────────────────────────────────────────────
// Fechamento mensal
// ─────────────────────────────────────────────────────────────

/**
 * Abre um mês para acompanhamento.
 *
 * Cria o registro do realizado e o relatório em rascunho de uma vez: um mês
 * aberto sempre produz um relatório, e criar os dois juntos evita o estado
 * intermediário em que há lançamentos mas nenhum documento onde escrevê-los.
 */
export async function abrirMes(_estado: Estado, form: FormData): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const clientId = String(form.get("__clientId") ?? "");
  const planId = String(form.get("__planId") ?? "") || null;
  const refMes = mesParaData(String(form.get("mes") ?? ""));

  if (!clientId) return { erro: "Cliente não identificado." };
  if (!refMes) return { erro: "Escolha o mês de referência." };

  const supabase = await createClient();

  const { error: erroRegistro } = await supabase.from("monthly_record").insert({
    org_id: a.user.org_id,
    client_id: clientId,
    plan_id: planId,
    ref_mes: refMes,
  });
  if (erroRegistro) return { erro: mensagem(erroRegistro.message) };

  const { error: erroRelatorio } = await supabase.from("report").insert({
    org_id: a.user.org_id,
    client_id: clientId,
    plan_id: planId,
    ref_mes: refMes,
    periodo: rotuloDoMes(refMes),
    status: "rascunho",
  });
  if (erroRelatorio) return { erro: mensagem(erroRelatorio.message) };

  revalidatePath("/", "layout");
  return { ok: `${rotuloDoMes(refMes)} aberto.` };
}

/** Observação livre do mês — o que os números não contam. */
export async function salvarObservacaoDoMes(
  _estado: Estado,
  form: FormData,
): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const recordId = String(form.get("__recordId") ?? "");
  if (!recordId) return { erro: "Mês não identificado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_record")
    .update({ observacao: String(form.get("observacao") ?? "").trim() || null })
    .eq("id", recordId);

  if (error) return { erro: mensagem(error.message) };

  revalidatePath("/", "layout");
  return { ok: "Observação salva." };
}

/**
 * Publica o relatório do mês, congelando o placar.
 *
 * O placar é gravado e não derivado porque um relatório entregue precisa
 * continuar dizendo o que dizia quando saiu — mesmo que o plano seja refeito
 * depois e as metas mudem.
 */
export async function publicarRelatorio(
  _estado: Estado,
  form: FormData,
): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const clientId = String(form.get("__clientId") ?? "");
  const reportId = String(form.get("__reportId") ?? "");
  const recordId = String(form.get("__recordId") ?? "");
  const refMes = String(form.get("__refMes") ?? "");
  if (!clientId || !reportId || !refMes) return { erro: "Relatório não identificado." };

  const { getProjection, getMetas } = await import("@/lib/planning-dal");
  const [proj, metas] = await Promise.all([getProjection(clientId), getMetas(clientId)]);

  if (!proj) return { erro: "Este cliente ainda não tem um plano." };
  if (!metas) {
    return {
      erro: "Congele as metas do plano antes — sem elas o placar não tem contra o que comparar.",
    };
  }

  const { buildScorecard } = await import("@/lib/planning/scorecard");
  const { fromISO } = await import("@/lib/planning/period");
  const placar = buildScorecard(fromISO(refMes), proj.curta, metas.serie);

  if (placar.length === 0) {
    return { erro: "Este mês está fora da janela projetada pelo plano." };
  }

  const supabase = await createClient();
  const agora = new Date().toISOString();

  const { error } = await supabase
    .from("report")
    .update({
      placar: JSON.parse(JSON.stringify(placar)),
      status: "publicado",
    })
    .eq("id", reportId);

  if (error) return { erro: mensagem(error.message) };

  if (recordId) {
    await supabase
      .from("monthly_record")
      .update({ fechado_em: agora })
      .eq("id", recordId);
  }

  revalidatePath("/", "layout");
  return { ok: "Relatório publicado. O placar deste mês está congelado." };
}

/** Volta o relatório a rascunho, para corrigir algo antes de reenviar. */
export async function reabrirRelatorio(form: FormData): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const reportId = String(form.get("__reportId") ?? "");
  const recordId = String(form.get("__recordId") ?? "");
  if (!reportId) return { erro: "Relatório não identificado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("report")
    .update({ status: "rascunho" })
    .eq("id", reportId);

  if (error) return { erro: mensagem(error.message) };

  if (recordId) {
    await supabase.from("monthly_record").update({ fechado_em: null }).eq("id", recordId);
  }

  revalidatePath("/", "layout");
  return { ok: "Relatório reaberto." };
}

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function rotuloDoMes(iso: string): string {
  return `${MESES_PT[Number(iso.slice(5, 7)) - 1]} de ${iso.slice(0, 4)}`;
}
