import { Suspense } from "react";
import { TabLink } from "@/components/layout/TabLink";
import { SeletorPeriodo } from "@/components/planejamento/SeletorPeriodo";
import { listPeriodos } from "@/lib/planning-dal";

function getTabs(id: string) {
  return [
    { href: `/clientes/${id}/planejamento`, label: "Visão Geral" },
    { href: `/clientes/${id}/planejamento/fluxo-de-caixa`, label: "Fluxo de Caixa" },
    { href: `/clientes/${id}/planejamento/patrimonio`, label: "Patrimônio" },
    { href: `/clientes/${id}/planejamento/objetivos`, label: "Objetivos e Mudanças" },
  ];
}

/**
 * O espaço de trabalho do planejador.
 *
 * Era o "Ponto de Partida", uma tela que só fazia sentido uma vez na vida do
 * cliente. Agora é a ferramenta usada em toda reunião: o filtro de período no
 * canto escolhe qual retrato está na tela, e o Ponto de Partida virou
 * simplesmente o primeiro deles.
 */
export default async function PlanejamentoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const periodos = await listPeriodos(id);

  return (
    <>
      <header className="p-8 pb-0 shrink-0 bg-white border-b border-slate-200 shadow-sm flex flex-col">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="font-poppins font-medium text-2xl text-brand-950">
              Planejamento
            </h1>
            <p className="font-inter text-sm text-slate-500 mt-0.5">
              O retrato do período — e o que muda nele.
            </p>
          </div>

          {/* `useSearchParams` exige um limite de Suspense para não obrigar a
              rota inteira a renderizar sob demanda. */}
          <Suspense fallback={null}>
            <SeletorPeriodo
              clientId={id}
              periodos={periodos.map((p) => ({
                id: p.id,
                versao: p.versao,
                inicio: p.inicio,
                status: p.status,
              }))}
            />
          </Suspense>
        </div>

        {/* Abas Horizontais */}
        <div className="mt-6 flex gap-8 overflow-x-auto">
          {getTabs(id).map((tab) => (
            <TabLink key={tab.href} href={tab.href} label={tab.label} />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 relative">{children}</div>
    </>
  );
}
