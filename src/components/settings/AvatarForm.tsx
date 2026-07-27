"use client";

import { useActionState, useRef, useState } from "react";
import { updateOwnAvatar, removeOwnAvatar } from "@/lib/actions/avatar";
import { Avatar } from "@/components/ui/Avatar";
import { FormAlert } from "@/components/ui/Form";

/**
 * Foto de perfil — opcional. Sem foto, as iniciais seguem valendo em todo o hub.
 *
 * O formulário se envia sozinho ao escolher o arquivo: um botão "Salvar" extra
 * só adiciona um passo que ninguém espera num seletor de foto.
 */
export function AvatarForm({
  url,
  nome,
}: {
  url: string | null;
  nome: string | null;
}) {
  const [state, action, pending] = useActionState(updateOwnAvatar, undefined);
  const [removing, setRemoving] = useState(false);
  const [removeState, setRemoveState] = useState<{ error?: string } | null>(
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  async function handleRemove() {
    setRemoving(true);
    setRemoveState(await removeOwnAvatar() ?? null);
    setRemoving(false);
  }

  const busy = pending || removing;
  const error = state?.error ?? removeState?.error;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-5">
        <Avatar src={url} nome={nome} size={72} />

        <form ref={formRef} action={action} className="flex flex-col gap-1.5">
          <label
            className={`font-inter text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors ${
              busy ? "opacity-50 pointer-events-none" : "cursor-pointer"
            }`}
          >
            {url ? "Trocar foto" : "Adicionar foto"}
            <input
              type="file"
              name="foto"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={() => formRef.current?.requestSubmit()}
            />
          </label>

          {url && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="font-inter text-xs text-slate-500 hover:text-slate-800 disabled:opacity-50 cursor-pointer text-left px-3"
            >
              Remover
            </button>
          )}
        </form>
      </div>

      <p className="font-inter text-xs text-slate-400">
        JPG, PNG ou WebP, até 2 MB. Opcional.
      </p>

      {error && <FormAlert tone="error">{error}</FormAlert>}
      {state?.success && !error && (
        <FormAlert tone="success">{state.success}</FormAlert>
      )}
    </div>
  );
}
