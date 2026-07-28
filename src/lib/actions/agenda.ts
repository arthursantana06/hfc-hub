"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";

export type Estado = { erro?: string; ok?: string } | undefined;

async function autor() {
  const user = await getCurrentUser();
  if (!user) return { erro: "Sessão expirada. Entre novamente." as const };
  if (user.role !== "admin" && user.role !== "planner") {
    return { erro: "Seu papel não permite editar a agenda." as const };
  }
  return { user };
}

export async function salvarReuniao(
  _estado: Estado,
  form: FormData,
): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const data = String(form.get("data") ?? "").trim();
  const hora = String(form.get("hora") ?? "").trim();
  if (!data || !hora) return { erro: "Informe a data e o horário." };

  // Fuso fixo -03:00: o Brasil aboliu o horário de verão em 2019, e é o único
  // fuso em que a consultoria opera — não há ambiguidade a resolver aqui, nem
  // motivo para depender do fuso do servidor.
  const quando = new Date(`${data}T${hora}:00-03:00`);
  if (Number.isNaN(quando.getTime())) return { erro: "Data ou horário inválidos." };

  // Cada valor de "pessoas" chega como "staff:<id>" ou "cliente:<id>" — o
  // prefixo diz em qual coluna gravar, já que um `uuid` sozinho não diz de
  // qual tabela veio.
  const pessoas = form
    .getAll("pessoas")
    .map((v) => String(v).split(":"))
    .filter((par): par is [string, string] => par.length === 2 && (par[0] === "staff" || par[0] === "cliente"))
    .map(([tipo, id]) => ({ tipo, id }));

  const dados = {
    quando: quando.toISOString(),
    client_id: String(form.get("cliente_id") ?? "").trim() || null,
    notas: String(form.get("notas") ?? "").trim() || null,
  };

  const supabase = await createClient();
  const id = String(form.get("__id") ?? "");
  let meetingId = id;

  if (id) {
    const { error } = await supabase.from("meeting").update(dados).eq("id", id);
    if (error) return { erro: mensagem(error.message) };

    // Substitui o conjunto inteiro em vez de tentar diferenciar quem entrou
    // e quem saiu — mais simples e, numa lista de no máximo algumas dezenas
    // de pessoas, o custo é irrelevante.
    const { error: erroLimpeza } = await supabase
      .from("meeting_participante")
      .delete()
      .eq("meeting_id", id);
    if (erroLimpeza) return { erro: mensagem(erroLimpeza.message) };
  } else {
    const { data: nova, error } = await supabase
      .from("meeting")
      .insert({ ...dados, org_id: a.user.org_id })
      .select("id")
      .single();
    if (error || !nova) return { erro: mensagem(error?.message ?? "") };
    meetingId = nova.id;
  }

  if (pessoas.length > 0) {
    const linhas = pessoas.map((p) => ({
      org_id: a.user.org_id,
      meeting_id: meetingId,
      app_user_id: p.tipo === "staff" ? p.id : null,
      client_id: p.tipo === "cliente" ? p.id : null,
    }));
    const { error: erroParticipantes } = await supabase
      .from("meeting_participante")
      .insert(linhas);
    if (erroParticipantes) return { erro: mensagem(erroParticipantes.message) };
  }

  revalidatePath("/agenda");
  return { ok: id ? "Reunião atualizada." : "Reunião agendada." };
}

export async function removerReuniao(form: FormData): Promise<Estado> {
  const a = await autor();
  if ("erro" in a) return a;

  const id = String(form.get("__id") ?? "");
  if (!id) return { erro: "Reunião não identificada." };

  const supabase = await createClient();
  const { error } = await supabase.from("meeting").delete().eq("id", id);
  if (error) return { erro: mensagem(error.message) };

  revalidatePath("/agenda");
  return { ok: "Reunião removida." };
}

function mensagem(raw: string): string {
  if (raw.includes("row-level security")) {
    return "Você não tem permissão para esta alteração.";
  }
  if (raw.includes("violates foreign key")) {
    return "Há um vínculo inválido no formulário. Recarregue a página.";
  }
  return "Não foi possível salvar. Tente de novo.";
}
