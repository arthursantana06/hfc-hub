"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import type { Pessoa } from "@/lib/agenda-dal";

const TAG_TIPO: Record<"admin" | "planner", string> = {
  admin: "Admin",
  planner: "Planejador",
};

/**
 * Filtros por colaborador (staff — admin/planejador) e por cliente, vividos
 * na URL. Clientes já têm o próprio filtro; misturá-los aqui de novo seria
 * redundante e confundia "quem participou" com "de quem é a reunião".
 */
export function FiltroAgenda({
  pessoas,
  clientes,
}: {
  pessoas: Pessoa[];
  clientes: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const colaboradores = pessoas.filter((p) => p.tipo === "staff");

  function definir(chave: string, valor: string) {
    const próximos = new URLSearchParams(params);
    if (valor) próximos.set(chave, valor);
    else próximos.delete(chave);
    router.replace(`/agenda?${próximos}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        aria-label="Filtrar por colaborador"
        value={params.get("colaborador") ?? ""}
        onChange={(v) => definir("colaborador", v)}
        placeholder="Todos os colaboradores"
        className="w-56"
        opcoes={[
          { valor: "", rotulo: "Todos os colaboradores" },
          ...colaboradores.map((p) => ({
            valor: p.id,
            rotulo: p.nome,
            descricao: TAG_TIPO[p.role ?? "planner"],
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
