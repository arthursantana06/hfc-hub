"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "@/components/ui/Select";
import {
  gradeDoMes,
  hojeISO,
  MESES_PT,
  primeiroDoMes,
  somarDias,
  somarMeses,
} from "@/lib/calendario";

const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Altura desejada do painel, em px — usada para decidir se abre para cima. */
const ALTURA_PAINEL = 340;
/** Precisa bater com a classe de largura do painel (`w-80` = 20rem). */
const LARGURA_PAINEL = 320;

interface Caixa {
  esquerda: number;
  topo?: number;
  base?: number;
}

export interface DatePickerProps {
  name?: string;
  /** `YYYY-MM-DD`. */
  defaultValue?: string;
  value?: string;
  onChange?: (iso: string) => void;
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
 * Seletor de data do produto.
 *
 * O `<input type="date">` nativo muda de aparência em cada navegador e, no
 * Chrome, não dá para estilizar o ícone nem o calendário — num formulário que
 * já usa o Select próprio, ele destoa. Além disso, o campo nativo em pt-BR
 * aceita digitação no formato do sistema operacional, que nem sempre é o do
 * usuário.
 *
 * Aqui o campo de texto aceita `dd/mm/aaaa` digitado e o calendário cobre o
 * resto, com teclado completo: setas andam por dia, PageUp/PageDown por mês,
 * Home/End vão ao começo e ao fim da semana, Enter escolhe, Esc fecha.
 *
 * O valor viaja num input escondido em ISO (`YYYY-MM-DD`), que é o que o
 * Postgres espera — a tela nunca envia data em formato brasileiro.
 */
export function DatePicker({
  name,
  defaultValue,
  value: valorControlado,
  onChange,
  id,
  required = false,
  disabled = false,
  min,
  max,
  placeholder = "dd/mm/aaaa",
  className = "",
  ...aria
}: DatePickerProps) {
  const autoId = useId();
  const idCampo = id ?? autoId;

  const controlado = valorControlado !== undefined;
  const [valorInterno, setValorInterno] = useState(defaultValue ?? "");
  const iso = controlado ? valorControlado : valorInterno;

  /**
   * O que está sendo digitado, enquanto ainda não é uma data.
   *
   * `null` significa "nada em edição" — e aí o texto é derivado do valor. Sem
   * essa distinção, manter o texto em estado próprio exigiria sincronizá-lo
   * com o valor num efeito, que é derivar estado do estado: o campo pisca o
   * valor antigo por um render a cada mudança vinda de fora.
   */
  const [rascunho, setRascunho] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  /** Mês exibido na grade. */
  const [cursor, setCursor] = useState(() => primeiroDoMes(iso || hojeISO()));
  /** Dia sob o teclado — nem sempre é o dia escolhido. */
  const [cursorDia, setCursorDia] = useState(() => iso || hojeISO());

  const raizRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  const texto = rascunho ?? isoParaBr(iso);

  const definir = useCallback(
    (novoIso: string) => {
      if (!controlado) setValorInterno(novoIso);
      setRascunho(null);
      onChange?.(novoIso);
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
      // O painel tem largura fixa: sem o teto ele sangra pela direita, e sem o
      // piso a correção o joga para fora pela esquerda em tela estreita.
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
      // Os selects de mês e ano também vivem em portal no `body`: escolher um
      // mês é um clique fora do calendário no DOM, mas dentro dele para o
      // usuário. Sem esta linha, trocar o mês fecharia o calendário.
      if (alvo.closest?.("[data-painel]")) return;
      setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  const abrir = useCallback(() => {
    if (disabled) return;
    const partida = iso || hojeISO();
    setCursor(primeiroDoMes(partida));
    // O dia sob o teclado volta ao valor a cada abertura: sem isto, reabrir
    // depois de limpar o campo deixaria o foco no dia antigo.
    setCursorDia(partida);
    setAberto(true);
  }, [disabled, iso]);

  /** As 42 casas da grade — seis semanas cobrem qualquer mês. */
  const grade = useMemo(
    () => gradeDoMes(cursor).map((c) => (c.noMes ? c.data : null)),
    [cursor],
  );

  const anoCursor = Number(cursor.slice(0, 4));

  const opcoesMes = useMemo(
    () => MESES_PT.map((m, i) => ({ valor: String(i + 1), rotulo: m })),
    [],
  );

  /**
   * Faixa de anos oferecida. Nasce de `min`/`max` quando eles existem — num
   * campo de nascimento, oferecer 2200 é ruído — e sempre inclui o ano que
   * está na tela, senão o select mostraria o placeholder no próprio valor.
   */
  const opcoesAno = useMemo(() => {
    const atual = Number(hojeISO().slice(0, 4));
    const de = Math.min(min ? Number(min.slice(0, 4)) : atual - 100, anoCursor);
    const ate = Math.max(max ? Number(max.slice(0, 4)) : atual + 10, anoCursor);
    return Array.from({ length: ate - de + 1 }, (_, i) => ({
      valor: String(ate - i),
      rotulo: String(ate - i),
    }));
  }, [min, max, anoCursor]);

  const foraDoLimite = useCallback(
    (d: string) => (min !== undefined && d < min) || (max !== undefined && d > max),
    [min, max],
  );

  function andarCursor(dias: number) {
    const alvo = somarDias(cursorDia, dias);
    setCursor(primeiroDoMes(alvo));
    setCursorDia(alvo);
  }

  function aoTeclarNoPainel(e: React.KeyboardEvent) {
    const passos: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };

    if (passos[e.key] !== undefined) {
      e.preventDefault();
      andarCursor(passos[e.key]);
      return;
    }

    switch (e.key) {
      case "PageUp":
      case "PageDown":
        e.preventDefault();
        andarCursor(e.key === "PageUp" ? -28 : 28);
        return;
      case "Home":
      case "End": {
        e.preventDefault();
        const d = new Date(`${cursorDia}T00:00:00Z`).getUTCDay();
        andarCursor(e.key === "Home" ? -d : 6 - d);
        return;
      }
      case "Enter":
      case " ":
        e.preventDefault();
        if (!foraDoLimite(cursorDia)) {
          definir(cursorDia);
          setAberto(false);
          campoRef.current?.focus();
        }
        return;
      case "Escape":
        e.preventDefault();
        setAberto(false);
        campoRef.current?.focus();
    }
  }

  /**
   * Aceita `dd/mm/aaaa` digitado; só grava quando a data existe de verdade.
   *
   * As barras são inseridas automaticamente a partir dos dígitos — quem
   * digita só números (sem saber que precisa das barras) via de outro modo o
   * texto sumir no blur sem aviso, porque nunca bateria com o regex abaixo.
   */
  function aoDigitar(bruto: string) {
    const digitos = bruto.replace(/\D/g, "").slice(0, 8);
    const limpo = [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)]
      .filter(Boolean)
      .join("/");
    setRascunho(limpo);

    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(limpo);
    if (!m) {
      if (limpo === "") definir("");
      return;
    }

    const [, dd, mm, aaaa] = m;
    const candidato = `${aaaa}-${mm}-${dd}`;
    // `new Date` aceita 31/02 e desliza para março; comparar de volta é o que
    // rejeita a data que não existe.
    const d = new Date(`${candidato}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== candidato) return;

    definir(candidato);
    setCursor(primeiroDoMes(candidato));
    setCursorDia(candidato);
  }

  const hoje = hojeISO();
  const mesCursor = Number(cursor.slice(5, 7));

  return (
    <div ref={raizRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={iso} required={required} />}

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
          // Digitação incompleta volta para o valor gravado ao sair do campo,
          // em vez de deixar "15/0" na tela como se fosse dado.
          onBlur={() => setRascunho(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && !aberto) {
              e.preventDefault();
              abrir();
              // O foco vai para o painel no próximo quadro, quando ele existe.
              requestAnimationFrame(() => painelRef.current?.focus());
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
          aria-label={aberto ? "Fechar calendário" : "Abrir calendário"}
          onClick={() => {
            if (aberto) return setAberto(false);
            abrir();
            requestAnimationFrame(() => painelRef.current?.focus());
          }}
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
            aria-label="Escolher data"
            tabIndex={-1}
            onKeyDown={aoTeclarNoPainel}
            style={{ position: "fixed", left: caixa.esquerda, top: caixa.topo, bottom: caixa.base }}
            className="z-[100] w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3
              focus:outline-none select-painel"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <Passo
                rotulo="Mês anterior"
                onClick={() => setCursor(somarMeses(cursor, -1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Passo>

              {/* As setas do teclado aqui pertencem ao select aberto, não à
                  grade de dias: sem a barreira, uma tecla andaria nos dois. */}
              <div
                className="flex items-center gap-1.5"
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Select
                  aria-label="Mês"
                  tamanho="sm"
                  className="w-[7.5rem]"
                  value={String(mesCursor)}
                  onChange={(v) => setCursor(`${anoCursor}-${v.padStart(2, "0")}-01`)}
                  opcoes={opcoesMes}
                />
                <Select
                  aria-label="Ano"
                  tamanho="sm"
                  className="w-[5.5rem]"
                  value={String(anoCursor)}
                  onChange={(v) => setCursor(`${v}-${String(mesCursor).padStart(2, "0")}-01`)}
                  opcoes={opcoesAno}
                />
              </div>

              <Passo rotulo="Próximo mês" onClick={() => setCursor(somarMeses(cursor, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Passo>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {DIAS.map((d, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="text-center font-inter text-[0.68rem] font-semibold uppercase text-slate-400 py-1"
                >
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {grade.map((d, i) =>
                d === null ? (
                  <span key={i} />
                ) : (
                  <button
                    key={d}
                    type="button"
                    tabIndex={-1}
                    disabled={foraDoLimite(d)}
                    aria-current={d === cursorDia ? "date" : undefined}
                    aria-pressed={d === iso}
                    onClick={() => {
                      definir(d);
                      setCursorDia(d);
                      setAberto(false);
                      campoRef.current?.focus();
                    }}
                    className={`h-8 rounded-lg font-inter text-sm tabular-nums transition-colors
                      disabled:opacity-30 disabled:cursor-not-allowed
                      ${
                        d === iso
                          ? "bg-brand-600 text-white font-medium"
                          : d === cursorDia
                            ? "bg-brand-300/25 text-brand-950"
                            : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                      }
                      ${d === hoje && d !== iso ? "ring-1 ring-inset ring-brand-300" : ""}`}
                  >
                    {Number(d.slice(8, 10))}
                  </button>
                ),
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => {
                  if (foraDoLimite(hoje)) return;
                  definir(hoje);
                  setCursorDia(hoje);
                  setAberto(false);
                  campoRef.current?.focus();
                }}
                className="font-inter text-xs text-brand-600 hover:text-brand-900 transition-colors cursor-pointer"
              >
                Hoje
              </button>
              {iso && (
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

function Passo({
  rotulo,
  onClick,
  children,
}: {
  rotulo: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={rotulo}
      onClick={onClick}
      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-50 transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

function isoParaBr(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}
