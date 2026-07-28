"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import type { Pessoa } from "@/lib/agenda-dal";

const TAG_TIPO: Record<"admin" | "planner" | "cliente", string> = {
  admin: "Admin",
  planner: "Planejador",
  cliente: "Cliente",
};

/** Filtros por pessoa (qualquer participante) e por cliente — vividos na URL. */
export function FiltroAgenda({
  pessoas,
  clientes,
}: {
  pessoas: Pessoa[];
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
        aria-label="Filtrar por pessoa"
        value={params.get("pessoa") ?? ""}
        onChange={(v) => definir("pessoa", v)}
        placeholder="Todas as pessoas"
        className="w-56"
        opcoes={[
          { valor: "", rotulo: "Todas as pessoas" },
          ...pessoas.map((p) => ({
            valor: p.id,
            rotulo: p.nome,
            descricao: TAG_TIPO[p.tipo === "staff" ? (p.role ?? "planner") : "cliente"],
          })),
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
