import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/lib/supabase/database.types";

export type UserRole = Enums<"user_role">;

/** Subconjunto de `app_user` que o DAL expõe. */
export type AppUser = Pick<
  Tables<"app_user">,
  "id" | "org_id" | "nome" | "email" | "role" | "avatar_path"
>;

/**
 * Data Access Layer — centraliza a checagem de sessão e autorização.
 * `cache()` memoiza dentro de um mesmo render, evitando chamadas duplicadas.
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { userId: user.id };
});

/** Perfil da aplicação (app_user) do usuário autenticado, ou null. */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("app_user")
    .select("id, org_id, nome, email, role, avatar_path")
    .eq("id", userId)
    .single();

  return data ?? null;
});

/** Membros da organização. Staff enxerga a lista; só admin altera (RLS). */
export const listOrgUsers = cache(async (): Promise<AppUser[]> => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("app_user")
    .select("id, org_id, nome, email, role, avatar_path")
    .order("nome");

  return data ?? [];
});

/** Subconjunto de `signup_invite` exibido em Configurações. */
export type SignupInvite = Pick<
  Tables<"signup_invite">,
  "id" | "email" | "role" | "usado_em" | "created_at"
>;

/** Convites de cadastro da organização. A RLS só devolve linhas para admin. */
export const listInvites = cache(async (): Promise<SignupInvite[]> => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("signup_invite")
    .select("id, email, role, usado_em, created_at")
    .order("created_at", { ascending: false });

  return data ?? [];
});

/** Garante que o usuário tem um dos papéis exigidos; senão, redireciona. */
export const requireRole = cache(async (roles: UserRole[]) => {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) {
    redirect("/login");
  }
  return user;
});

/**
 * URL temporária para uma foto no bucket privado `avatars`.
 *
 * Guardamos o caminho, não a URL: assinatura expira, caminho não. Uma hora
 * cobre com folga o tempo de vida de uma página.
 */
export const signedAvatarUrl = cache(
  async (path: string | null): Promise<string | null> => {
    if (!path) return null;

    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60);

    return data?.signedUrl ?? null;
  },
);
