"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus, History, Loader2, X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { MesPicker } from "@/components/ui/MesPicker";
import { abrirPeriodo, type Estado } from "@/lib/actions/planejamento";

export interface Periodo {
  id: string;
  versao: number;
  inicio: string;
  status: "rascunho" | "ativo" | "arquivado";
}

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

const rotulo = (iso: string) =>
  `${MESES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(0, 4)}`;

/**
 * O filtro de período do espaço de trabalho.
 *
 * Cada opção é uma versão do plano — um retrato tirado numa reunião. A versão 1
 * é o Ponto de Partida, e é por isso que ela ganha esse nome na lista: não é
 * uma tela especial, é só o primeiro mês.
 *
 * Trocar de período mexe na URL (`?periodo=…`) e não em estado local: o
 * planejador precisa poder mandar o link do trimestre passado para alguém.
 */
export function SeletorPeriodo({
  clientId,
  periodos,
}: {
  clientId: string;
  periodos: Periodo[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [abrindo, setAbrindo] = useState(false);

  const corrente = periodos.find((p) => p.status === "ativo");
  // O período vem da URL — e não de estado local — porque este componente vive
  // no layout, que não recebe `searchParams` do Next. A URL é a única fonte que
  // os dois lados enxergam.
  const pedido = params.get("periodo");
  const atual = periodos.some((p) => p.id === pedido) ? pedido : (corrente?.id ?? null);
  const emPeriodoAntigo = atual !== null && corrente !== undefined && atual !== corrente.id;

  function irPara(planId: string) {
    const busca = new URLSearchParams(params);
    // O período corrente não precisa de parâmetro: a URL limpa é a de hoje.
    if (planId === corrente?.id) busca.delete("periodo");
    else busca.set("periodo", planId);

    const query = busca.toString();
    router.push(query ? `?${query}` : "?", { scroll: false });
  }

  if (periodos.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {emPeriodoAntigo && (
        <span
          className="hidden lg:inline-flex items-center gap-1.5 font-inter text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1"
          title="Este período já foi fechado. Abra o corrente para editar."
        >
          <History className="w-3.5 h-3.5" />
          Período anterior
        </span>
      )}

      <Select
        aria-label="Período do planejamento"
        tamanho="sm"
        className="w-52"
        value={atual ?? corrente?.id ?? ""}
        onChange={irPara}
        opcoes={periodos.map((p) => ({
          valor: p.id,
          rotulo: rotulo(p.inicio),
          descricao:
            p.versao === 1
              ? "Ponto de partida"
              : p.status === "ativo"
                ? "Período corrente"
                : `Versão ${p.versao}`,
        }))}
      />

      <button
        type="button"
        onClick={() => setAbrindo(true)}
        className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-900 transition-colors text-white font-poppins font-medium text-sm px-3 py-2 rounded-lg shadow-sm cursor-pointer shrink-0"
      >
        <CalendarPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Novo período</span>
      </button>

      {abrindo && (
        <DialogoNovoPeriodo
          clientId={clientId}
          proximo={corrente?.inicio ?? null}
          onFechar={() => setAbrindo(false)}
        />
      )}
    </div>
  );
}

function DialogoNovoPeriodo({
  clientId,
  proximo,
  onFechar,
}: {
  clientId: string;
  proximo: string | null;
  onFechar: () => void;
}) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    abrirPeriodo,
    undefined,
  );

  useEffect(() => {
    if (estado?.ok) onFechar();
  }, [estado, onFechar]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Abrir novo período"
        className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-poppins font-medium text-lg text-brand-950">
            Abrir novo período
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="p-2 text-slate-400 hover:text-brand-950 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={acao}>
          <input type="hidden" name="__clientId" value={clientId} />

          <div className="px-6 py-5 flex flex-col gap-4">
            <p className="font-inter text-sm text-slate-600">
              O período novo nasce como cópia fiel do atual
              {proximo ? ` (${rotulo(proximo)})` : ""} — receitas, custos,
              dívidas, patrimônio, objetivos e mudanças. Você mexe só no que
              mudou enquanto conversa com o cliente, e o período anterior fica
              guardado como estava.
            </p>

            <div>
              <label className="block font-inter text-xs font-medium text-slate-600 mb-1.5">
                Mês do novo período
              </label>
              <MesPicker name="mes" />
              <p className="font-inter text-xs text-slate-400 mt-1">
                Em branco, seguimos a cadência do plano.
              </p>
            </div>
          </div>

          {estado?.erro && (
            <p className="mx-6 mb-4 font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {estado.erro}
            </p>
          )}

          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 font-inter text-sm text-slate-600 hover:text-brand-950 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pendente}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-900 text-white font-poppins font-medium text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {pendente && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {pendente ? "Abrindo…" : "Abrir período"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
