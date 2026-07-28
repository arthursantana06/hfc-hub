"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";

/** Filtros por planejador e por cliente, vividos na URL — como a busca de clientes. */
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
      <Select
        aria-label="Filtrar por planejador"
        value={params.get("planejador") ?? ""}
        onChange={(v) => definir("planejador", v)}
        placeholder="Todos os planejadores"
        className="w-52"
        opcoes={[
          { valor: "", rotulo: "Todos os planejadores" },
          ...planejadores.map((p) => ({ valor: p.id, rotulo: p.nome })),
        ]}
      />

      <Select
        aria-label="Filtrar por cliente"
        value={params.get("cliente") ?? ""}
        onChange={(v) => definir("cliente", v)}
        placeholder="Todos os clientes"
        className="w-52"
        opcoes={[
          { valor: "", rotulo: "Todos os clientes" },
          ...clientes.map((c) => ({ valor: c.id, rotulo: c.nome })),
        ]}
      />
    </div>
  );
}
