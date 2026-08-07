"use client";

import { AlertCircle, Check, Loader2 } from "lucide-react";
import type { EstadoAutosave } from "./useAutosave";

/**
 * O "salvando… / salvo" do canto do grid.
 *
 * Discreto de propósito: o autosave só merece atenção quando falha. O erro
 * fica na tela até a próxima gravação bem-sucedida — um toast que some levaria
 * a mensagem embora antes de o planejador voltar os olhos da conversa.
 */
export function IndicadorSalvo({ estado }: { estado: EstadoAutosave }) {
  if (estado.fase === "ocioso") return null;

  if (estado.fase === "salvando") {
    return (
      <span className="inline-flex items-center gap-1.5 font-inter text-xs text-slate-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Salvando…
      </span>
    );
  }

  if (estado.fase === "erro") {
    return (
      <span
        role="alert"
        className="inline-flex items-center gap-1.5 font-inter text-xs text-red-700 bg-red-50 border border-red-100 rounded-full px-2.5 py-1"
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        {estado.mensagem}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-inter text-xs text-emerald-600">
      <Check className="w-3.5 h-3.5" />
      Salvo
    </span>
  );
}
