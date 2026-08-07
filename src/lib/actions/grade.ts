"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { mensagem } from "./mensagens";
import { gravarLinha } from "./planejamento";
import { ENTIDADES } from "@/lib/forms/planejamento";
import type { Enums } from "@/lib/supabase/database.types";

/**
 * As escritas do grid tipo Excel.
 *
 * Duas diferenças deliberadas em relação a `salvarLinha` (o caminho do diálogo):
 *
 * 1. **Nenhuma chamada a `revalidatePath`.** O grid é dono do estado depois da
 *    hidratação: revalidar o layout a cada célula re-renderizaria o Server
 *    Component no meio da digitação e pisaria no que o planejador está fazendo.
 *    Consequência assumida: totais fora do grid só atualizam ao navegar —
 *    subtotais que precisam ser vivos são calculados no cliente, dentro do grid.
 *
 * 2. **O retorno é dado, não mensagem.** Quem fala com o planejador é o
 *    indicador salvando/salvo do grid; a action devolve o id criado e a
 *    persistência resultante para o estado local se corrigir.
 *
 * A gravação em si continua passando por `gravarLinha` — mesma validação de
 * esquema, mesma lista branca. O grid envia a LINHA INTEIRA a cada salvamento
 * (não só a célula alterada): assim `montarRegistro` reaplica `visivelSe` com o
 * contexto completo — mudar a frequência para "mensal" anula o mês de
 * ocorrência sozinho — e o servidor nunca precisa adivinhar o resto da linha.
 */

type RowPersistence = Enums<"row_persistence">;

export interface RespostaGrid {
  erro?: string;
  /** Id da linha — o real, quando a criação troca o id provisório do grid. */
  id?: string;
  /** Persistência após a gravação, para o pin do Real se atualizar. */
  persistencia?: RowPersistence;
}

function generico(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase as unknown as SupabaseClient;
}

/** Mesma guarda das demais actions: a RLS autoriza, isto só melhora o erro. */
async function autor() {
  const user = await getCurrentUser();
  if (!user) return { erro: "Sessão expirada. Entre novamente." as const };
  if (user.role !== "admin" && user.role !== "planner") {
    return { erro: "Seu papel não permite editar o planejamento." as const };
  }
  return { user };
}

/**
 * Grava uma linha existente do grid (blur/Enter numa célula).
 *
 * No Real, editar uma linha herdada a promove a ajuste pontual (`mes`)
 * automaticamente — perguntar "pontual ou permanente?" a cada blur mataria o
 * autosave; o pin da linha permite fixar como permanente depois.
 */
export async function salvarLinhaDoGrid(form: FormData): Promise<RespostaGrid> {
  const id = String(form.get("__id") ?? "");
  if (!id) return { erro: "Linha não identificada." };

  const promocao = await promoverSePreciso(form, id);
  if (promocao.erro) return promocao;

  const r = await gravarLinha(form);
  if ("erro" in r) return { erro: r.erro };

  return { id: r.id, persistencia: promocao.persistencia };
}

/**
 * Cria a linha da "linha fantasma" do rodapé, com defaults do esquema.
 *
 * O grid cria a linha assim que a primeira célula é confirmada; os campos que o
 * planejador ainda não preencheu nascem do `padrao` do esquema (ou zerados, nos
 * numéricos) para que os obrigatórios não travem a criação no meio da digitação.
 */
export async function criarLinhaDoGrid(form: FormData): Promise<RespostaGrid> {
  const entidade = ENTIDADES[String(form.get("__entidade") ?? "")];
  if (!entidade) return { erro: "Entidade desconhecida." };

  for (const c of entidade.campos) {
    const bruto = String(form.get(c.key) ?? "").trim();
    if (bruto !== "") continue;
    if (c.padrao !== undefined) form.set(c.key, c.padrao);
    else if (c.obrigatorio && ["moeda", "decimal", "inteiro"].includes(c.tipo)) {
      form.set(c.key, "0");
    }
  }

  // Linha nova num período Real é ajuste do mês por definição — ela não veio
  // do HFC. O pin permite promovê-la a permanente depois.
  const persistencia: RowPersistence =
    (await tipoDoPlano(form)) === "real" ? "mes" : "herdado";
  const r = await gravarLinha(form);
  if ("erro" in r) return { erro: r.erro };

  if (persistencia !== "herdado") {
    await marcarPersistencia(r.entidade.tabela, r.id, persistencia);
  }
  return { id: r.id, persistencia };
}

/**
 * Remove uma linha a partir do grid.
 *
 * Em Pré-HFC/HFC (e em linhas que nasceram no próprio período) é delete físico.
 * No Real, linha herdada vira tombstone: `suprimido = true`, mantida no banco
 * para que a supressão sobreviva à abertura do período seguinte — um delete
 * físico faria a linha ressuscitar do HFC na próxima virada.
 */
export async function removerLinhaDoGrid(form: FormData): Promise<RespostaGrid> {
  const a = await autor();
  if ("erro" in a && a.erro) return { erro: a.erro };

  const entidade = ENTIDADES[String(form.get("__entidade") ?? "")];
  const id = String(form.get("__id") ?? "");
  if (!entidade || !id) return { erro: "Registro não identificado." };

  const supabase = await createClient();
  const { data: linha } = await generico(supabase)
    .from(entidade.tabela)
    .select("base_id")
    .eq("id", id)
    .maybeSingle();

  const herdada =
    (linha as { base_id?: string | null } | null)?.base_id != null &&
    (await tipoDoPlano(form)) === "real";

  const { data: afetada, error } = herdada
    ? await generico(supabase)
        .from(entidade.tabela)
        .update({ suprimido: true, persistencia: "mes" })
        .eq("id", id)
        .select("id")
        .maybeSingle()
    : await generico(supabase)
        .from(entidade.tabela)
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

  if (error) return { erro: mensagem(error.message) };
  if (!afetada) return { erro: "Nada foi removido — a linha não existe ou não é sua." };
  return {};
}

/** O pin do Real: alterna um ajuste entre pontual (`mes`) e `permanente`. */
export async function alternarPersistencia(form: FormData): Promise<RespostaGrid> {
  const a = await autor();
  if ("erro" in a && a.erro) return { erro: a.erro };

  const entidade = ENTIDADES[String(form.get("__entidade") ?? "")];
  const id = String(form.get("__id") ?? "");
  if (!entidade || !id) return { erro: "Registro não identificado." };

  const supabase = await createClient();
  const { data: linha } = await generico(supabase)
    .from(entidade.tabela)
    .select("persistencia")
    .eq("id", id)
    .maybeSingle();
  if (!linha) return { erro: "Linha não encontrada." };

  const atual = (linha as { persistencia: RowPersistence }).persistencia;
  // `herdado` também pina direto para permanente: o planejador está dizendo
  // "quero garantir que isto continue assim", sem precisar editar antes.
  const nova: RowPersistence = atual === "permanente" ? "mes" : "permanente";

  const erro = await marcarPersistencia(entidade.tabela, id, nova);
  if (erro) return { erro };
  return { persistencia: nova };
}

// ─────────────────────────────────────────────────────────────

async function marcarPersistencia(
  tabela: string,
  id: string,
  persistencia: RowPersistence,
): Promise<string | undefined> {
  const supabase = await createClient();
  const { data, error } = await generico(supabase)
    .from(tabela)
    .update({ persistencia })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return mensagem(error.message);
  if (!data) return "Nada foi gravado — a linha não existe ou não é sua.";
  return undefined;
}

/**
 * Promove `herdado` → `mes` antes de gravar a edição, quando o plano é Real.
 *
 * Leitura antes da escrita (duas idas) em vez de um update condicional: o
 * cliente Supabase não expõe `set persistencia = case …`, e o grid precisa do
 * valor resultante para atualizar o pin.
 */
async function promoverSePreciso(
  form: FormData,
  id: string,
): Promise<{ erro?: string; persistencia?: RowPersistence }> {
  const entidade = ENTIDADES[String(form.get("__entidade") ?? "")];
  if (!entidade) return { erro: "Entidade desconhecida." };

  if ((await tipoDoPlano(form)) !== "real") return {};

  const supabase = await createClient();
  const { data: linha } = await generico(supabase)
    .from(entidade.tabela)
    .select("persistencia")
    .eq("id", id)
    .maybeSingle();
  if (!linha) return {};

  const atual = (linha as { persistencia: RowPersistence }).persistencia;
  if (atual !== "herdado") return { persistencia: atual };

  const erro = await marcarPersistencia(entidade.tabela, id, "mes");
  return erro ? { erro } : { persistencia: "mes" };
}

/**
 * O tipo do plano em que o grid está — decide promoção e tombstone.
 *
 * Consultado no servidor a partir do `__planId`, nunca confiado do navegador:
 * um `__tipo` forjado no FormData poderia transformar supressão em delete.
 */
async function tipoDoPlano(form: FormData): Promise<Enums<"plan_kind"> | null> {
  const planId = String(form.get("__planId") ?? "");
  if (!planId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("financial_plan")
    .select("tipo")
    .eq("id", planId)
    .maybeSingle();

  return data?.tipo ?? null;
}
