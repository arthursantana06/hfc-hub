import { Logo } from "@/components/layout/Logo";

/** Palavras-chave que giram ao redor da marca. */
const KEYWORDS = [
  "CRM integrado",
  "Agenda",
  "CRM de Investimento",
  "Análise de Investimento",
  "Rewards",
  "Relatórios",
];

const RADIUS = 162;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/*
 * O texto é escrito uma vez ao longo do círculo e esticado com `textLength`
 * para fechar exatamente a volta — assim a lista de palavras pode mudar de
 * tamanho sem sobrar buraco nem estourar o começo por cima do fim.
 */
const RING_TEXT = `${KEYWORDS.join(" · ")} · `.toUpperCase();

// Arco completo começando no topo (12 h) e seguindo em sentido horário.
const RING_PATH = `M 200 ${200 - RADIUS} a ${RADIUS} ${RADIUS} 0 1 1 -0.01 0`;

/**
 * Marca do HFC em disco claro, com as palavras-chave do produto girando em
 * volta como uma roda. Puramente decorativo (`aria-hidden`) — o nome do
 * produto já é anunciado pelo wordmark do cabeçalho.
 */
export function BrandOrbit() {
  return (
    <div
      aria-hidden
      className="relative w-full max-w-[26rem] aspect-square mx-auto select-none"
    >
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
        <defs>
          <path id="brand-orbit-path" d={RING_PATH} fill="none" />
        </defs>

        {/* Anéis de apoio: dão profundidade e amarram a roda ao disco. */}
        <circle cx="200" cy="200" r="194" className="fill-none stroke-brand-300/15" strokeWidth="1" />
        <circle cx="200" cy="200" r="140" className="fill-none stroke-brand-300/20" strokeWidth="1" />

        <g className="brand-orbit-ring">
          <text
            className="fill-brand-300 font-outfit"
            fontSize="13"
            fontWeight="500"
          >
            <textPath
              href="#brand-orbit-path"
              startOffset="0"
              textLength={CIRCUMFERENCE}
              lengthAdjust="spacing"
            >
              {RING_TEXT}
            </textPath>
          </text>
        </g>
      </svg>

      {/* Disco claro + marca, parados no centro da roda. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[62%] w-[62%] rounded-full bg-white shadow-[0_0_60px_-12px_rgba(130,189,212,0.45)] flex items-center justify-center">
          <Logo size="lg" className="w-[74%] h-auto" />
        </div>
      </div>
    </div>
  );
}
