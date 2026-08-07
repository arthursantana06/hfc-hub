import { Suspense } from "react";
import { AbasPlanejamento } from "@/components/planejamento/AbasPlanejamento";
import { listPeriodos } from "@/lib/planning-dal";

/**
 * O espaço de trabalho do planejador — remodelado.
 *
 * Três planejamentos por cliente (Pré-HFC, HFC e Real), cada um com as mesmas
 * oito seções, editadas em tabelas tipo planilha. O Pré-HFC e o HFC são
 * retratos; o Real é a série de períodos que o Acompanhamento edita — e é só
 * nele que o seletor de período aparece.
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
        <div className="mb-4">
          <h1 className="font-poppins font-medium text-2xl text-brand-950">
            Planejamento
          </h1>
          <p className="font-inter text-sm text-slate-500 mt-0.5">
            A base de dados do cliente — antes, no plano e no realizado.
          </p>
        </div>

        {/* `usePathname`/`useSearchParams` exigem um limite de Suspense para não
            obrigar a rota inteira a renderizar sob demanda. */}
        <Suspense fallback={null}>
          <AbasPlanejamento
            clienteId={id}
            periodos={periodos.map((p) => ({
              id: p.id,
              versao: p.versao,
              inicio: p.inicio,
              status: p.status,
            }))}
          />
        </Suspense>
      </header>

      <div className="flex-1 overflow-y-auto p-8 relative">{children}</div>
    </>
  );
}
