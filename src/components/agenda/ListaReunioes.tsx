"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CalendarDays, Loader2, Pencil, Trash2, User, X } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { salvarReuniao, removerReuniao, type Estado } from "@/lib/actions/agenda";
import type { Meeting } from "@/lib/agenda-dal";

const base =
  "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 " +
  "placeholder-slate-400 font-inter focus:outline-none focus:ring-2 focus:ring-brand-300 " +
  "focus:border-transparent transition-shadow";

// Dois formatadores, não um só recortado por `split(" ")": a ordem das partes
// numa string localizada não é garantia estável para depender, e "qua.," traz
// pontuação embutida que teria de ser removida às cegas.
const FORMATO_DIA_SEMANA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "short",
});
const FORMATO_DIA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
});
const FORMATO_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

export function ListaReunioes({
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
  const [aberta, setAberta] = useState<Meeting | "nova" | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  // `useState` congela o instante no primeiro render — chamar `Date.now()`
  // direto violaria a regra de pureza dos hooks (o resultado mudaria a cada
  // render) sem ganhar nada: a lista já se atualiza sozinha após qualquer
  // gravação, via `revalidatePath`.
  const [agora] = useState(() => Date.now());
  const proximas = reunioes
    .filter((r) => new Date(r.quando).getTime() >= agora)
    .sort((a, b) => a.quando.localeCompare(b.quando));
  const anteriores = reunioes
    .filter((r) => new Date(r.quando).getTime() < agora)
    .sort((a, b) => b.quando.localeCompare(a.quando));

  async function remover(id: string) {
    setRemovendo(id);
    const form = new FormData();
    form.set("__id", id);
    const r = await removerReuniao(form);
    setRemovendo(null);
    setConfirmando(null);
    if (r?.erro) setErroGeral(r.erro);
  }

  return (
    <div className="flex flex-col gap-8">
      {erroGeral && (
        <p className="font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {erroGeral}
        </p>
      )}

      <button
        type="button"
        onClick={() => setAberta("nova")}
        className="self-start bg-brand-600 hover:bg-brand-900 transition-colors text-white font-poppins font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
      >
        <CalendarDays className="w-4 h-4" />
        Nova Reunião
      </button>

      <Secao
        titulo="Próximas"
        reunioes={proximas}
        vazio="Nenhuma reunião agendada."
        confirmando={confirmando}
        removendo={removendo}
        onEditar={setAberta}
        onConfirmar={setConfirmando}
        onCancelar={() => setConfirmando(null)}
        onRemover={remover}
      />

      {anteriores.length > 0 && (
        <Secao
          titulo="Anteriores"
          reunioes={anteriores}
          confirmando={confirmando}
          removendo={removendo}
          onEditar={setAberta}
          onConfirmar={setConfirmando}
          onCancelar={() => setConfirmando(null)}
          onRemover={remover}
          esmaecida
        />
      )}

      {aberta && (
        <ModalReuniao
          reuniao={aberta === "nova" ? null : aberta}
          clientes={clientes}
          planejadores={planejadores}
          usuarioAtualId={usuarioAtualId}
          onFechar={() => setAberta(null)}
        />
      )}
    </div>
  );
}

function Secao({
  titulo,
  reunioes,
  vazio,
  esmaecida,
  confirmando,
  removendo,
  onEditar,
  onConfirmar,
  onCancelar,
  onRemover,
}: {
  titulo: string;
  reunioes: Meeting[];
  vazio?: string;
  esmaecida?: boolean;
  confirmando: string | null;
  removendo: string | null;
  onEditar: (r: Meeting) => void;
  onConfirmar: (id: string) => void;
  onCancelar: () => void;
  onRemover: (id: string) => void;
}) {
  if (reunioes.length === 0 && !vazio) return null;

  return (
    <section>
      <h2 className="font-poppins font-medium text-sm text-slate-500 uppercase tracking-wide mb-3">
        {titulo}
      </h2>

      {reunioes.length === 0 ? (
        <p className="font-inter text-sm text-slate-500">{vazio}</p>
      ) : (
        <ul className={`flex flex-col ${esmaecida ? "opacity-70" : ""}`}>
          {reunioes.map((r) => (
            <li
              key={r.id}
              className="group flex items-center justify-between gap-4 py-3.5 border-b border-slate-100 last:border-none"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-brand-300/10 text-brand-600 shrink-0">
                  <span className="font-inter text-[10px] uppercase font-medium leading-none">
                    {FORMATO_DIA_SEMANA.format(new Date(r.quando)).replace(".", "")}
                  </span>
                  <span className="font-poppins text-sm font-semibold leading-tight mt-0.5">
                    {FORMATO_DIA.format(new Date(r.quando))}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="font-inter text-sm font-medium text-slate-700 truncate">
                    {r.clienteNome ?? "Reunião interna"}
                  </p>
                  <p className="font-inter text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    {FORMATO_HORA.format(new Date(r.quando))}
                    {r.plannerNome && (
                      <>
                        <User className="w-3 h-3" />
                        {r.plannerNome}
                      </>
                    )}
                  </p>
                  {r.notas && (
                    <p className="font-inter text-xs text-slate-400 mt-1 truncate max-w-md">
                      {r.notas}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {confirmando === r.id ? (
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onRemover(r.id)}
                      disabled={removendo === r.id}
                      className="font-inter text-xs px-2 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {removendo === r.id ? "Removendo…" : "Confirmar"}
                    </button>
                    <button
                      type="button"
                      onClick={onCancelar}
                      className="font-inter text-xs px-2 py-1 rounded-md text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onEditar(r)}
                      aria-label="Editar reunião"
                      className="p-1.5 rounded-md text-slate-300 hover:text-brand-600 hover:bg-slate-100 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onConfirmar(r.id)}
                      aria-label="Remover reunião"
                      className="p-1.5 rounded-md text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** `Date` local, em `YYYY-MM-DD`/`HH:mm` no fuso de São Paulo, para preencher o formulário. */
function paraDataHoraLocal(iso: string): { data: string; hora: string } {
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

function ModalReuniao({
  reuniao,
  clientes,
  planejadores,
  usuarioAtualId,
  onFechar,
}: {
  reuniao: Meeting | null;
  clientes: { id: string; nome: string }[];
  planejadores: { id: string; nome: string }[];
  usuarioAtualId: string;
  onFechar: () => void;
}) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    salvarReuniao,
    undefined,
  );
  const fecharRef = useRef<HTMLButtonElement>(null);

  const { data, hora } = reuniao
    ? paraDataHoraLocal(reuniao.quando)
    : { data: "", hora: "" };

  useEffect(() => {
    if (estado?.ok) onFechar();
  }, [estado, onFechar]);

  useEffect(() => {
    fecharRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

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
              <select
                name="cliente_id"
                defaultValue={reuniao?.clienteId ?? ""}
                className={`${base} cursor-pointer`}
              >
                <option value="">Reunião interna (sem cliente)</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Planejador" span2>
              <select
                name="planner_id"
                defaultValue={reuniao?.plannerId ?? usuarioAtualId}
                className={`${base} cursor-pointer`}
              >
                {planejadores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
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

          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
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
