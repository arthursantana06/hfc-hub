"use client";

import { useActionState } from "react";
import { updateUserRole } from "@/lib/actions/settings";
import { FormAlert } from "@/components/ui/Form";
import { ROLE_LABEL, ROLE_DESCRICAO, ASSIGNABLE_ROLES } from "@/lib/roles";
import { Select } from "@/components/ui/Select";
import { ShieldCheck, UserRound } from "lucide-react";
import type { AppUser } from "@/lib/dal";

const ICONE_PAPEL = { admin: ShieldCheck, planner: UserRound } as const;

const OPCOES_PAPEL = ASSIGNABLE_ROLES.map((r) => ({
  valor: r,
  rotulo: ROLE_LABEL[r],
  descricao: ROLE_DESCRICAO[r],
  icone: ICONE_PAPEL[r as keyof typeof ICONE_PAPEL],
}));

export function UsersTable({
  users,
  currentUserId,
  canEdit,
}: {
  users: AppUser[];
  currentUserId: string;
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState(updateUserRole, undefined);

  return (
    <div className="flex flex-col gap-4">
      {state?.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state?.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <div className="flex flex-col divide-y divide-slate-100">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between gap-4 py-3.5"
          >
            <div className="min-w-0">
              <p className="font-inter text-sm text-slate-800 truncate">
                {u.nome ?? "—"}
                {u.id === currentUserId && (
                  <span className="ml-2 font-inter text-xs text-slate-400">
                    (você)
                  </span>
                )}
              </p>
              <p className="font-inter text-xs text-slate-500 truncate">
                {u.email ?? "—"}
              </p>
            </div>

            {canEdit ? (
              <form action={action} className="flex items-center gap-2 shrink-0">
                <input type="hidden" name="userId" value={u.id} />
                <Select
                  id={`role-${u.id}`}
                  name="role"
                  defaultValue={u.role}
                  opcoes={OPCOES_PAPEL}
                  tamanho="sm"
                  className="w-44"
                  aria-label={`Papel de ${u.nome ?? u.email ?? "usuário"}`}
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg font-inter text-sm font-medium text-brand-600 hover:bg-brand-300/15 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  Salvar
                </button>
              </form>
            ) : (
              <span className="shrink-0 px-2.5 py-1 rounded-md bg-slate-100 font-inter text-xs font-medium text-slate-600">
                {ROLE_LABEL[u.role]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
