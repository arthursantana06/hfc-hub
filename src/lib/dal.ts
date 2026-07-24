import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "planner" | "assistant" | "client";

export interface AppUser {
  id: string;
  org_id: string;
  nome: string | null;
  email: string | null;
  role: UserRole;
}

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

  return (data as AppUser) ?? null;
});

/** Garante que o usuário tem um dos papéis exigidos; senão, redireciona. */
export const requireRole = cache(async (roles: UserRole[]) => {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) {
    redirect("/login");
  }
  return user;
});
