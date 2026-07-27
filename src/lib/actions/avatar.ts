"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";

export type AvatarFormState = { error?: string; success?: string } | undefined;

const MAX_BYTES = 2 * 1024 * 1024; // igual ao limite do bucket
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Foto de perfil do próprio usuário.
 *
 * O nome do arquivo carrega um sufixo aleatório porque a URL assinada é
 * cacheada pelo navegador: reusar `avatar.jpg` faria a foto antiga continuar
 * aparecendo depois da troca.
 */
export async function updateOwnAvatar(
  _state: AvatarFormState,
  formData: FormData,
): Promise<AvatarFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Escolha uma imagem." };
  }

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return { error: "Use uma imagem JPG, PNG ou WebP." };
  if (file.size > MAX_BYTES) return { error: "A imagem deve ter até 2 MB." };

  const supabase = await createClient();
  const dir = `${user.org_id}/users/${user.id}`;
  const path = `${dir}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: "Não foi possível enviar a imagem." };

  const { error: saveError } = await supabase.rpc("update_own_avatar", {
    p_path: path,
  });

  if (saveError) {
    // Sem isto o bucket acumularia órfãos que ninguém referencia.
    await supabase.storage.from("avatars").remove([path]);
    return { error: "Não foi possível salvar a foto." };
  }

  await removeOtherFiles(dir, path);

  revalidatePath("/", "layout");
  return { success: "Foto atualizada." };
}

/** Volta às iniciais: limpa a coluna e apaga os arquivos da pasta. */
export async function removeOwnAvatar(): Promise<AvatarFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_avatar", { p_path: "" });
  if (error) return { error: "Não foi possível remover a foto." };

  await removeOtherFiles(`${user.org_id}/users/${user.id}`, null);

  revalidatePath("/", "layout");
  return { success: "Foto removida." };
}

/** Apaga tudo na pasta menos `keep` — o upload anterior não serve mais. */
async function removeOtherFiles(dir: string, keep: string | null) {
  const supabase = await createClient();
  const { data } = await supabase.storage.from("avatars").list(dir);
  const stale = (data ?? [])
    .map((o) => `${dir}/${o.name}`)
    .filter((p) => p !== keep);

  if (stale.length > 0) {
    await supabase.storage.from("avatars").remove(stale);
  }
}

/**
 * Foto do cliente. Mesma mecânica da do usuário, mas a autorização é outra:
 * a pasta `clients/` segue `can_write()`, então qualquer admin ou planejador da
 * organização pode manter a foto de qualquer cliente dela.
 */
export async function updateClientAvatar(
  _state: AvatarFormState,
  formData: FormData,
): Promise<AvatarFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "Cliente não identificado." };

  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Escolha uma imagem." };
  }

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return { error: "Use uma imagem JPG, PNG ou WebP." };
  if (file.size > MAX_BYTES) return { error: "A imagem deve ter até 2 MB." };

  const supabase = await createClient();
  const dir = `${user.org_id}/clients/${clientId}`;
  const path = `${dir}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: "Não foi possível enviar a imagem." };

  const { error: saveError } = await supabase
    .from("client")
    .update({ avatar_path: path })
    .eq("id", clientId);

  if (saveError) {
    await supabase.storage.from("avatars").remove([path]);
    return { error: "Não foi possível salvar a foto." };
  }

  await removeOtherFiles(dir, path);

  revalidatePath("/", "layout");
  return { success: "Foto atualizada." };
}

export async function removeClientAvatar(clientId: string): Promise<AvatarFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };
  if (!clientId) return { error: "Cliente não identificado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("client")
    .update({ avatar_path: null })
    .eq("id", clientId);

  if (error) return { error: "Não foi possível remover a foto." };

  await removeOtherFiles(`${user.org_id}/clients/${clientId}`, null);

  revalidatePath("/", "layout");
  return { success: "Foto removida." };
}
