"use client";

import { useRouter, useSearchParams } from "next/navigation";

const base =
  "px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 " +
  "font-inter focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent " +
  "cursor-pointer";

/**
 * Filtros por planejador e por cliente, vividos na URL — como a busca de
 * clientes. Poucas opções, sem descrição por item: o `<select>` nativo já
 * dá o essencial de graça, sem o custo de reimplementar o próprio.
 */
export function FiltroAgenda({
  planejadores,
  clientes,
}: {
  planejadores: { id: string; nome: string }[];
  clientes: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function definir(chave: string, valor: string) {
    const próximos = new URLSearchParams(params);
    if (valor) próximos.set(chave, valor);
    else próximos.delete(chave);
    router.replace(`/agenda?${próximos}`);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Filtrar por planejador"
        value={params.get("planejador") ?? ""}
        onChange={(e) => definir("planejador", e.target.value)}
        className={base}
      >
        <option value="">Todos os planejadores</option>
        {planejadores.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por cliente"
        value={params.get("cliente") ?? ""}
        onChange={(e) => definir("cliente", e.target.value)}
        className={base}
      >
        <option value="">Todos os clientes</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
