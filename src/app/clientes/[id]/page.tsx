import Link from "next/link";
import { AlertTriangle, ArrowRight, PieChart, Target } from "lucide-react";
import { getClient, getPlanInput, getProjection } from "@/lib/planning-dal";
import { summarizeBaseline } from "@/lib/planning/baseline";
import { anoDe, nomeDoMes, rotuloCurto } from "@/lib/planning/period";
import { formatCurrency } from "@/lib/types";
import { Card, Linha, SemPlano, Stat } from "@/components/planejamento/primitives";
import { GraficoPatrimonio } from "@/components/planejamento/GraficoPatrimonio";

export default async function ResumoDoCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, plan, proj] = await Promise.all([
    getClient(id),
    getPlanInput(id),
    getProjection(id),
  ]);

  return (
    <>
      <header className="p-8 pb-6 shrink-0 flex justify-between items-end gap-6 border-b border-slate-200/60 bg-white shadow-sm z-0">
        <h1 className="font-poppins font-medium text-2xl text-brand-950">Dashboard</h1>
        {plan && (
          <p className="font-inter text-sm text-slate-500">
            Período de {nomeDoMes(plan.assumptions.inicio).toLowerCase()}/
            {anoDe(plan.assumptions.inicio)}
          </p>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {!plan || !proj ? (
          <SemPlano clienteId={id} />
        ) : (
          <Conteudo id={id} plan={plan} proj={proj} patrimonio={client?.patrimonio ?? 0} />
        )}
      </div>
    </>
  );
}

function Conteudo({
  id,
  plan,
  proj,
  patrimonio,
}: {
  id: string;
  plan: NonNullable<Awaited<ReturnType<typeof getPlanInput>>>;
  proj: NonNullable<Awaited<ReturnType<typeof getProjection>>>;
  patrimonio: number;
}) {
  const base = summarizeBaseline(plan);
  const d = proj.desfecho;
  const faltaParaDesejada = d.rendaDesejada - d.rendaTotal;

  const doze = proj.curta.slice(0, 12);
  const proximosEventos = proj.curta
    .filter((m) => m.observacoes.length > 0)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Stat
          rotulo="Patrimônio líquido"
          valor={formatCurrency(patrimonio, 2)}
          hint="bens e carteira, menos passivos e dívidas"
        />
        <Stat
          rotulo="Capacidade de poupança"
          valor={`${formatCurrency(base.sobrasMensais, 2)}`}
          tom={base.sobrasMensais >= 0 ? "bom" : "ruim"}
          hint="por mês, no mês típico"
        />
        <Stat
          rotulo={`Patrimônio aos ${d.idadeAlvo}`}
          valor={formatCurrency(d.patrimonioNaAposentadoria, 0)}
          hint={`projetado para ${d.anoAposentadoria}`}
        />
      </div>

      {/* O achado mais acionável do modelo inteiro — não pode ficar numa linha
          perdida de tabela, como ficava na planilha. */}
      {d.anoDeRuina !== null && (
        <div className="bg-white rounded-xl border border-red-200 border-l-4 border-l-red-500 shadow-sm p-6 flex items-start gap-4">
          <div className="p-2 bg-red-50 rounded-lg text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-poppins text-lg text-brand-950 font-medium">
              O patrimônio zera em {d.anoDeRuina}, aos {d.idadeDeRuina} anos
            </h2>
            <p className="font-inter text-sm text-slate-600 mt-1 max-w-2xl">
              Com as premissas atuais, a renda do INSS de{" "}
              {formatCurrency(d.rendaInss, 2)} não cobre o custo de vida
              projetado, e a diferença é sacada do patrimônio até acabar.
              {faltaParaDesejada > 0 && (
                <>
                  {" "}
                  A renda total na aposentadoria fica em{" "}
                  {formatCurrency(d.rendaTotal, 2)} — {formatCurrency(faltaParaDesejada, 2)}{" "}
                  abaixo dos {formatCurrency(d.rendaDesejada, 2)} desejados.
                </>
              )}
            </p>
            <Link
              href={`/clientes/${id}/acompanhamento`}
              className="inline-flex items-center gap-1.5 mt-3 font-inter text-sm text-brand-600 hover:text-brand-900 transition-colors"
            >
              Ver o diagnóstico completo
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card titulo="Patrimônio nos próximos 12 meses" icone={PieChart}>
          <GraficoPatrimonio
            altura={160}
            pontos={doze.map((m) => ({
              rotulo: rotuloCurto(m.periodo),
              valor: m.patrimonio,
              marco: m.observacoes[0],
            }))}
          />
          <div className="mt-4 flex flex-col">
            <Linha
              nome="Hoje"
              valor={plan.patrimonioInicial}
              detalhe="carteira investida"
            />
            <Linha
              nome={`Em ${rotuloCurto(doze[doze.length - 1].periodo)}`}
              valor={doze[doze.length - 1].patrimonio}
              destaque
            />
          </div>
        </Card>

        <Card titulo="Próximos marcos" icone={Target}>
          {proximosEventos.length === 0 ? (
            <p className="font-inter text-sm text-slate-500">
              Nenhum marco nos próximos meses.
            </p>
          ) : (
            proximosEventos.map((m) => (
              <Linha
                key={m.periodo}
                nome={m.observacoes.join(", ")}
                detalhe={`${nomeDoMes(m.periodo)} de ${anoDe(m.periodo)}`}
                valor={m.objetivos !== 0 ? m.objetivos : m.sobras}
              />
            ))
          )}
          <Link
            href={`/clientes/${id}/planejamento/objetivos`}
            className="inline-flex items-center gap-1.5 mt-4 font-inter text-sm text-brand-600 hover:text-brand-900 transition-colors"
          >
            Ver objetivos e mudanças
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </div>
    </div>
  );
}
