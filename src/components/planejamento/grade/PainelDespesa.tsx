"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { criarLinhaDoGrid } from "@/lib/actions/grade";
import { BlocoCategoria } from "./BlocoCategoria";
import type { LinhaGrid } from "./GradeEditavel";

export interface BlocoComLinhas {
  id: string;
  nome: string;
  linhas: LinhaGrid[];
}

/**
 * A seção Despesa inteira, do lado do cliente.
 *
 * A lista de blocos vive em estado local pelo mesmo motivo do grid: as actions
 * do grid não revalidam a rota, então um bloco criado agora só existiria na
 * tela se a tela for dona da lista. O servidor semeia; daqui em diante, o
 * painel manda.
 */
export function PainelDespesa({
  blocos: blocosIniciais,
  sugestoes,
  planId,
  clientId,
}: {
  blocos: BlocoComLinhas[];
  /** Nomes de categoria já usados na organização, para o autocomplete. */
  sugestoes: string[];
  planId: string;
  clientId: string;
}) {
  const [blocos, setBlocos] = useState(blocosIniciais);

  return (
    <div className="flex flex-col gap-6">
      {blocos.length === 0 && (
        <p className="font-inter text-sm text-slate-500">
          Nenhuma categoria ainda. As despesas se organizam em blocos — Moradia,
          Transporte, Filhos — e cada bloco tem a própria tabela.
        </p>
      )}

      {blocos.map((b) => (
        <BlocoCategoria
          key={b.id}
          bloco={b}
          linhas={b.linhas}
          planId={planId}
          clientId={clientId}
          aoRemover={(id) => setBlocos((bs) => bs.filter((x) => x.id !== id))}
        />
      ))}

      <NovaCategoria
        sugestoes={sugestoes}
        existentes={blocos.map((b) => b.nome)}
        aoCriar={async (nome) => {
          const form = new FormData();
          form.set("__entidade", "categoria_despesa");
          form.set("__planId", planId);
          form.set("__clientId", clientId);
          form.set("nome", nome);

          const r = await criarLinhaDoGrid(form);
          if (r.erro || !r.id) return r.erro ?? "Não foi possível criar a categoria.";

          setBlocos((bs) => [...bs, { id: r.id!, nome, linhas: [] }]);
          return null;
        }}
      />
    </div>
  );
}

/**
 * O rodapé "Nova categoria": texto livre com sugestões da organização.
 *
 * Sugestão, não lista fechada — a categoria é do planejamento. O autocomplete
 * existe para os nomes convergirem naturalmente entre clientes (o Dashboard da
 * Fase 3 agradece), não para impedir um nome novo.
 */
function NovaCategoria({
  sugestoes,
  existentes,
  aoCriar,
}: {
  sugestoes: string[];
  existentes: string[];
  aoCriar: (nome: string) => Promise<string | null>;
}) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  const jaExiste = (nome: string) =>
    existentes.some((e) => e.toLowerCase() === nome.toLowerCase());

  const filtradas = sugestoes
    .filter((s) => !jaExiste(s))
    .filter((s) => s.toLowerCase().includes(texto.trim().toLowerCase()))
    .slice(0, 8);

  async function criar(nome: string) {
    const limpo = nome.trim();
    if (limpo === "" || criando) return;
    if (jaExiste(limpo)) {
      setErro("Já existe um bloco com esse nome neste planejamento.");
      return;
    }

    setCriando(true);
    setErro(null);
    const falha = await aoCriar(limpo);
    setCriando(false);

    if (falha) {
      setErro(falha);
      return;
    }
    setTexto("");
    setAberto(false);
  }

  return (
    <div ref={raiz} className="relative">
      <div className="flex items-center gap-2 bg-white rounded-xl border border-dashed border-slate-300 px-4 py-3">
        <Plus className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          aria-label="Nova categoria de despesa"
          value={texto}
          placeholder="Nova categoria — Moradia, Transporte, Filhos…"
          onChange={(e) => {
            setTexto(e.target.value);
            setAberto(true);
            setErro(null);
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void criar(texto);
            if (e.key === "Escape") setAberto(false);
          }}
          className="flex-1 bg-transparent font-inter text-sm text-slate-700 focus:outline-none"
        />
        {criando && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>

      {erro && (
        <p className="font-inter text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-2 py-1 mt-2">
          {erro}
        </p>
      )}

      {aberto && filtradas.length > 0 && (
        <ul
          role="listbox"
          aria-label="Categorias já usadas"
          className="absolute z-30 bottom-full mb-1 left-0 w-72 bg-white rounded-xl border border-slate-200 shadow-lg py-1 max-h-64 overflow-y-auto"
        >
          {filtradas.map((s) => (
            <li key={s}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => void criar(s)}
                className="w-full text-left px-3 py-2 font-inter text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
