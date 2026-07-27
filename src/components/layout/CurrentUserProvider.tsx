"use client";

import { createContext, useContext } from "react";
import type { AppUser } from "@/lib/dal";

/**
 * O usuário da sessão, disponível para componentes client dentro do hub.
 *
 * O layout do hub já busca o `app_user` no servidor; sem isto o rodapé teria
 * de buscá-lo de novo — e `Page` não pode ser async, porque o Dashboard é
 * um componente client.
 */
const CurrentUserContext = createContext<AppUser | null>(null);

export function CurrentUserProvider({
  user,
  children,
}: {
  user: AppUser | null;
  children: React.ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
