"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { removerLinhaDoGrid, salvarLinhaDoGrid } from "@/lib/actions/grade";
import { GradeEditavel, type LinhaGrid } from "./GradeEditavel";

/** As colunas do grid de despesas dentro de um bloco. */
const COLUNAS_DESPESA = [
  "descricao",
  "valor",
  "bucket",
  "pagamento",
  "frequencia",
  "mes_ocorrencia",
  "meses",
];

/**
 * Um bloco de categoria da seção Despesa: título editável, o grid das
 * despesas do bloco e o subtotal.
 *
 * O título grava no blur pelo mesmo caminho do grid (`categoria_despesa` é uma
 * entidade como qualquer outra); remover o bloco leva as despesas junto — no
 * banco por cascade, no Real por tombstone — e por isso pede confirmação em
 * dois passos, como as linhas.
 */
export function BlocoCategoria({
  bloco,
  linhas,
  planId,
  clientId,
  comPin,
  aoRemover,
}: {
  bloco: { id: string; nome: string };
  linhas: LinhaGrid[];
  planId: string;
  clientId: string;
  comPin?: boolean;
  aoRemover: (blocoId: string) => void;
}) {
  const [nome, setNome] = useState(bloco.nome);
  const nomeSalvo = useRef(bloco.nome);
  const [erro, setErro] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);

  async function salvarNome() {
    const limpo = nome.trim();
    if (limpo === nomeSalvo.current) return;
    if (limpo === "") {
      setNome(nomeSalvo.current);
      return;
    }

    const form = new FormData();
    form.set("__entidade", "categoria_despesa");
    form.set("__id", bloco.id);
    form.set("__planId", planId);
    form.set("nome", limpo);

    const r = await salvarLinhaDoGrid(form);
    if (r.erro) {
      setNome(nomeSalvo.current);
      setErro(r.erro);
      return;
    }
    nomeSalvo.current = limpo;
    setErro(null);
  }

  async function removerBloco() {
    setRemovendo(false);
    const form = new FormData();
    form.set("__entidade", "categoria_despesa");
    form.set("__id", bloco.id);
    form.set("__planId", planId);

    const r = await removerLinhaDoGrid(form);
    if (r.erro) {
      setErro(r.erro);
      return;
    }
    aoRemover(bloco.id);
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between gap-3 mb-1 group">
        <input
          type="text"
          aria-label="Nome da categoria"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onBlur={salvarNome}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") setNome(nomeSalvo.current);
          }}
          className="flex-1 min-w-0 font-poppins font-medium text-base text-brand-950 bg-transparent
            px-1 py-0.5 rounded-md border border-transparent hover:border-slate-200
            focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300/40"
        />

        {removendo ? (
          <button
            type="button"
            onClick={removerBloco}
            onBlur={() => setRemovendo(false)}
            className="font-inter text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-2 py-1 cursor-pointer whitespace-nowrap"
          >
            Remover bloco e despesas?
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Remover categoria ${bloco.nome}`}
            onClick={() => setRemovendo(true)}
            className="p-1.5 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {erro && (
        <p className="font-inter text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-2 py-1 mb-2">
          {erro}
        </p>
      )}

      <GradeEditavel
        titulo={`Despesas de ${bloco.nome}`}
        entidade="despesa"
        colunas={COLUNAS_DESPESA}
        linhas={linhas}
        planId={planId}
        clientId={clientId}
        categoriaPlanId={bloco.id}
        comPin={comPin}
        colunaTotal="valor"
        vazio="Nenhuma despesa neste bloco ainda."
      />
    </section>
  );
}
