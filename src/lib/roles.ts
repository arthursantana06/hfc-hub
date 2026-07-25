import type { Enums } from "@/lib/supabase/database.types";

export type UserRole = Enums<"user_role">;

/** Rótulos pt-BR dos papéis — usados na sidebar e em Configurações. */
export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  planner: "Planejador",
  assistant: "Assistente",
  client: "Cliente",
};

/** Papéis internos atribuíveis pela tela de Configurações (`client` é do portal). */
export const ASSIGNABLE_ROLES: UserRole[] = ["admin", "planner", "assistant"];
