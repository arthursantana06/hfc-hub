"use client";

import {
  dataParaMes,
  escreverMoeda,
  type Campo,
} from "@/lib/forms/planejamento";

export interface OpcoesRef {
  categoria?: { valor: string; rotulo: string; grupo?: string }[];
}

const base =
  "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 " +
  "placeholder-slate-400 font-inter focus:outline-none focus:ring-2 focus:ring-brand-300 " +
  "focus:border-transparent transition-shadow";

/**
 * Renderiza um campo a partir do esquema.
 *
 * Números monetários usam `inputMode="decimal"` e não `type="number"`: o campo
 * numérico do navegador rejeita "1.234,56" e mostra a vírgula como erro em
 * teclado pt-BR. A conversão fica no servidor, que é onde precisa estar de
 * qualquer forma.
 */
export function CampoForm({
  campo,
  valor,
  opcoes,
  onChange,
}: {
  campo: Campo;
  valor: unknown;
  opcoes?: OpcoesRef;
  onChange?: (v: string) => void;
}) {
  const comum = {
    id: campo.key,
    name: campo.key,
    required: campo.obrigatorio,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange?.(e.target.value),
  };

  return (
    <div className={campo.span === 2 ? "sm:col-span-2" : ""}>
      <label
        htmlFor={campo.key}
        className="block font-inter text-xs font-medium text-slate-600 mb-1.5"
      >
        {campo.label}
        {campo.obrigatorio && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {campo.tipo === "bool" ? (
        <label className="flex items-center gap-2 py-2 cursor-pointer">
          <input
            type="checkbox"
            name={campo.key}
            defaultChecked={Boolean(valor)}
            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-300"
          />
          <span className="font-inter text-sm text-slate-600">Sim</span>
        </label>
      ) : campo.tipo === "select" ? (
        <select {...comum} defaultValue={valor === null || valor === undefined ? "" : String(valor)} className={base}>
          {!campo.obrigatorio && !campo.opcoes?.some((o) => o.valor === "") && (
            <option value="">—</option>
          )}
          {campo.opcoes?.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      ) : campo.tipo === "ref" ? (
        <select {...comum} defaultValue={valor ? String(valor) : ""} className={base}>
          <option value="">Escolha…</option>
          {agrupar(opcoes?.categoria ?? []).map(([grupo, itens]) => (
            <optgroup key={grupo} label={grupo}>
              {itens.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      ) : campo.tipo === "mes" ? (
        <input
          {...comum}
          type="month"
          defaultValue={dataParaMes(valor as string | null)}
          className={base}
        />
      ) : campo.tipo === "inteiro" ? (
        <input
          {...comum}
          type="number"
          min={campo.min}
          max={campo.max}
          step={1}
          defaultValue={valor === null || valor === undefined ? "" : String(valor)}
          className={base}
        />
      ) : campo.tipo === "moeda" ? (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-inter text-sm text-slate-400 pointer-events-none">
            R$
          </span>
          <input
            {...comum}
            type="text"
            inputMode="decimal"
            defaultValue={escreverMoeda(valor as number | null)}
            placeholder="0,00"
            className={`${base} pl-10 text-right tabular-nums`}
          />
        </div>
      ) : (
        <input
          {...comum}
          type="text"
          defaultValue={valor === null || valor === undefined ? "" : String(valor)}
          placeholder={campo.placeholder}
          className={base}
        />
      )}

      {campo.ajuda && (
        <p className="font-inter text-xs text-slate-400 mt-1">{campo.ajuda}</p>
      )}
    </div>
  );
}

const GRUPOS: Record<string, string> = {
  casa: "Casa",
  saude: "Saúde",
  transporte: "Transporte",
  lazer: "Lazer",
  filhos_pets: "Filhos e Pets",
  outros: "Outros",
};

function agrupar(itens: { valor: string; rotulo: string; grupo?: string }[]) {
  const mapa = new Map<string, typeof itens>();
  for (const i of itens) {
    const g = GRUPOS[i.grupo ?? "outros"] ?? "Outros";
    if (!mapa.has(g)) mapa.set(g, []);
    mapa.get(g)!.push(i);
  }
  return [...mapa.entries()];
}
