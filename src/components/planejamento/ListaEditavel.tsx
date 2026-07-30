"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2, X, Loader2 } from "lucide-react";
import { ENTIDADES, camposVisiveis } from "@/lib/forms/planejamento";
import { salvarLinha, removerLinha, type Estado } from "@/lib/actions/planejamento";
import { CampoForm, type OpcoesRef } from "./CampoForm";

export interface LinhaDados {
  id: string;
  /** O que a lista mostra quando não está editando. */
  titulo: string;
  detalhe?: string;
  valor: string;
  /** Valores crus, na forma que o formulário espera. */
  bruto: Record<string, unknown>;
  alerta?: string;
}

/**
 * Lista de registros com edição em diálogo.
 *
 * Diálogo e não edição embutida na tabela: as entidades daqui têm de cinco a
 * sete campos com dependência entre eles (mês de ocorrência só existe se a
 * frequência for anual), e isso não cabe numa linha de tabela sem virar um
 * quebra-cabeça de layout.
 */
export interface Vinculo {
  planId?: string | null;
  clientId?: string;
  recordId?: string;
  reportId?: string;
}

export function ListaEditavel({
  entidade,
  linhas,
  planId,
  clientId,
  recordId,
  reportId,
  opcoesRef,
  vazio,
  extra,
  somenteLeitura = false,
  comScroll = false,
}: Vinculo & {
  entidade: string;
  linhas: LinhaDados[];
  clientId: string;
  opcoesRef?: OpcoesRef;
  vazio?: string;
  extra?: React.ReactNode;
  /** Um mês publicado não se edita mais sem reabrir o relatório. */
  somenteLeitura?: boolean;
  /** Lista longa rola dentro do próprio cartão em vez de esticar a página. */
  comScroll?: boolean;
}) {
  const def = ENTIDADES[entidade];
  const [aberto, setAberto] = useState<LinhaDados | "novo" | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const precisaPlano = def.escopo === "plano" && !planId;
  const bloqueado = precisaPlano || somenteLeitura;

  async function remover(id: string) {
    setRemovendo(id);
    const form = new FormData();
    form.set("__entidade", entidade);
    form.set("__id", id);
    const r = await removerLinha(form);
    setRemovendo(null);
    setConfirmando(null);
    if (r?.erro) setErroGeral(r.erro);
  }

  return (
    <>
      {erroGeral && (
        <p className="mb-3 font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {erroGeral}
        </p>
      )}

      {linhas.length === 0 ? (
        <p className="font-inter text-sm text-slate-500 py-2">
          {vazio ?? `Nenhum registro em ${def.plural.toLowerCase()}.`}
        </p>
      ) : (
        <ul
          className={`flex flex-col ${
            comScroll ? "max-h-96 overflow-y-auto pr-1" : ""
          }`}
        >
          {linhas.map((l) => (
            <li
              key={l.id}
              className="group flex items-baseline justify-between gap-3 py-2.5 border-b border-slate-50 last:border-none"
            >
              <div className="min-w-0">
                <p className="font-inter text-sm font-medium text-slate-700 truncate">
                  {l.titulo}
                </p>
                {l.detalhe && (
                  <p className="font-inter text-xs text-slate-500 mt-0.5">{l.detalhe}</p>
                )}
                {l.alerta && (
                  <p className="font-inter text-xs text-amber-600 mt-0.5">{l.alerta}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="font-inter text-sm text-slate-600 tabular-nums mr-1">
                  {l.valor}
                </span>

                {somenteLeitura ? null : confirmando === l.id ? (
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => remover(l.id)}
                      disabled={removendo === l.id}
                      className="font-inter text-xs px-2 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {removendo === l.id ? "Removendo…" : "Confirmar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmando(null)}
                      className="font-inter text-xs px-2 py-1 rounded-md text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setAberto(l)}
                      aria-label={`Editar ${l.titulo}`}
                      className="p-1.5 rounded-md text-slate-300 hover:text-brand-600 hover:bg-slate-100 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmando(l.id)}
                      aria-label={`Remover ${l.titulo}`}
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

      {extra}

      {!somenteLeitura && (
      <button
        type="button"
        onClick={() => setAberto("novo")}
        disabled={bloqueado}
        title={precisaPlano ? "Crie o plano antes, em Cadastro." : undefined}
        className="mt-4 inline-flex items-center gap-1.5 font-inter text-sm text-brand-600 hover:text-brand-900 transition-colors cursor-pointer disabled:text-slate-300 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
        Adicionar {def.singular.toLowerCase()}
      </button>
      )}

      {aberto && (
        <Dialogo
          entidade={entidade}
          linha={aberto === "novo" ? null : aberto}
          planId={planId}
          clientId={clientId}
          recordId={recordId}
          reportId={reportId}
          opcoesRef={opcoesRef}
          onFechar={() => setAberto(null)}
        />
      )}
    </>
  );
}

function Dialogo({
  entidade,
  linha,
  planId,
  clientId,
  recordId,
  reportId,
  opcoesRef,
  onFechar,
}: Vinculo & {
  entidade: string;
  linha: LinhaDados | null;
  clientId: string;
  opcoesRef?: OpcoesRef;
  onFechar: () => void;
}) {
  const def = ENTIDADES[entidade];
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    salvarLinha,
    undefined,
  );

  // Espelha os campos que controlam visibilidade, para o formulário reagir
  // enquanto se digita — o servidor reavalia a mesma regra ao gravar.
  const [controles, setControles] = useState<Record<string, string>>(() => {
    const inicial: Record<string, string> = {};
    for (const c of def.campos) {
      if (c.visivelSe) inicial[c.visivelSe.campo] = String(linha?.bruto[c.visivelSe.campo] ?? "");
    }
    return inicial;
  });

  const visiveis = camposVisiveis(def, { ...linha?.bruto, ...controles });
  const fecharRef = useRef<HTMLButtonElement>(null);

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
        aria-label={`${linha ? "Editar" : "Adicionar"} ${def.singular.toLowerCase()}`}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-poppins font-medium text-lg text-brand-950">
            {linha ? `Editar ${def.singular.toLowerCase()}` : `Nova ${def.singular.toLowerCase()}`}
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
          <input type="hidden" name="__entidade" value={entidade} />
          <input type="hidden" name="__id" value={linha?.id ?? ""} />
          <input type="hidden" name="__planId" value={planId ?? ""} />
          <input type="hidden" name="__clientId" value={clientId} />
          <input type="hidden" name="__recordId" value={recordId ?? ""} />
          <input type="hidden" name="__reportId" value={reportId ?? ""} />

          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visiveis.map((campo) => (
              <CampoForm
                key={campo.key}
                campo={campo}
                valor={linha?.bruto[campo.key]}
                opcoes={opcoesRef}
                onChange={
                  def.campos.some((o) => o.visivelSe?.campo === campo.key)
                    ? (v) => setControles((c) => ({ ...c, [campo.key]: v }))
                    : undefined
                }
              />
            ))}
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
