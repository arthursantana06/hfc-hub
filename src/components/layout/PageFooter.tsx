"use client";

import { useCurrentUser } from "./CurrentUserProvider";
import { ROLE_LABEL } from "@/lib/roles";

/**
 * Rodapé das telas do hub. Serve a um propósito só: deixar explícito com qual
 * usuário a sessão está aberta — útil quando planejador e admin dividem a
 * mesma máquina. Sem marca, sem selo de fase.
 */
export function PageFooter() {
  const user = useCurrentUser();

  if (!user) return null;

  return (
    <footer className="shrink-0 flex items-center justify-end gap-2 px-8 py-2.5 bg-white border-t border-slate-200">
      <span className="font-inter text-xs text-slate-500">
        {user.nome ?? user.email ?? "—"}
      </span>
      <span aria-hidden className="text-slate-300">
        ·
      </span>
      <span className="font-inter text-xs text-slate-400">
        {ROLE_LABEL[user.role]}
      </span>
    </footer>
  );
}
