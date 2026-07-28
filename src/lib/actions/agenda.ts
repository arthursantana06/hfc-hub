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

  const dados = {
    quando: quando.toISOString(),
    client_id: String(form.get("cliente_id") ?? "").trim() || null,
    planner_id: String(form.get("planner_id") ?? "").trim() || null,
    notas: String(form.get("notas") ?? "").trim() || null,
  };

  const supabase = await createClient();
  const id = String(form.get("__id") ?? "");

  if (id) {
    const { error } = await supabase.from("meeting").update(dados).eq("id", id);
    if (error) return { erro: mensagem(error.message) };
    revalidatePath("/agenda");
    return { ok: "Reunião atualizada." };
  }

  const { error } = await supabase
    .from("meeting")
    .insert({ ...dados, org_id: a.user.org_id });
  if (error) return { erro: mensagem(error.message) };

  revalidatePath("/agenda");
  return { ok: "Reunião agendada." };
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
