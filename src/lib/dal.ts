import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/lib/supabase/database.types";

export type UserRole = Enums<"user_role">;

/** Subconjunto de `app_user` que o DAL expõe. */
export type AppUser = Pick<
  Tables<"app_user">,
  "id" | "org_id" | "nome" | "email" | "role"
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
    .select("id, org_id, nome, email, role")
    .eq("id", userId)
    .single();

  return data ?? null;
});

/** Garante que o usuário tem um dos papéis exigidos; senão, redireciona. */
export const requireRole = cache(async (roles: UserRole[]) => {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) {
    redirect("/login");
  }
  return user;
});
