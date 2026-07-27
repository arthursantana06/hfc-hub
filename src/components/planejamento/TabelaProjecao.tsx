"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/types";

export interface LinhaProjecao {
  chave: string;
  rotulo: string;
  marco?: string;
  valores: number[];
}

/**
 * A tabela por trás do gráfico.
 *
 * Existe por dois motivos: um gráfico não é acessível por si só — quem usa
 * leitor de tela ou precisa do número exato tem de conseguir chegar nele — e
 * porque planejador confere valor, não desenha tendência. Fica recolhida para
 * não competir com o gráfico, mas nunca ausente.
 */
export function TabelaProjecao({
  rotulo,
  colunas,
  linhas,
}: {
  rotulo: string;
  colunas: string[];
  linhas: LinhaProjecao[];
}) {
  const [aberta, setAberta] = useState(false);

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        className="inline-flex items-center gap-1.5 font-inter text-sm text-slate-500 hover:text-brand-600 transition-colors cursor-pointer"
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${aberta ? "rotate-180" : ""}`}
        />
        {aberta ? "Ocultar" : "Ver"} os números {rotulo} a {rotulo}
      </button>

      {aberta && (
        <div className="overflow-x-auto mt-4 -mx-6 px-6">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">
              Projeção {rotulo} a {rotulo}
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="text-left font-inter text-xs uppercase tracking-wide text-slate-400 font-medium pb-2"
                >
                  {rotulo}
                </th>
                {colunas.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className="text-right font-inter text-xs uppercase tracking-wide text-slate-400 font-medium pb-2"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.chave} className="border-t border-slate-100">
                  <th
                    scope="row"
                    className="py-2 text-left font-inter font-normal text-slate-700 whitespace-nowrap"
                  >
                    {l.rotulo}
                    {l.marco && (
                      <span className="ml-2 font-inter text-xs text-slate-400">
                        {l.marco}
                      </span>
                    )}
                  </th>
                  {l.valores.map((v, i) => (
                    <td
                      key={i}
                      className={`py-2 text-right tabular-nums font-inter whitespace-nowrap ${
                        v < 0 ? "text-red-700" : "text-slate-600"
                      }`}
                    >
                      {v === 0 ? "—" : formatCurrency(v, 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
