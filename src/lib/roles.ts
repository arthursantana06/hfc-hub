import type { Enums } from "@/lib/supabase/database.types";

export type UserRole = Enums<"user_role">;

/**
 * Rótulos pt-BR dos papéis.
 * `assistant` está aposentado (migração 0011) e `client` pertence ao Portal do
 * Cliente — ambos seguem aqui só para não quebrar a exibição de dado antigo.
 */
export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  planner: "Planejador",
  assistant: "Assistente (aposentado)",
  client: "Cliente",
};

/** Os dois papéis internos da consultoria — os únicos atribuíveis. */
export const ASSIGNABLE_ROLES: UserRole[] = ["admin", "planner"];
