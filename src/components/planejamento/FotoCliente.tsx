"use client";

import { useActionState, useRef, useState } from "react";
import { updateClientAvatar, removeClientAvatar } from "@/lib/actions/avatar";
import { Avatar } from "@/components/ui/Avatar";

/** Foto do cliente — opcional, mesmas regras da foto do usuário. */
export function FotoCliente({
  clientId,
  url,
  nome,
}: {
  clientId: string;
  url: string | null;
  nome: string;
}) {
  const [estado, acao, pendente] = useActionState(updateClientAvatar, undefined);
  const [removendo, setRemovendo] = useState(false);
  const [erroRemocao, setErroRemocao] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function remover() {
    setRemovendo(true);
    const r = await removeClientAvatar(clientId);
    setErroRemocao(r?.error ?? null);
    setRemovendo(false);
  }

  const ocupado = pendente || removendo;
  const erro = estado?.error ?? erroRemocao;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-5">
        <Avatar src={url} nome={nome} size={72} />

        <form ref={formRef} action={acao} className="flex flex-col gap-1.5">
          <input type="hidden" name="clientId" value={clientId} />
          <label
            className={`font-inter text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors ${
              ocupado ? "opacity-50 pointer-events-none" : "cursor-pointer"
            }`}
          >
            {url ? "Trocar foto" : "Adicionar foto"}
            <input
              type="file"
              name="foto"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={ocupado}
              onChange={() => formRef.current?.requestSubmit()}
            />
          </label>

          {url && (
            <button
              type="button"
              onClick={remover}
              disabled={ocupado}
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

      {erro && (
        <p className="font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {erro}
        </p>
      )}
    </div>
  );
}
