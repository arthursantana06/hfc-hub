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
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

export interface Opcao {
  valor: string;
  rotulo: string;
  /** Linha secundária — explica a opção sem obrigar a tela a explicar. */
  descricao?: string;
  icone?: LucideIcon;
  grupo?: string;
  desabilitada?: boolean;
}

/** Altura máxima desejada do painel, em px. */
const ALTURA_PAINEL = 256;

interface Caixa {
  esquerda: number;
  largura: number;
  topo?: number;
  base?: number;
  alturaMax: number;
}

export interface SelectProps {
  /** Nome do campo no FormData. O valor viaja num input escondido. */
  name?: string;
  opcoes: Opcao[];
  defaultValue?: string;
  /** Controlado: informe os dois. */
  value?: string;
  onChange?: (valor: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Compacto, para dentro de linhas de tabela. */
  tamanho?: "md" | "sm";
  className?: string;
}

/**
 * Select do produto.
 *
 * Um `<select>` nativo não deixa mostrar descrição por opção, e é justamente o
 * que estas escolhas pedem: "Administrador" e "Planejador" só significam algo
 * ao lado do que cada um pode fazer. Trocar por um `<div>` custa reimplementar
 * o que o nativo dá de graça — e é isso que está aqui: teclado completo
 * (setas, Home/End, Enter, Esc, busca por digitação), papéis ARIA, foco de
 * volta ao gatilho ao fechar, e um input escondido para que o valor continue
 * chegando no FormData de uma Server Action.
 *
 * Onde não há descrição nem ícone, o nativo é melhor: menos código e o
 * seletor do sistema no celular. Este componente é para quando a opção
 * precisa se explicar.
 */
export function Select({
  name,
  opcoes,
  defaultValue,
  value: valorControlado,
  onChange,
  placeholder = "Selecione…",
  disabled = false,
  required = false,
  id,
  tamanho = "md",
  className = "",
  ...aria
}: SelectProps) {
  const autoId = useId();
  const idBotao = id ?? autoId;
  const idLista = `${autoId}-lista`;

  const controlado = valorControlado !== undefined;
  const [valorInterno, setValorInterno] = useState(defaultValue ?? "");
  const valor = controlado ? valorControlado : valorInterno;

  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const [caixa, setCaixa] = useState<Caixa | null>(null);

  const raizRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const buscaRef = useRef({ termo: "", quando: 0 });

  const selecionavel = useMemo(
    () => opcoes.filter((o) => !o.desabilitada),
    [opcoes],
  );
  const escolhida = opcoes.find((o) => o.valor === valor);

  const escolher = useCallback(
    (v: string) => {
      if (!controlado) setValorInterno(v);
      onChange?.(v);
      setAberto(false);
      botaoRef.current?.focus();
    },
    [controlado, onChange],
  );

  const abrir = useCallback(() => {
    if (disabled) return;
    const i = opcoes.findIndex((o) => o.valor === valor);
    setAtivo(i >= 0 ? i : opcoes.findIndex((o) => !o.desabilitada));
    setAberto(true);
  }, [disabled, opcoes, valor]);

  /** Recalcula a posição do painel a partir do gatilho. */
  const medir = useCallback(() => {
    const b = botaoRef.current;
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

  // Medido no layout, antes da pintura, para o painel não piscar no lugar
  // errado por um quadro.
  useLayoutEffect(() => {
    if (aberto) medir();
  }, [aberto, medir]);

  // Posição fixa não acompanha rolagem sozinha: sem isto o painel ficaria
  // parado na tela enquanto o campo sobe.
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

    const foraDaRaiz = (e: MouseEvent) => {
      const alvo = e.target as Node;
      // O painel está fora da raiz por causa do portal — precisa entrar na conta.
      if (raizRef.current?.contains(alvo) || listaRef.current?.contains(alvo)) return;
      setAberto(false);
    };
    // `mousedown` e não `click`: fechar no clique deixaria o painel aberto
    // durante uma seleção de texto que começou dentro dele.
    document.addEventListener("mousedown", foraDaRaiz);
    return () => document.removeEventListener("mousedown", foraDaRaiz);
  }, [aberto]);

  // Mantém a opção ativa visível ao navegar pelo teclado.
  useEffect(() => {
    if (!aberto || ativo < 0) return;
    listaRef.current
      ?.querySelector(`[data-indice="${ativo}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [aberto, ativo]);

  function moverPara(direcao: 1 | -1) {
    const total = opcoes.length;
    let i = ativo;
    for (let n = 0; n < total; n++) {
      i = (i + direcao + total) % total;
      if (!opcoes[i].desabilitada) break;
    }
    setAtivo(i);
  }

  /** Busca por digitação, como no nativo: "pl" salta para "Planejador". */
  function porDigitacao(tecla: string) {
    const agora = Date.now();
    const b = buscaRef.current;
    b.termo = agora - b.quando > 700 ? tecla : b.termo + tecla;
    b.quando = agora;

    const alvo = selecionavel.find((o) =>
      o.rotulo.toLowerCase().startsWith(b.termo.toLowerCase()),
    );
    if (!alvo) return;

    if (aberto) setAtivo(opcoes.indexOf(alvo));
    else escolher(alvo.valor);
  }

  function aoTeclar(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (!aberto) abrir();
        else moverPara(e.key === "ArrowDown" ? 1 : -1);
        return;
      case "Home":
      case "End":
        if (!aberto) return;
        e.preventDefault();
        setAtivo(
          e.key === "Home"
            ? opcoes.findIndex((o) => !o.desabilitada)
            : opcoes.length - 1 - [...opcoes].reverse().findIndex((o) => !o.desabilitada),
        );
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!aberto) abrir();
        else if (ativo >= 0 && !opcoes[ativo].desabilitada) escolher(opcoes[ativo].valor);
        return;
      case "Escape":
        if (aberto) {
          e.preventDefault();
          setAberto(false);
        }
        return;
      case "Tab":
        setAberto(false);
        return;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          porDigitacao(e.key);
        }
    }
  }

  const alturas = tamanho === "sm" ? "px-3 py-1.5 text-sm" : "px-3 py-2 text-sm";
  const Icone = escolhida?.icone;

  return (
    <div ref={raizRef} className={`relative ${className}`}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={valor}
          required={required}
          aria-hidden
        />
      )}

      <button
        ref={botaoRef}
        id={idBotao}
        type="button"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={aberto ? idLista : undefined}
        aria-haspopup="listbox"
        aria-activedescendant={aberto && ativo >= 0 ? `${autoId}-op-${ativo}` : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={aoTeclar}
        className={`w-full ${alturas} flex items-center gap-2 bg-white border rounded-lg font-inter text-left
          transition-shadow cursor-pointer
          ${aberto ? "border-transparent ring-2 ring-brand-300" : "border-slate-200 hover:border-slate-300"}
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:border-transparent
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:border-slate-200`}
        {...aria}
      >
        {Icone && <Icone className="w-4 h-4 shrink-0 text-slate-400" />}
        <span
          className={`flex-1 truncate ${escolhida ? "text-slate-800" : "text-slate-400"}`}
        >
          {escolhida?.rotulo ?? placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-150 ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Portal no `body`: dentro de um diálogo com `overflow-y-auto` — que é
          onde metade destes selects vive — um painel absoluto seria cortado
          pela borda do contêiner. Não precisa de guarda de montagem: `aberto`
          começa falso e só vira true depois de um clique, que não acontece no
          servidor. */}
      {aberto && caixa &&
        createPortal(
        <ul
          ref={listaRef}
          id={idLista}
          role="listbox"
          // Marca o portal como painel do produto: quem também fecha no clique
          // de fora (o DatePicker, por exemplo) precisa reconhecer este `ul`
          // como "dentro", já que ele mora no `body` e não na árvore do DOM.
          data-painel="select"
          aria-labelledby={aria["aria-labelledby"] ?? idBotao}
          style={{
            position: "fixed",
            left: caixa.esquerda,
            top: caixa.topo,
            bottom: caixa.base,
            minWidth: caixa.largura,
            maxWidth: "min(26rem, 92vw)",
            maxHeight: caixa.alturaMax,
          }}
          className="z-[100] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 select-painel"
        >
          {opcoes.map((o, i) => {
            const novoGrupo = o.grupo && o.grupo !== opcoes[i - 1]?.grupo;
            const selecionada = o.valor === valor;
            const OpcaoIcone = o.icone;

            return (
              <li key={`${o.grupo ?? ""}-${o.valor}`}>
                {novoGrupo && (
                  <div
                    role="presentation"
                    className="px-3 pt-2 pb-1 font-inter text-[0.68rem] font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {o.grupo}
                  </div>
                )}

                <div
                  id={`${autoId}-op-${i}`}
                  data-indice={i}
                  role="option"
                  aria-selected={selecionada}
                  aria-disabled={o.desabilitada || undefined}
                  // O ponteiro comanda o destaque, para que o mouse e o teclado
                  // nunca mostrem duas linhas ativas ao mesmo tempo.
                  onMouseEnter={() => !o.desabilitada && setAtivo(i)}
                  onClick={() => !o.desabilitada && escolher(o.valor)}
                  className={`mx-1.5 px-2.5 py-2 rounded-lg flex items-start gap-2.5 transition-colors
                    ${o.desabilitada ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                    ${ativo === i && !o.desabilitada ? "bg-brand-300/15" : ""}`}
                >
                  {OpcaoIcone && (
                    <OpcaoIcone
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        selecionada ? "text-brand-600" : "text-slate-400"
                      }`}
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-inter text-sm truncate ${
                        selecionada ? "text-brand-950 font-medium" : "text-slate-700"
                      }`}
                    >
                      {o.rotulo}
                    </p>
                    {o.descricao && (
                      <p className="font-inter text-xs text-slate-500 mt-0.5">
                        {o.descricao}
                      </p>
                    )}
                  </div>

                  <Check
                    className={`w-4 h-4 mt-0.5 shrink-0 text-brand-600 transition-opacity ${
                      selecionada ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              </li>
            );
          })}
        </ul>,
        document.body,
      )}
    </div>
  );
}
