"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { hojeISO, MESES_PT } from "@/lib/calendario";

/** Altura aproximada do painel, em px — usada para decidir se abre para cima. */
const ALTURA_PAINEL = 110;
const LARGURA_PAINEL = 240;

interface Caixa {
  esquerda: number;
  topo?: number;
  base?: number;
}

export interface MesPickerProps {
  name?: string;
  /** `YYYY-MM`. */
  defaultValue?: string;
  value?: string;
  onChange?: (mes: string) => void;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

/**
 * Seletor de mês do produto — mesma motivação do `DatePicker`, para campos
 * que só precisam de mês/ano (parcelas, metas, início do plano): o
 * `<input type="month">` nativo muda de cara por navegador e, no Chrome,
 * não dá para estilizar.
 *
 * Digita `mm/aaaa` (barras automáticas) ou escolhe nos dois `Select` do
 * painel — mês e ano, não uma grade de dias, porque não existe "dia" aqui.
 */
export function MesPicker({
  name,
  defaultValue,
  value: valorControlado,
  onChange,
  id,
  required = false,
  disabled = false,
  min,
  max,
  placeholder = "mm/aaaa",
  className = "",
  ...aria
}: MesPickerProps) {
  const autoId = useId();
  const idCampo = id ?? autoId;

  const controlado = valorControlado !== undefined;
  const [valorInterno, setValorInterno] = useState(defaultValue ?? "");
  const mes = controlado ? valorControlado : valorInterno;

  const [rascunho, setRascunho] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [caixa, setCaixa] = useState<Caixa | null>(null);

  const raizRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  const texto = rascunho ?? mesParaBr(mes);

  const definir = useCallback(
    (novoMes: string) => {
      if (!controlado) setValorInterno(novoMes);
      setRascunho(null);
      onChange?.(novoMes);
    },
    [controlado, onChange],
  );

  const medir = useCallback(() => {
    const c = campoRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const abaixo = window.innerHeight - r.bottom;
    const paraCima = abaixo < ALTURA_PAINEL && r.top > abaixo;

    setCaixa({
      esquerda: Math.max(8, Math.min(r.left, window.innerWidth - LARGURA_PAINEL - 8)),
      topo: paraCima ? undefined : r.bottom + 6,
      base: paraCima ? window.innerHeight - r.top + 6 : undefined,
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
    const fora = (e: MouseEvent) => {
      const alvo = e.target as HTMLElement;
      if (raizRef.current?.contains(alvo) || painelRef.current?.contains(alvo)) return;
      // Os selects de mês e ano vivem em portal no `body`, como no DatePicker:
      // escolher um ano é um clique fora do painel no DOM, mas dentro dele
      // para o usuário.
      if (alvo.closest?.("[data-painel]")) return;
      setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  const abrir = useCallback(() => {
    if (disabled) return;
    setAberto(true);
  }, [disabled]);

  /** Aceita `mm/aaaa` digitado; só grava quando o mês existe de verdade. */
  function aoDigitar(bruto: string) {
    const digitos = bruto.replace(/\D/g, "").slice(0, 6);
    const limpo = [digitos.slice(0, 2), digitos.slice(2, 6)].filter(Boolean).join("/");
    setRascunho(limpo);

    const m = /^(\d{2})\/(\d{4})$/.exec(limpo);
    if (!m) {
      if (limpo === "") definir("");
      return;
    }
    const [, mm, aaaa] = m;
    if (Number(mm) < 1 || Number(mm) > 12) return;
    definir(`${aaaa}-${mm}`);
  }

  const hoje = hojeISO();
  const [anoCursor, mesCursor] = mes
    ? mes.split("-").map(Number)
    : [Number(hoje.slice(0, 4)), Number(hoje.slice(5, 7))];

  const opcoesMes = useMemo(
    () => MESES_PT.map((m, i) => ({ valor: String(i + 1), rotulo: m })),
    [],
  );

  const opcoesAno = useMemo(() => {
    const atual = Number(hoje.slice(0, 4));
    const de = Math.min(min ? Number(min.slice(0, 4)) : atual - 80, anoCursor);
    const ate = Math.max(max ? Number(max.slice(0, 4)) : atual + 60, anoCursor);
    return Array.from({ length: ate - de + 1 }, (_, i) => ({
      valor: String(ate - i),
      rotulo: String(ate - i),
    }));
  }, [min, max, anoCursor, hoje]);

  return (
    <div ref={raizRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={mes} required={required} />}

      <div className="relative">
        <input
          ref={campoRef}
          id={idCampo}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={texto}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => aoDigitar(e.target.value)}
          onBlur={() => setRascunho(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && !aberto) {
              e.preventDefault();
              abrir();
            }
          }}
          className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm
            text-slate-800 placeholder-slate-400 font-inter tabular-nums
            hover:border-slate-300 transition-shadow
            focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          {...aria}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={aberto ? "Fechar seletor de mês" : "Abrir seletor de mês"}
          onClick={() => (aberto ? setAberto(false) : abrir())}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-slate-400
            hover:text-brand-600 hover:bg-slate-50 transition-colors cursor-pointer
            disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
        >
          <CalendarDays className="w-4 h-4" />
        </button>
      </div>

      {aberto &&
        caixa &&
        createPortal(
          <div
            ref={painelRef}
            role="dialog"
            aria-label="Escolher mês"
            style={{ position: "fixed", left: caixa.esquerda, top: caixa.topo, bottom: caixa.base }}
            className="z-[100] w-60 bg-white border border-slate-200 rounded-xl shadow-lg p-3"
          >
            <div className="flex items-center gap-1.5">
              <Select
                aria-label="Mês"
                tamanho="sm"
                className="flex-1"
                value={String(mesCursor)}
                onChange={(v) => definir(`${anoCursor}-${v.padStart(2, "0")}`)}
                opcoes={opcoesMes}
              />
              <Select
                aria-label="Ano"
                tamanho="sm"
                className="w-24"
                value={String(anoCursor)}
                onChange={(v) => definir(`${v}-${String(mesCursor).padStart(2, "0")}`)}
                opcoes={opcoesAno}
              />
            </div>

            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => {
                  definir(`${hoje.slice(0, 4)}-${hoje.slice(5, 7)}`);
                  setAberto(false);
                  campoRef.current?.focus();
                }}
                className="font-inter text-xs text-brand-600 hover:text-brand-900 transition-colors cursor-pointer"
              >
                Este mês
              </button>
              {mes && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    definir("");
                    setAberto(false);
                    campoRef.current?.focus();
                  }}
                  className="font-inter text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function mesParaBr(mes: string): string {
  if (!/^\d{4}-\d{2}$/.test(mes)) return "";
  return `${mes.slice(5, 7)}/${mes.slice(0, 4)}`;
}
