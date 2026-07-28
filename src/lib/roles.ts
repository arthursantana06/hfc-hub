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

/**
 * O que cada papel pode fazer, em uma linha.
 *
 * "Administrador" e "Planejador" não significam nada sozinhos — quem escolhe
 * precisa saber o que está concedendo. A regra real vive na RLS
 * (`can_write()` = admin | planner; convites e papéis só admin); isto é a
 * tradução dela para quem usa a tela.
 */
export const ROLE_DESCRICAO: Record<UserRole, string> = {
  admin: "Tudo do planejador, mais convidar pessoas e definir papéis",
  planner: "Cadastra clientes, monta planos e publica relatórios",
  assistant: "Papel aposentado — mantido só para dados antigos",
  client: "Acesso ao portal do cliente, em leitura",
};
