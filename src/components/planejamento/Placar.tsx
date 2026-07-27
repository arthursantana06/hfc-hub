import { formatCurrency } from "@/lib/types";
import type { ScoreLine } from "@/lib/planning/scorecard";

/**
 * O placar do mês — realizado contra meta, com a nota.
 *
 * As estrelas são acompanhadas do percentual e da leitura em texto: nota
 * sozinha não diz o que aconteceu, e a régua (desvio da meta, não percentual
 * atingido) não é óbvia para quem só olha o gráfico.
 */
export function Placar({ linhas }: { linhas: ScoreLine[] }) {
  if (linhas.length === 0) {
    return (
      <p className="font-inter text-sm text-slate-500">
        Este mês está fora da janela projetada pelo plano.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {linhas.map((l) => (
        <div
          key={l.metrica}
          className="border border-slate-200 rounded-xl p-4 flex flex-col gap-1"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-inter text-sm font-medium text-slate-700">
              {l.rotulo}
            </span>
            <Estrelas quantas={l.estrelas} rotulo={l.rotulo} />
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <span className="font-poppins text-lg text-brand-950 tabular-nums">
              {formatCurrency(l.realizado, 0)}
            </span>
            <span className="font-inter text-xs text-slate-400 tabular-nums">
              meta {formatCurrency(l.meta, 0)}
              {l.atingido !== null && (
                <span className="ml-2 text-slate-500">
                  {(l.atingido * 100).toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })}
                  %
                </span>
              )}
            </span>
          </div>

          <p className="font-inter text-xs text-slate-500 mt-1">{l.leitura}</p>
        </div>
      ))}
    </div>
  );
}

function Estrelas({ quantas, rotulo }: { quantas: number; rotulo: string }) {
  return (
    <span
      className="shrink-0 tracking-tight"
      role="img"
      aria-label={`${rotulo}: ${quantas} de 5 estrelas`}
    >
      <span className="text-amber-500">{"★".repeat(quantas)}</span>
      <span className="text-slate-200">{"★".repeat(5 - quantas)}</span>
    </span>
  );
}
