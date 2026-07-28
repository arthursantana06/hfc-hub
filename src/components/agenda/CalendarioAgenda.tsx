"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { gradeDoMes, hojeISO, MESES_PT, somarMeses } from "@/lib/calendario";
import { ModalReuniao } from "./ModalReuniao";
import type { Meeting } from "@/lib/agenda-dal";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const FORMATO_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

/** Chave `YYYY-MM-DD` no fuso de São Paulo — não a data UTC crua do banco. */
function chaveDia(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

type Selecao = { tipo: "editar"; reuniao: Meeting } | { tipo: "nova"; data: string } | null;

/**
 * Calendário mensal, ocupando o corpo inteiro da aba — não uma lista.
 *
 * Cada dia é uma célula da grade; reuniões aparecem como chips dentro dela.
 * Clicar no vazio de um dia abre "nova reunião" já com a data preenchida;
 * clicar num chip abre a edição daquela reunião.
 */
export function CalendarioAgenda({
  reunioes,
  clientes,
  planejadores,
  usuarioAtualId,
}: {
  reunioes: Meeting[];
  clientes: { id: string; nome: string }[];
  planejadores: { id: string; nome: string }[];
  usuarioAtualId: string;
}) {
  // `useState` congela o dia de hoje no primeiro render — mesma razão do
  // `ListaReunioes` anterior: `Date` chamada direto violaria a regra de
  // pureza dos hooks, e o valor não precisa mudar entre renders.
  const [hoje] = useState(() => hojeISO());
  const [cursor, setCursor] = useState(() => `${hoje.slice(0, 7)}-01`);
  const [selecao, setSelecao] = useState<Selecao>(null);

  const grade = useMemo(() => gradeDoMes(cursor), [cursor]);

  const porDia = useMemo(() => {
    const mapa = new Map<string, Meeting[]>();
    for (const r of reunioes) {
      const chave = chaveDia(r.quando);
      const lista = mapa.get(chave) ?? [];
      lista.push(r);
      mapa.set(chave, lista);
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.quando.localeCompare(b.quando));
    return mapa;
  }, [reunioes]);

  const [ano, mes] = cursor.slice(0, 7).split("-").map(Number);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor((c) => somarMeses(c, -1))}
            aria-label="Mês anterior"
            className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-poppins font-medium text-lg text-brand-950 min-w-[11rem] text-center">
            {MESES_PT[mes - 1]} de {ano}
          </h2>
          <button
            type="button"
            onClick={() => setCursor((c) => somarMeses(c, 1))}
            aria-label="Próximo mês"
            className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(`${hoje.slice(0, 7)}-01`)}
            className="ml-2 font-inter text-sm text-brand-600 hover:text-brand-900 transition-colors cursor-pointer"
          >
            Hoje
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSelecao({ tipo: "nova", data: hoje })}
          className="bg-brand-600 hover:bg-brand-900 transition-colors text-white font-poppins font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Reunião
        </button>
      </div>

      <div className="grid grid-cols-7 grid-rows-[auto_repeat(6,minmax(6.5rem,1fr))] flex-1 min-h-0 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="bg-slate-50 py-2 text-center font-inter text-[11px] font-semibold uppercase tracking-wide text-slate-500"
          >
            {d}
          </div>
        ))}

        {grade.map((celula) => {
          const reunioesDoDia = porDia.get(celula.data) ?? [];
          const éHoje = celula.data === hoje;

          return (
            <div
              key={celula.data}
              role="button"
              tabIndex={0}
              onClick={() => setSelecao({ tipo: "nova", data: celula.data })}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                setSelecao({ tipo: "nova", data: celula.data });
              }}
              className={`flex flex-col items-stretch min-h-0 p-1.5 text-left overflow-y-auto cursor-pointer transition-colors ${
                celula.noMes ? "bg-white hover:bg-slate-50" : "bg-slate-50/60 hover:bg-slate-100/60"
              }`}
            >
              <span
                className={`shrink-0 font-inter text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  éHoje
                    ? "bg-brand-600 text-white font-semibold"
                    : celula.noMes
                      ? "text-slate-600 font-medium"
                      : "text-slate-300"
                }`}
              >
                {Number(celula.data.slice(8, 10))}
              </span>

              <div className="flex flex-col gap-0.5">
                {reunioesDoDia.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelecao({ tipo: "editar", reuniao: r });
                    }}
                    className="text-left font-inter text-[11px] leading-tight px-1.5 py-1 rounded-md bg-brand-300/20 text-brand-900 hover:bg-brand-300/35 transition-colors truncate cursor-pointer"
                    title={`${FORMATO_HORA.format(new Date(r.quando))} · ${r.clienteNome ?? "Reunião interna"}`}
                  >
                    {FORMATO_HORA.format(new Date(r.quando))} {r.clienteNome ?? "Interna"}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selecao && (
        <ModalReuniao
          reuniao={selecao.tipo === "editar" ? selecao.reuniao : null}
          dataInicial={selecao.tipo === "nova" ? selecao.data : undefined}
          clientes={clientes}
          planejadores={planejadores}
          usuarioAtualId={usuarioAtualId}
          onFechar={() => setSelecao(null)}
        />
      )}
    </div>
  );
}
