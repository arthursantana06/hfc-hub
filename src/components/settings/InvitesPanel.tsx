"use client";

import { useActionState } from "react";
import { ShieldCheck, Trash2, UserRound } from "lucide-react";
import { createInvite, deleteInvite } from "@/lib/actions/settings";
import { Field, FormAlert } from "@/components/ui/Form";
import { ROLE_LABEL, ROLE_DESCRICAO, ASSIGNABLE_ROLES } from "@/lib/roles";
import { Select } from "@/components/ui/Select";
import type { SignupInvite } from "@/lib/dal";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function InvitesPanel({ invites }: { invites: SignupInvite[] }) {
  const [createState, createAction, creating] = useActionState(
    createInvite,
    undefined,
  );
  const [deleteState, deleteAction] = useActionState(deleteInvite, undefined);

  const state = createState ?? deleteState;

  return (
    <div className="flex flex-col gap-6">
      {state?.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state?.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <form action={createAction} className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[16rem]">
          <Field
            id="email"
            label="E-mail liberado"
            type="email"
            placeholder="pessoa@hfc.com.br"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="font-inter text-sm text-slate-700">
            Papel
          </label>
          <Select
            id="role"
            name="role"
            defaultValue="planner"
            className="min-w-52"
            opcoes={ASSIGNABLE_ROLES.map((r) => ({
              valor: r,
              rotulo: ROLE_LABEL[r],
              descricao: ROLE_DESCRICAO[r],
              icone: r === "admin" ? ShieldCheck : UserRound,
            }))}
          />
        </div>

        <button
          type="submit"
          disabled={creating}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-lg font-inter font-medium text-sm shadow-sm hover:bg-brand-900 disabled:opacity-60 transition-colors cursor-pointer"
        >
          {creating ? "Liberando…" : "Liberar"}
        </button>
      </form>

      {invites.length > 0 ? (
        <div className="flex flex-col divide-y divide-slate-100 border-t border-slate-100">
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="font-inter text-sm text-slate-800 truncate">
                  {inv.email}
                </p>
                <p className="font-inter text-xs text-slate-500">
                  {ROLE_LABEL[inv.role]} · liberado em {formatDate(inv.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {inv.usado_em ? (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-50 font-inter text-xs font-medium text-emerald-700">
                    Conta criada
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 font-inter text-xs font-medium text-slate-600">
                    Aguardando
                  </span>
                )}

                <form action={deleteAction}>
                  <input type="hidden" name="id" value={inv.id} />
                  <button
                    type="submit"
                    aria-label={`Remover convite de ${inv.email}`}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-inter text-sm text-slate-500 border-t border-slate-100 pt-4">
          Nenhum e-mail liberado ainda. Quem não estiver nesta lista não consegue
          criar conta.
        </p>
      )}
    </div>
  );
}
