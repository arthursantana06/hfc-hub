"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { MesPicker } from "@/components/ui/MesPicker";
import { SeletorMeses } from "@/components/ui/SeletorMeses";
import { formatarEnquantoDigita } from "@/components/ui/InputMoeda";
import { rotuloDosMeses, lerMeses, type Campo } from "@/lib/forms/planejamento";

/**
 * Uma célula do grid, tipada pelo `Campo` do esquema.
 *
 * Toda célula é um controle sempre visível (como Notion, não como Excel com
 * modo de exibição/edição): menos um estado para errar, e o clique já cai
 * dentro do campo. A troca deliberada: as setas movem o cursor DENTRO do
 * texto, não entre células — quem digita valores confere dígito a dígito, e
 * roubar as setas do cursor atrapalharia exatamente essa conferência. A
 * navegação entre células fica com Tab/Shift+Tab e Enter (confirma e desce).
 *
 * O contrato com o grid: `aoConfirmar` dispara no blur/Enter (texto e número),
 * ou na escolha (select, mês, meses, checkbox) — só quando o valor mudou.
 * Escape restaura o último valor salvo e não grava nada.
 */
export function CelulaEditavel({
  campo,
  valor,
  aoConfirmar,
  aoEnter,
  registrarRef,
  desabilitada = false,
}: {
  campo: Campo;
  /** O valor salvo, no formato de tela ("1.234,56", "2026-08", "1,2,3"). */
  valor: string;
  aoConfirmar: (valor: string) => void;
  /** Enter numa célula de texto/número: confirma e pede foco na linha de baixo. */
  aoEnter?: () => void;
  registrarRef?: (el: HTMLElement | null) => void;
  desabilitada?: boolean;
}) {
  if (desabilitada) {
    return <span className="block px-2 py-1.5 text-slate-300 select-none">—</span>;
  }

  switch (campo.tipo) {
    case "select":
      return (
        <Select
          aria-label={campo.label}
          tamanho="sm"
          className="w-full"
          value={valor}
          opcoes={campo.opcoes ?? []}
          onChange={(v) => v !== valor && aoConfirmar(v)}
        />
      );
    case "mes":
      return (
        <MesPicker
          aria-label={campo.label}
          className="w-full"
          value={valor}
          onChange={(v) => v !== valor && aoConfirmar(v)}
        />
      );
    case "meses":
      return <CelulaMeses campo={campo} valor={valor} aoConfirmar={aoConfirmar} />;
    case "bool":
      return (
        <input
          type="checkbox"
          aria-label={campo.label}
          checked={valor === "true" || valor === "on"}
          onChange={(e) => aoConfirmar(e.target.checked ? "true" : "")}
          className="w-4 h-4 accent-brand-600 cursor-pointer"
        />
      );
    default:
      return (
        <CelulaTexto
          campo={campo}
          valor={valor}
          aoConfirmar={aoConfirmar}
          aoEnter={aoEnter}
          registrarRef={registrarRef}
        />
      );
  }
}

function CelulaTexto({
  campo,
  valor,
  aoConfirmar,
  aoEnter,
  registrarRef,
}: {
  campo: Campo;
  valor: string;
  aoConfirmar: (valor: string) => void;
  aoEnter?: () => void;
  registrarRef?: (el: HTMLElement | null) => void;
}) {
  const [texto, setTexto] = useState(valor);
  const editando = useRef(false);

  // O servidor (ou um revert de erro) pode corrigir o valor por baixo — mas
  // nunca enquanto o planejador está com o cursor dentro da célula.
  useEffect(() => {
    if (!editando.current) setTexto(valor);
  }, [valor]);

  const numerica = campo.tipo === "moeda" || campo.tipo === "decimal";

  function confirmar() {
    editando.current = false;
    const limpo = texto.trim();
    if (limpo !== valor) aoConfirmar(limpo);
    else setTexto(valor);
  }

  return (
    <input
      ref={registrarRef}
      type="text"
      inputMode={numerica || campo.tipo === "inteiro" ? "decimal" : undefined}
      aria-label={campo.label}
      value={texto}
      placeholder={campo.placeholder ?? (numerica ? "0,00" : "")}
      onFocus={() => (editando.current = true)}
      onChange={(e) =>
        setTexto(campo.tipo === "moeda" ? formatarEnquantoDigita(e.target.value) : e.target.value)
      }
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          confirmar();
          aoEnter?.();
        }
        if (e.key === "Escape") {
          editando.current = false;
          setTexto(valor);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={`w-full bg-transparent px-2 py-1.5 font-inter text-sm text-slate-700 rounded-md
        border border-transparent hover:border-slate-200 focus:border-brand-300 focus:bg-white
        focus:outline-none focus:ring-2 focus:ring-brand-300/40 transition-colors
        ${numerica ? "text-right tabular-nums" : ""}`}
    />
  );
}

/**
 * Os quadradinhos de meses não cabem numa linha de tabela — viram um popover
 * ancorado num botão que resume a escolha ("jan · fev · mar").
 */
function CelulaMeses({
  campo,
  valor,
  aoConfirmar,
}: {
  campo: Campo;
  valor: string;
  aoConfirmar: (valor: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const resumo = rotuloDosMeses(lerMeses(valor));

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-label={campo.label}
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 font-inter text-sm rounded-md
          border border-transparent hover:border-slate-200 text-left cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-brand-300/40"
      >
        <CalendarRange className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className={resumo ? "text-slate-700 truncate" : "text-slate-400"}>
          {resumo || "escolher"}
        </span>
      </button>

      {aberto && (
        <div className="absolute z-30 top-full left-0 mt-1 w-64 bg-white rounded-xl border border-slate-200 shadow-lg p-3">
          {/* `key={valor}` remonta o seletor quando um revert de erro devolve o
              valor antigo — ele guarda estado próprio e não saberia sozinho. */}
          <SeletorMeses
            key={valor}
            name={`__celula_${campo.key}`}
            defaultValue={valor}
            onChange={aoConfirmar}
            aria-label={campo.label}
          />
        </div>
      )}
    </div>
  );
}
