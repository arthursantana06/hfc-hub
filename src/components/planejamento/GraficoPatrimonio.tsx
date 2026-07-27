"use client";

import { useId, useState } from "react";
import { formatCurrency } from "@/lib/types";

export interface PontoPatrimonio {
  rotulo: string;
  valor: number;
  marco?: string;
}

/**
 * Patrimônio projetado — série única, área e linha.
 *
 * Estoque, não fluxo: por isso vive separado do gráfico de fluxo em vez de
 * virar uma segunda escala lá dentro. Série única não leva legenda — o título
 * já diz o que está plotado.
 *
 * A linha do zero é desenhada sempre que a série a cruza. É a informação mais
 * importante desta tela e sumiria se o eixo fosse cortado no mínimo da série.
 */
export function GraficoPatrimonio({
  pontos,
  altura = 200,
}: {
  pontos: PontoPatrimonio[];
  altura?: number;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const grad = useId();

  if (pontos.length < 2) return null;

  const SLOT = Math.max(12, Math.min(30, Math.round(900 / pontos.length)));
  const L = 8;
  const largura = (pontos.length - 1) * SLOT;

  const valores = pontos.map((p) => p.valor);
  const teto = Math.max(...valores, 0);
  const piso = Math.min(...valores, 0);
  const amplitude = teto - piso || 1;
  const y = (v: number) => ((teto - v) / amplitude) * altura;
  const x = (i: number) => L + i * SLOT;

  const linha = pontos.map((p, i) => `${x(i)},${y(p.valor)}`).join(" ");
  const area = `${x(0)},${y(piso)} ${linha} ${x(pontos.length - 1)},${y(piso)}`;
  const cruzaZero = piso < 0 && teto > 0;
  const primeiroNegativo = pontos.findIndex((p) => p.valor < 0);
  const marcas = ticks(piso, teto);

  return (
    <figure className="m-0">
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="relative" style={{ width: largura + 72, minWidth: "100%" }}>
          <svg
            width={largura + 72}
            height={altura + 26}
            role="img"
            aria-label={`Patrimônio projetado de ${pontos[0].rotulo} a ${pontos[pontos.length - 1].rotulo}`}
            className="block"
          >
            <defs>
              <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#026694" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#026694" stopOpacity="0" />
              </linearGradient>
            </defs>

            {marcas.map((v) => (
              <g key={v}>
                <line
                  x1={L}
                  y1={y(v)}
                  x2={largura + L}
                  y2={y(v)}
                  stroke={v === 0 ? "#cbd5e1" : "#f1f5f9"}
                  strokeWidth="1"
                />
                <text
                  x={largura + L + 6}
                  y={y(v) + 4}
                  className="fill-slate-400"
                  style={{ fontSize: 10, fontVariantNumeric: "tabular-nums" }}
                >
                  {compacto(v)}
                </text>
              </g>
            ))}

            <polygon points={area} fill={`url(#${grad})`} />
            <polyline
              points={linha}
              fill="none"
              stroke="#026694"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {cruzaZero && primeiroNegativo > 0 && (
              <g>
                <circle
                  cx={x(primeiroNegativo)}
                  cy={y(pontos[primeiroNegativo].valor)}
                  r={4}
                  fill="#b91c1c"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={x(primeiroNegativo) + 8}
                  y={y(0) - 8}
                  className="fill-red-700"
                  style={{ fontSize: 10, fontWeight: 600 }}
                >
                  zera em {pontos[primeiroNegativo].rotulo}
                </text>
              </g>
            )}

            {/* Marcador só no fim da série — rótulo seletivo, não em todo ponto. */}
            <circle
              cx={x(pontos.length - 1)}
              cy={y(pontos[pontos.length - 1].valor)}
              r={4}
              fill="#026694"
              stroke="#ffffff"
              strokeWidth="2"
            />

            {ativo !== null && (
              <line
                x1={x(ativo)}
                y1={0}
                x2={x(ativo)}
                y2={altura}
                stroke="#94a3b8"
                strokeWidth="1"
              />
            )}

            {pontos.map((p, i) =>
              i % Math.ceil(pontos.length / 8) === 0 ? (
                <text
                  key={i}
                  x={x(i)}
                  y={altura + 18}
                  textAnchor="middle"
                  className="fill-slate-400"
                  style={{ fontSize: 10 }}
                >
                  {p.rotulo}
                </text>
              ) : null,
            )}

            {pontos.map((p, i) => (
              <rect
                key={`hit-${i}`}
                x={x(i) - SLOT / 2}
                y={0}
                width={SLOT}
                height={altura}
                fill="transparent"
                onMouseEnter={() => setAtivo(i)}
                onMouseLeave={() => setAtivo(null)}
              />
            ))}
          </svg>

          {ativo !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2"
              style={
                x(ativo) > largura - 120
                  ? { right: largura + 72 - x(ativo) + 8 }
                  : { left: x(ativo) + 8 }
              }
            >
              <p className="font-poppins text-sm font-medium text-brand-950">
                {pontos[ativo].rotulo}
              </p>
              <p
                className={`font-inter text-sm tabular-nums mt-0.5 ${
                  pontos[ativo].valor < 0 ? "text-red-700" : "text-slate-700"
                }`}
              >
                {formatCurrency(pontos[ativo].valor, 2)}
              </p>
              {pontos[ativo].marco && (
                <p className="font-inter text-xs text-brand-600 mt-1">
                  {pontos[ativo].marco}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </figure>
  );
}

function ticks(piso: number, teto: number): number[] {
  const passo = escala((teto - piso) / 4);
  const out: number[] = [];
  for (let v = Math.ceil(piso / passo) * passo; v <= teto; v += passo) {
    out.push(Math.round(v));
  }
  if (!out.includes(0) && piso <= 0 && teto >= 0) out.push(0);
  return out;
}

function escala(bruto: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(bruto) || 1)));
  const norm = bruto / mag;
  return (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
}

function compacto(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000)
    return `${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000)
    return `${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k`;
  return String(v);
}
