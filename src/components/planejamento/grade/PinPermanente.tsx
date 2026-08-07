"use client";

import { Pin, PinOff } from "lucide-react";
import type { Enums } from "@/lib/supabase/database.types";

type Persistencia = Enums<"row_persistence">;

const TITULO: Record<Persistencia, string> = {
  herdado:
    "Vem do HFC e não foi tocada neste mês. Fixar faz este valor viajar para os próximos períodos.",
  mes: "Ajuste só deste mês — no próximo período volta a valer o HFC. Clique para fixar.",
  permanente:
    "Ajuste fixado: viaja para os períodos seguintes. Clique para voltar a valer só neste mês.",
};

/**
 * O pin que decide se um ajuste é do mês ou daqui para a frente.
 *
 * Só aparece no Planejamento Real, porque só ele tem "próximo período". A
 * decisão fica numa coluna e não num diálogo de confirmação a cada edição:
 * perguntar "pontual ou permanente?" a cada célula alterada mataria a fluidez
 * que o grid existe para dar. O default é o mais conservador — o que se edita
 * na reunião vale para a reunião —, e fixar é um clique consciente.
 */
export function PinPermanente({
  persistencia,
  aoAlternar,
}: {
  persistencia: Persistencia;
  aoAlternar: () => void;
}) {
  const fixado = persistencia === "permanente";

  return (
    <button
      type="button"
      onClick={aoAlternar}
      title={TITULO[persistencia]}
      aria-pressed={fixado}
      aria-label={fixado ? "Ajuste permanente — desfixar" : "Fixar como permanente"}
      className={`p-1.5 rounded-md transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-300/40 ${
        fixado
          ? "text-brand-600 hover:text-brand-900"
          : "text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 focus:opacity-100"
      }`}
    >
      {fixado ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
    </button>
  );
}
