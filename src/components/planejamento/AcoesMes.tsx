"use client";

import { useActionState, useState } from "react";
import { Loader2, Lock, LockOpen, Snowflake } from "lucide-react";
import {
  abrirMes,
  congelarMetas,
  publicarRelatorio,
  reabrirRelatorio,
  salvarObservacaoDoMes,
  type Estado,
} from "@/lib/actions/planejamento";

const botao =
  "px-4 py-2 bg-brand-600 hover:bg-brand-900 text-white font-poppins font-medium text-sm " +
  "rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2";

function Aviso({ estado }: { estado: Estado }) {
  if (estado?.erro) {
    return (
      <p className="font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        {estado.erro}
      </p>
    );
  }
  if (estado?.ok) {
    return (
      <p className="font-inter text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
        {estado.ok}
      </p>
    );
  }
  return null;
}

/** Congela a projeção atual como as metas do plano. */
export function BotaoCongelarMetas({
  clientId,
  jaCongelado,
}: {
  clientId: string;
  jaCongelado: boolean;
}) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    congelarMetas,
    undefined,
  );
  const [confirmando, setConfirmando] = useState(false);

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="__clientId" value={clientId} />

      {jaCongelado && confirmando ? (
        <div className="flex flex-col gap-2">
          <p className="font-inter text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Recongelar substitui as metas atuais. Os meses já fechados passam a
            ser lidos contra um alvo diferente do que estava valendo quando
            foram publicados.
          </p>
          <div className="flex gap-3">
            <button type="submit" disabled={pendente} className={botao}>
              {pendente && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Recongelar mesmo assim
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="px-4 py-2 font-inter text-sm text-slate-600 hover:text-brand-950 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : jaCongelado ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="self-start px-4 py-2 border border-slate-200 hover:bg-slate-50 font-inter text-sm text-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
        >
          <Snowflake className="w-4 h-4" />
          Recongelar metas
        </button>
      ) : (
        <button type="submit" disabled={pendente} className={`${botao} self-start`}>
          {pendente ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Snowflake className="w-4 h-4" />
          )}
          Congelar metas do plano
        </button>
      )}

      <Aviso estado={estado} />
    </form>
  );
}

/** Abre um mês para acompanhamento. */
export function FormularioAbrirMes({
  clientId,
  planId,
  sugestao,
}: {
  clientId: string;
  planId: string | null;
  sugestao: string;
}) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    abrirMes,
    undefined,
  );

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="__clientId" value={clientId} />
      <input type="hidden" name="__planId" value={planId ?? ""} />

      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label
            htmlFor="mes"
            className="block font-inter text-xs font-medium text-slate-600 mb-1.5"
          >
            Mês de referência
          </label>
          <input
            id="mes"
            name="mes"
            type="month"
            required
            defaultValue={sugestao}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-inter focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
          />
        </div>
        <button type="submit" disabled={pendente} className={botao}>
          {pendente && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Abrir mês
        </button>
      </div>

      <Aviso estado={estado} />
    </form>
  );
}

export function FormularioObservacao({
  recordId,
  valor,
  somenteLeitura,
}: {
  recordId: string;
  valor: string | null;
  somenteLeitura: boolean;
}) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    salvarObservacaoDoMes,
    undefined,
  );

  if (somenteLeitura) {
    return (
      <p className="font-inter text-sm text-slate-600 whitespace-pre-wrap">
        {valor || "Sem observações."}
      </p>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="__recordId" value={recordId} />
      <textarea
        name="observacao"
        rows={4}
        defaultValue={valor ?? ""}
        placeholder="O que os números não contam sobre este mês…"
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 font-inter focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent resize-y"
      />
      <button type="submit" disabled={pendente} className={`${botao} self-start`}>
        {pendente && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Salvar observação
      </button>
      <Aviso estado={estado} />
    </form>
  );
}

/** Publica ou reabre o relatório do mês. */
export function AcoesRelatorio({
  clientId,
  reportId,
  recordId,
  refMes,
  publicado,
}: {
  clientId: string;
  reportId: string;
  recordId: string;
  refMes: string;
  publicado: boolean;
}) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    publicarRelatorio,
    undefined,
  );
  const [reabrindo, setReabrindo] = useState(false);
  const [erroReabrir, setErroReabrir] = useState<string | null>(null);

  async function reabrir() {
    setReabrindo(true);
    const form = new FormData();
    form.set("__reportId", reportId);
    form.set("__recordId", recordId);
    const r = await reabrirRelatorio(form);
    setErroReabrir(r?.erro ?? null);
    setReabrindo(false);
  }

  if (publicado) {
    return (
      <div className="flex flex-col gap-3">
        <p className="font-inter text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          Publicado. O placar deste mês está congelado como saiu.
        </p>
        <button
          type="button"
          onClick={reabrir}
          disabled={reabrindo}
          className="self-start px-4 py-2 border border-slate-200 hover:bg-slate-50 font-inter text-sm text-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
        >
          {reabrindo ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LockOpen className="w-4 h-4" />
          )}
          Reabrir para correção
        </button>
        {erroReabrir && (
          <p className="font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {erroReabrir}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="__clientId" value={clientId} />
      <input type="hidden" name="__reportId" value={reportId} />
      <input type="hidden" name="__recordId" value={recordId} />
      <input type="hidden" name="__refMes" value={refMes} />
      <button type="submit" disabled={pendente} className={`${botao} self-start`}>
        {pendente ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
        Publicar relatório
      </button>
      <Aviso estado={estado} />
    </form>
  );
}
