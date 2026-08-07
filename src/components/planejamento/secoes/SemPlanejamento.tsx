"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Compass, Loader2 } from "lucide-react";
import { garantirPlanejamento, type Estado } from "@/lib/actions/planejamento";

const NOME: Record<string, string> = {
  pre_hfc: "Pré-HFC",
  hfc: "HFC",
  real: "Real",
};

const DESCRICAO: Record<string, string> = {
  pre_hfc:
    "A foto de como o cliente vivia antes da consultoria. Preenchida uma vez, vale como base de comparação para sempre.",
  hfc: "O plano traçado a partir da primeira conversa. É a referência que o Real herda e contra a qual o Acompanhamento mede cada mês.",
  real: "A série de períodos mensais editada a cada reunião de acompanhamento.",
};

/**
 * Estado vazio de um planejamento que ainda não existe.
 *
 * Pré-HFC e HFC nascem aqui mesmo, com um clique — são retratos com premissas
 * default, ajustáveis depois na Projeção. O Real nasce no Cadastro (premissas e
 * mês de início são decisão, não default) enquanto a abertura por herança do
 * HFC não chega na Fase 2.
 */
export function SemPlanejamento({
  clienteId,
  tipo,
}: {
  clienteId: string;
  tipo: "pre_hfc" | "hfc" | "real";
}) {
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    garantirPlanejamento,
    undefined,
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-4 text-center">
        <Compass className="w-8 h-8 text-slate-300" />
        <div>
          <p className="font-poppins font-medium text-lg text-brand-950">
            Sem planejamento {NOME[tipo]} ainda
          </p>
          <p className="font-inter text-sm text-slate-500 mt-1 max-w-md">
            {DESCRICAO[tipo]}
          </p>
        </div>

        {tipo === "real" ? (
          <Link
            href={`/clientes/${clienteId}/cadastro`}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-900 transition-colors text-white font-poppins font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm"
          >
            Criar o primeiro período no Cadastro
          </Link>
        ) : (
          <form action={acao}>
            <input type="hidden" name="__clientId" value={clienteId} />
            <input type="hidden" name="__tipo" value={tipo} />
            <button
              type="submit"
              disabled={pendente}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-900 transition-colors text-white font-poppins font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm cursor-pointer disabled:opacity-60"
            >
              {pendente && <Loader2 className="w-4 h-4 animate-spin" />}
              {pendente ? "Criando…" : `Criar planejamento ${NOME[tipo]}`}
            </button>
          </form>
        )}

        {estado?.erro && (
          <p className="font-inter text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {estado.erro}
          </p>
        )}
      </div>
    </div>
  );
}
