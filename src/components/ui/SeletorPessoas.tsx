"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import type { Pessoa } from "@/lib/agenda-dal";

const ALTURA_PAINEL = 320;

interface Caixa {
  esquerda: number;
  largura: number;
  topo?: number;
  base?: number;
  alturaMax: number;
}

const TAG: Record<"admin" | "planner" | "cliente", { rotulo: string; className: string }> = {
  admin: { rotulo: "Admin", className: "bg-violet-100 text-violet-700" },
  planner: { rotulo: "Planejador", className: "bg-blue-100 text-blue-700" },
  cliente: { rotulo: "Cliente", className: "bg-emerald-100 text-emerald-700" },
};

function tagDe(p: Pessoa) {
  return TAG[p.tipo === "cliente" ? "cliente" : (p.role ?? "planner")];
}

/**
 * Multi-seleção de pessoas (admin, planejador ou cliente), com busca e uma
 * tag por linha diferenciando o tipo — pedido de Arthur depois de ver o
 * campo "Planejador" (único, só staff) não bastar mais: uma reunião reúne
 * qualquer combinação de gente.
 *
 * Trigger é um `<div role="button">`, não um `<button>`, porque cada chip
 * selecionado carrega seu próprio botão de remover — um `<button>` não pode
 * conter outro elemento interativo.
 */
export function SeletorPessoas({
  name,
  pessoas,
  /** Chaves `"tipo:id"` já selecionadas. */
  defaultValue = [],
  placeholder = "Selecionar pessoas…",
  className = "",
  "aria-label": ariaLabel,
}: {
  name: string;
  pessoas: Pessoa[];
  defaultValue?: string[];
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const [selecionados, setSelecionados] = useState<string[]>(defaultValue);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [caixa, setCaixa] = useState<Caixa | null>(null);

  const raizRef = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLDivElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const buscaRef = useRef<HTMLInputElement>(null);

  const porChave = useMemo(() => {
    const m = new Map<string, Pessoa>();
    for (const p of pessoas) m.set(`${p.tipo}:${p.id}`, p);
    return m;
  }, [pessoas]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return termo ? pessoas.filter((p) => p.nome.toLowerCase().includes(termo)) : pessoas;
  }, [pessoas, busca]);

  const medir = useCallback(() => {
    const b = gatilhoRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const abaixo = window.innerHeight - r.bottom;
    const paraCima = abaixo < ALTURA_PAINEL && r.top > abaixo;

    setCaixa({
      esquerda: r.left,
      largura: r.width,
      topo: paraCima ? undefined : r.bottom + 6,
      base: paraCima ? window.innerHeight - r.top + 6 : undefined,
      alturaMax: Math.min(ALTURA_PAINEL, (paraCima ? r.top : abaixo) - 12),
    });
  }, []);

  useLayoutEffect(() => {
    if (aberto) medir();
  }, [aberto, medir]);

  useEffect(() => {
    if (!aberto) return;
    window.addEventListener("scroll", medir, true);
    window.addEventListener("resize", medir);
    return () => {
      window.removeEventListener("scroll", medir, true);
      window.removeEventListener("resize", medir);
    };
  }, [aberto, medir]);

  useEffect(() => {
    if (!aberto) return;
    buscaRef.current?.focus();

    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (raizRef.current?.contains(alvo) || painelRef.current?.contains(alvo)) return;
      setAberto(false);
      setBusca("");
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAberto(false);
      setBusca("");
      gatilhoRef.current?.focus();
    };

    document.addEventListener("mousedown", fora);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      window.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  function alternar(chave: string) {
    setSelecionados((atual) =>
      atual.includes(chave) ? atual.filter((c) => c !== chave) : [...atual, chave],
    );
  }

  return (
    <div ref={raizRef} className={`relative ${className}`}>
      {selecionados.map((chave) => (
        <input key={chave} type="hidden" name={name} value={chave} />
      ))}

      <div
        ref={gatilhoRef}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={ariaLabel}
        onClick={() => setAberto((a) => !a)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setAberto((a) => !a);
          }
        }}
        className={`w-full min-h-[2.375rem] px-2.5 py-1.5 flex items-center flex-wrap gap-1.5 bg-white border rounded-lg
          font-inter transition-shadow cursor-pointer
          ${aberto ? "border-transparent ring-2 ring-brand-300" : "border-slate-200 hover:border-slate-300"}
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:border-transparent`}
      >
        {selecionados.length === 0 ? (
          <span className="text-sm text-slate-400 flex-1">{placeholder}</span>
        ) : (
          selecionados.map((chave) => {
            const p = porChave.get(chave);
            if (!p) return null;
            return (
              <span
                key={chave}
                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-slate-100 text-xs font-inter text-slate-700"
              >
                {p.nome}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    alternar(chave);
                  }}
                  aria-label={`Remover ${p.nome}`}
                  className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })
        )}
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-400 ml-auto transition-transform duration-150 ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </div>

      {aberto &&
        caixa &&
        createPortal(
          <div
            ref={painelRef}
            data-painel="seletor-pessoas"
            style={{
              position: "fixed",
              left: caixa.esquerda,
              top: caixa.topo,
              bottom: caixa.base,
              minWidth: caixa.largura,
              maxWidth: "min(24rem, 92vw)",
              maxHeight: caixa.alturaMax,
            }}
            className="z-[100] flex flex-col bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={buscaRef}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar pessoa…"
                  className="w-full pl-8 pr-2 py-1.5 text-sm font-inter border border-slate-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
                />
              </div>
            </div>

            <ul role="listbox" aria-multiselectable="true" className="overflow-y-auto py-1">
              {filtradas.length === 0 ? (
                <li className="px-3 py-4 text-center font-inter text-sm text-slate-400">
                  Ninguém encontrado.
                </li>
              ) : (
                filtradas.map((p) => {
                  const chave = `${p.tipo}:${p.id}`;
                  const selecionada = selecionados.includes(chave);
                  const tag = tagDe(p);
                  return (
                    <li key={chave}>
                      <div
                        role="option"
                        aria-selected={selecionada}
                        onClick={() => alternar(chave)}
                        className={`mx-1.5 px-2.5 py-2 rounded-lg flex items-center gap-2.5 cursor-pointer transition-colors
                          ${selecionada ? "bg-brand-300/15" : "hover:bg-slate-50"}`}
                      >
                        <span className="flex-1 min-w-0 truncate font-inter text-sm text-slate-700">
                          {p.nome}
                        </span>
                        <span
                          className={`shrink-0 font-inter text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full ${tag.className}`}
                        >
                          {tag.rotulo}
                        </span>
                        <Check
                          className={`w-4 h-4 shrink-0 text-brand-600 transition-opacity ${
                            selecionada ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
