"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Compass, Users, Wallet } from "lucide-react";
import { Select } from "@/components/ui/Select";

/**
 * Filtro por serviço contratado.
 *
 * O valor vive na URL, como o da busca — os dois se compõem em vez de um
 * derrubar o outro, e um recorte da carteira ("só os de investimento") é
 * compartilhável por link.
 */
export function ClientServiceFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [pendente, startTransition] = useTransition();

  function mudar(valor: string) {
    const próximos = new URLSearchParams(params);
    if (valor && valor !== "todos") próximos.set("servico", valor);
    else próximos.delete("servico");
    startTransition(() => router.replace(`/clientes?${próximos}`));
  }

  return (
    <Select
      aria-label="Filtrar por serviço"
      value={params.get("servico") ?? "todos"}
      onChange={mudar}
      disabled={pendente}
      className="w-56"
      opcoes={[
        {
          valor: "todos",
          rotulo: "Todos os serviços",
          descricao: "A carteira inteira",
          icone: Users,
        },
        {
          valor: "planejamento",
          rotulo: "Planejamento",
          descricao: "Inclui quem tem os dois",
          icone: Compass,
        },
        {
          valor: "investimento",
          rotulo: "Investimento",
          descricao: "Inclui quem tem os dois",
          icone: Wallet,
        },
      ]}
    />
  );
}
