"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { TabLink } from "@/components/layout/TabLink";
import { SeletorPeriodo, type Periodo } from "@/components/planejamento/SeletorPeriodo";

/**
 * As duas linhas de navegação do Planejamento.
 *
 * Linha 1: qual dos três planejamentos está aberto (Pré-HFC, HFC, Real).
 * Linha 2: as oito seções do planejamento corrente.
 *
 * É um componente client — e não parte do layout servidor — porque as duas
 * linhas dependem do pathname (que layout não recebe) e a query precisa
 * sobreviver à troca de aba: era exatamente aqui que o `?periodo=` se perdia
 * no desenho antigo.
 */

export const TIPOS = [
  { slug: "pre-hfc", rotulo: "Pré-HFC" },
  { slug: "hfc", rotulo: "HFC" },
  { slug: "real", rotulo: "Real" },
] as const;

export const SECOES = [
  { slug: "receita", rotulo: "Receita" },
  { slug: "despesa", rotulo: "Despesa" },
  { slug: "cartao", rotulo: "Cartão" },
  { slug: "ativos", rotulo: "Ativos" },
  { slug: "passivos", rotulo: "Passivos" },
  { slug: "investimentos", rotulo: "Investimentos" },
  { slug: "objetivos", rotulo: "Objetivos e Mudanças" },
  { slug: "projecao", rotulo: "Projeção" },
] as const;

export function AbasPlanejamento({
  clienteId,
  periodos,
}: {
  clienteId: string;
  periodos: Periodo[];
}) {
  const pathname = usePathname();
  const params = useSearchParams();

  const base = `/clientes/${clienteId}/planejamento`;
  const resto = pathname.startsWith(base)
    ? pathname.slice(base.length).split("/").filter(Boolean)
    : [];

  const tipoAtual = TIPOS.find((t) => t.slug === resto[0])?.slug ?? "hfc";
  const secaoAtual = SECOES.find((s) => s.slug === resto[1])?.slug ?? "receita";

  // Só o Real entende `?periodo=` — carregá-lo para o HFC faria um link
  // compartilhado abrir o retrato errado sem nenhum aviso na tela.
  function query(tipo: string): string {
    const busca = new URLSearchParams(params);
    if (tipo !== "real") busca.delete("periodo");
    const q = busca.toString();
    return q ? `?${q}` : "";
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-end justify-between gap-6">
        <div className="flex gap-8 overflow-x-auto">
          {TIPOS.map((t) => (
            <TabLink
              key={t.slug}
              prefixo
              href={`${base}/${t.slug}/${secaoAtual}${query(t.slug)}`}
              label={t.rotulo}
            />
          ))}
        </div>

        {tipoAtual === "real" && (
          <div className="pb-2">
            <SeletorPeriodo clientId={clienteId} periodos={periodos} />
          </div>
        )}
      </div>

      <div className="flex gap-6 overflow-x-auto border-t border-slate-100 pt-3 mt-1">
        {SECOES.map((s) => (
          <TabLink
            key={s.slug}
            href={`${base}/${tipoAtual}/${s.slug}${query(tipoAtual)}`}
            label={s.rotulo}
          />
        ))}
      </div>
    </div>
  );
}
