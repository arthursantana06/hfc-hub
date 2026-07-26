"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireRole, type UserRole } from "@/lib/dal";
import { ASSIGNABLE_ROLES } from "@/lib/roles";

export type SettingsFormState =
  | { error?: string; success?: string }
  | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Nome do próprio perfil. Vai pela RPC update_own_profile (ver migração 0009). */
export async function updateProfile(
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const nome = String(formData.get("nome") ?? "").trim();
  if (nome.length < 2) return { error: "Informe seu nome completo." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_profile", { p_nome: nome });

  if (error) return { error: "Não foi possível salvar o nome." };

  revalidatePath("/", "layout");
  return { success: "Perfil atualizado." };
}

/** Dados da organização — só admin (a RLS org_admin_write também barra). */
export async function updateOrganization(
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const admin = await requireRole(["admin"]);

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Informe o nome da organização." };

  const planoRaw = String(formData.get("plano") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("organization")
    .update({ name, plano: planoRaw || null })
    .eq("id", admin.org_id);

  if (error) return { error: "Não foi possível salvar a organização." };

  revalidatePath("/configuracoes");
  return { success: "Organização atualizada." };
}

/** Troca o papel de um membro da org — só admin. */
export async function updateUserRole(
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const admin = await requireRole(["admin"]);

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!ASSIGNABLE_ROLES.includes(role)) return { error: "Papel inválido." };

  // Sem isso, o último admin pode se rebaixar e deixar a org sem quem administre.
  if (userId === admin.id && role !== "admin") {
    return {
      error:
        "Você não pode remover o próprio papel de admin. Peça a outro admin.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_user")
    .update({ role })
    .eq("id", userId)
    .eq("org_id", admin.org_id);

  if (error) return { error: "Não foi possível alterar o papel." };

  revalidatePath("/configuracoes");
  return { success: "Papel atualizado." };
}

/** Libera um e-mail para criar conta, já com o papel definido — só admin. */
export async function createInvite(
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const admin = await requireRole(["admin"]);

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!EMAIL_RE.test(email)) return { error: "Informe um e-mail válido." };
  if (!ASSIGNABLE_ROLES.includes(role)) return { error: "Papel inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("signup_invite").insert({
    org_id: admin.org_id,
    email,
    role,
    convidado_por: admin.id,
  });

  if (error) {
    // Índice único em lower(email): o e-mail já foi liberado antes.
    if (error.code === "23505") {
      return { error: "Este e-mail já tem convite." };
    }
    return { error: "Não foi possível criar o convite." };
  }

  revalidatePath("/configuracoes");
  return { success: `Convite liberado para ${email}.` };
}

/** Revoga um convite ainda não usado — só admin. */
export async function deleteInvite(
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const admin = await requireRole(["admin"]);

  const id = String(formData.get("id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("signup_invite")
    .delete()
    .eq("id", id)
    .eq("org_id", admin.org_id);

  if (error) return { error: "Não foi possível remover o convite." };

  revalidatePath("/configuracoes");
  return { success: "Convite removido." };
}
