"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { salvarReuniao, removerReuniao, type Estado } from "@/lib/actions/agenda";
import type { Meeting } from "@/lib/agenda-dal";

const base =
  "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 " +
  "placeholder-slate-400 font-inter focus:outline-none focus:ring-2 focus:ring-brand-300 " +
  "focus:border-transparent transition-shadow";

/** `Date` local, em `YYYY-MM-DD`/`HH:mm` no fuso de São Paulo, para preencher o formulário. */
export function paraDataHoraLocal(iso: string): { data: string; hora: string } {
  const d = new Date(iso);
  // "sv-SE" formata datas como AAAA-MM-DD por convenção da localidade — o
  // jeito mais curto de obter o formato ISO sem montar a string na mão.
  const data = d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const hora = d.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { data, hora };
}

export function ModalReuniao({
  reuniao,
  dataInicial,
  clientes,
  planejadores,
  usuarioAtualId,
  onFechar,
}: {
  /** `null` = nova reunião. */
  reuniao: Meeting | null;
  /** Data (`YYYY-MM-DD`) sugerida ao criar — o dia clicado no calendário. */
  dataInicial?: string;
  clientes: { id: string; nome: string }[];
  planejadores: { id: string; nome: string }[];
  usuarioAtualId: string;
  onFechar: () => void;
}) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    salvarReuniao,
    undefined,
  );
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [erroRemocao, setErroRemocao] = useState<string | null>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);

  const { data, hora } = reuniao
    ? paraDataHoraLocal(reuniao.quando)
    : { data: dataInicial ?? "", hora: "" };

  useEffect(() => {
    if (estado?.ok) onFechar();
  }, [estado, onFechar]);

  useEffect(() => {
    fecharRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  async function remover() {
    if (!reuniao) return;
    setRemovendo(true);
    const form = new FormData();
    form.set("__id", reuniao.id);
    const r = await removerReuniao(form);
    setRemovendo(false);
    if (r?.erro) setErroRemocao(r.erro);
    else onFechar();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={reuniao ? "Editar reunião" : "Nova reunião"}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-poppins font-medium text-lg text-brand-950">
            {reuniao ? "Editar reunião" : "Nova reunião"}
          </h2>
          <button
            ref={fecharRef}
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="p-2 text-slate-400 hover:text-brand-950 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={acao} className="flex-1 overflow-y-auto">
          <input type="hidden" name="__id" value={reuniao?.id ?? ""} />

          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Data">
              <DatePicker name="data" defaultValue={data} required />
            </Campo>

            <Campo label="Horário">
              <input
                name="hora"
                type="time"
                required
                defaultValue={hora}
                className={base}
              />
            </Campo>

            <Campo label="Cliente" span2 ajuda="Deixe em branco para uma reunião interna.">
              <Select
                name="cliente_id"
                defaultValue={reuniao?.clienteId ?? ""}
                placeholder="Reunião interna (sem cliente)"
                opcoes={[
                  { valor: "", rotulo: "Reunião interna (sem cliente)" },
                  ...clientes.map((c) => ({ valor: c.id, rotulo: c.nome })),
                ]}
              />
            </Campo>

            <Campo label="Planejador" span2>
              <Select
                name="planner_id"
                defaultValue={reuniao?.plannerId ?? usuarioAtualId}
                opcoes={planejadores.map((p) => ({ valor: p.id, rotulo: p.nome }))}
              />
            </Campo>

            <Campo label="Notas" span2>
              <textarea
                name="notas"
                rows={3}
                defaultValue={reuniao?.notas ?? ""}
                placeholder="Pauta, contexto ou combinados da reunião…"
                className={`${base} resize-y`}
              />
            </Campo>
          </div>

          {estado?.erro && (
            <p className="mx-6 mb-4 font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {estado.erro}
            </p>
          )}
          {erroRemocao && (
            <p className="mx-6 mb-4 font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {erroRemocao}
            </p>
          )}

          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50 shrink-0">
            {reuniao ? (
              confirmandoRemocao ? (
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={remover}
                    disabled={removendo}
                    className="font-inter text-xs px-2.5 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {removendo ? "Removendo…" : "Confirmar remoção"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoRemocao(false)}
                    className="font-inter text-xs px-2.5 py-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmandoRemocao(true)}
                  className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  aria-label="Remover reunião"
                  title="Remover reunião"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            ) : (
              <span />
            )}

            <div className="flex items-center gap-3">
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
                {pendente ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Campo({
  label,
  ajuda,
  span2,
  children,
}: {
  label: string;
  ajuda?: string;
  span2?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="block font-inter text-xs font-medium text-slate-600 mb-1.5">
        {label}
      </label>
      {children}
      {ajuda && <p className="font-inter text-xs text-slate-400 mt-1">{ajuda}</p>}
    </div>
  );
}
