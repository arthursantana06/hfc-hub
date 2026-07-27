"use client";

import { useId, useState } from "react";
import { formatCurrency } from "@/lib/types";

export interface PontoFluxo {
  rotulo: string;
  entradas: number;
  saidas: number;
  sobras: number;
  marco?: string;
}

/**
 * Fluxo projetado mês a mês — entradas acima da linha, saídas abaixo.
 *
 * Duas séries e nenhum segundo eixo: entradas e saídas estão na mesma unidade
 * (R$/mês), então dividem a mesma escala. O patrimônio, que é estoque e não
 * fluxo, vive num gráfico separado — sobrepô-lo aqui exigiria um segundo eixo,
 * que é o jeito mais fácil de fazer um gráfico mentir.
 *
 * A polaridade em torno do zero é a codificação secundária que a cor sozinha
 * não daria: o par verde/vermelho tem separação para daltonismo no limite do
 * aceitável, e a posição resolve o resto.
 */
export function GraficoFluxo({
  pontos,
  altura = 200,
}: {
  pontos: PontoFluxo[];
  altura?: number;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const clip = useId();

  if (pontos.length === 0) return null;

  const SLOT = 30;
  const BARRA = 16;
  const RAIO = 4;
  const L = 8;
  const largura = pontos.length * SLOT;

  const teto = Math.max(...pontos.map((p) => p.entradas), 0);
  const piso = Math.min(...pontos.map((p) => -p.saidas), 0);
  const amplitude = teto - piso || 1;
  const y = (v: number) => ((teto - v) / amplitude) * altura;
  const zero = y(0);

  const marcas = ticks(piso, teto);

  return (
    <figure className="m-0 flex flex-col gap-3">
      <Legenda />

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="relative" style={{ width: largura + 72, minWidth: "100%" }}>
          <svg
            width={largura + 72}
            height={altura + 26}
            role="img"
            aria-label={`Fluxo projetado de ${pontos[0].rotulo} a ${pontos[pontos.length - 1].rotulo}`}
            className="block"
          >
            <defs>
              {/* Ponta arredondada só no topo da barra: o pé fica reto na linha
                  do zero, senão a barra parece flutuar. */}
              <clipPath id={`${clip}-cima`}>
                <rect x="0" y="0" width={largura + 72} height={zero} />
              </clipPath>
              <clipPath id={`${clip}-baixo`}>
                <rect x="0" y={zero} width={largura + 72} height={altura - zero + 1} />
              </clipPath>
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

            {pontos.map((p, i) => {
              const x = L + i * SLOT + (SLOT - BARRA) / 2;
              const destacado = ativo === i;
              return (
                <g key={i} opacity={ativo === null || destacado ? 1 : 0.35}>
                  <rect
                    x={x}
                    y={y(p.entradas)}
                    width={BARRA}
                    height={Math.max(1, zero - y(p.entradas))}
                    rx={RAIO}
                    fill="#047857"
                    clipPath={`url(#${clip}-cima)`}
                  />
                  <rect
                    x={x}
                    y={zero}
                    width={BARRA}
                    height={Math.max(1, y(-p.saidas) - zero)}
                    rx={RAIO}
                    fill="#b91c1c"
                    clipPath={`url(#${clip}-baixo)`}
                  />
                  {p.marco && (
                    <circle
                      cx={x + BARRA / 2}
                      cy={y(p.entradas) - 8}
                      r={3}
                      fill="#026694"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}

            {pontos.map((p, i) =>
              i % 3 === 0 ? (
                <text
                  key={i}
                  x={L + i * SLOT + SLOT / 2}
                  y={altura + 18}
                  textAnchor="middle"
                  className="fill-slate-400"
                  style={{ fontSize: 10 }}
                >
                  {p.rotulo}
                </text>
              ) : null,
            )}

            {/* Alvos de mouse maiores que as barras — a faixa inteira do mês. */}
            {pontos.map((p, i) => (
              <rect
                key={`hit-${i}`}
                x={L + i * SLOT}
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
            <Tooltip
              ponto={pontos[ativo]}
              esquerda={L + ativo * SLOT + SLOT / 2}
              largura={largura + 72}
            />
          )}
        </div>
      </div>
    </figure>
  );
}

function Legenda() {
  return (
    <div className="flex items-center gap-5 font-inter text-xs text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#047857" }} />
        Entradas
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#b91c1c" }} />
        Saídas
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full ring-2 ring-white"
          style={{ background: "#026694" }}
        />
        Marco do plano
      </span>
    </div>
  );
}

function Tooltip({
  ponto,
  esquerda,
  largura,
}: {
  ponto: PontoFluxo;
  esquerda: number;
  largura: number;
}) {
  // Vira para o lado de dentro quando chega perto da borda direita.
  const direita = esquerda > largura - 180;

  return (
    <div
      className="pointer-events-none absolute top-2 z-10 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 min-w-40"
      style={direita ? { right: largura - esquerda + 8 } : { left: esquerda + 8 }}
    >
      <p className="font-poppins text-sm font-medium text-brand-950">{ponto.rotulo}</p>
      <dl className="mt-1.5 flex flex-col gap-0.5 font-inter text-xs">
        <Par rotulo="Entradas" valor={ponto.entradas} cor="#047857" />
        <Par rotulo="Saídas" valor={-ponto.saidas} cor="#b91c1c" />
        <div className="flex justify-between gap-4 pt-1 mt-0.5 border-t border-slate-100">
          <dt className="text-slate-500">Sobras</dt>
          <dd
            className={`tabular-nums font-medium ${
              ponto.sobras >= 0 ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {formatCurrency(ponto.sobras, 2)}
          </dd>
        </div>
      </dl>
      {ponto.marco && (
        <p className="font-inter text-xs text-brand-600 mt-1.5">{ponto.marco}</p>
      )}
    </div>
  );
}

function Par({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <div className="flex justify-between gap-4 items-center">
      <dt className="text-slate-500 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: cor }} />
        {rotulo}
      </dt>
      <dd className="text-slate-700 tabular-nums">{formatCurrency(valor, 2)}</dd>
    </div>
  );
}

/** Cinco marcas em números redondos, sempre incluindo o zero. */
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
  if (abs >= 1_000_000) return `${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k`;
  return String(v);
}
