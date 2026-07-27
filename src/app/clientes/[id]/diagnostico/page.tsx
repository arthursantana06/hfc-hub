import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarRange, LineChart, Umbrella } from "lucide-react";
import { getMetas, getPlanInput, getProjection } from "@/lib/planning-dal";
import { anoDe, nomeDoMes, rotuloCurto } from "@/lib/planning/period";
import { formatCurrency } from "@/lib/types";
import { Card, Linha, SemPlano, Stat } from "@/components/planejamento/primitives";
import { GraficoFluxo } from "@/components/planejamento/GraficoFluxo";
import { GraficoPatrimonio } from "@/components/planejamento/GraficoPatrimonio";
import { TabelaProjecao } from "@/components/planejamento/TabelaProjecao";

export default async function Diagnostico({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [plan, proj, metas] = await Promise.all([
    getPlanInput(id),
    getProjection(id),
    getMetas(id),
  ]);

  return (
    <>
      <header className="p-8 pb-6 shrink-0 border-b border-slate-200/60 bg-white shadow-sm z-0">
        <h1 className="font-poppins font-medium text-2xl text-brand-950">
          Diagnóstico &amp; Metas
        </h1>
        <p className="font-inter text-sm text-slate-500 mt-1">
          Projeção mês a mês, ano a ano e até o fim do horizonte.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {!plan || !proj ? (
          <SemPlano clienteId={id} />
        ) : (
          <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {!metas && (
              <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-brand-600 shadow-sm px-6 py-4 flex items-center justify-between gap-6 flex-wrap">
                <p className="font-inter text-sm text-slate-600 max-w-2xl">
                  Esta projeção ainda não foi congelada como meta. Enquanto isso
                  não acontece, não há contra o que medir os meses — o alvo se
                  moveria junto com o cliente.
                </p>
                <Link
                  href={`/clientes/${id}/relatorios`}
                  className="inline-flex items-center gap-1.5 font-inter text-sm text-brand-600 hover:text-brand-900 transition-colors shrink-0"
                >
                  Congelar as metas
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
            <Aposentadoria proj={proj} />
            <Curta proj={proj} />
            <Longa proj={proj} />
          </div>
        )}
      </div>
    </>
  );
}

type Proj = NonNullable<Awaited<ReturnType<typeof getProjection>>>;

function Aposentadoria({ proj }: { proj: Proj }) {
  const d = proj.desfecho;
  const cobertura = d.rendaDesejada > 0 ? d.rendaTotal / d.rendaDesejada : null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Stat
          rotulo={`Patrimônio em ${d.anoAposentadoria}`}
          valor={formatCurrency(d.patrimonioNaAposentadoria, 0)}
          hint={`aos ${d.idadeAlvo} anos`}
        />
        <Stat
          rotulo="Renda na aposentadoria"
          valor={formatCurrency(d.rendaTotal, 2)}
          tom={cobertura !== null && cobertura >= 1 ? "bom" : "atencao"}
          hint={
            cobertura !== null
              ? `${(cobertura * 100).toFixed(0)}% da renda desejada`
              : undefined
          }
        />
        <Stat
          rotulo="Renda desejada"
          valor={formatCurrency(d.rendaDesejada, 2)}
          hint={
            d.rendaDesejada > d.rendaTotal
              ? `faltam ${formatCurrency(d.rendaDesejada - d.rendaTotal, 2)}`
              : "coberta"
          }
        />
        <Stat
          rotulo="O dinheiro acaba"
          valor={d.anoDeRuina ? `${d.anoDeRuina}` : "não acaba"}
          tom={d.anoDeRuina ? "ruim" : "bom"}
          hint={d.idadeDeRuina ? `aos ${d.idadeDeRuina} anos` : "dentro do horizonte"}
        />
      </div>

      {d.anoDeRuina !== null && (
        <div className="bg-white rounded-xl border border-red-200 border-l-4 border-l-red-500 shadow-sm p-6 flex items-start gap-4">
          <div className="p-2 bg-red-50 rounded-lg text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-poppins text-lg text-brand-950 font-medium">
              O patrimônio zera aos {d.idadeDeRuina} anos
            </h2>
            <p className="font-inter text-sm text-slate-600 mt-1 max-w-3xl">
              Depois de {d.anoAposentadoria} a renda cai para os{" "}
              {formatCurrency(d.rendaInss, 2)} do INSS, enquanto o custo de vida
              projetado continua. A diferença sai do patrimônio todo ano, e ele
              se esgota em {d.anoDeRuina}. Adiar a aposentadoria, cortar o custo
              projetado ou elevar o aporte mensal são as três alavancas.
            </p>
          </div>
        </div>
      )}

      <Card titulo="Composição da renda na aposentadoria" icone={Umbrella} tom="roxo">
        <Linha nome="INSS" detalhe="renda declarada no plano" valor={d.rendaInss} />
        <Linha
          nome="Renda privada"
          detalhe="rendimento real de um mês do patrimônio acumulado"
          valor={d.rendaPrivada}
        />
        <Linha nome="Total" valor={d.rendaTotal} destaque />
        <p className="font-inter text-xs text-slate-400 mt-4">
          A renda privada é o quanto o patrimônio rende por mês sem consumir o
          principal. Ela não é sacada na projeção — o modelo saca o déficit
          inteiro, que é por isso que o patrimônio cai mesmo com renda positiva.
        </p>
      </Card>
    </>
  );
}

function Curta({ proj }: { proj: Proj }) {
  return (
    <>
      <Card titulo={`Fluxo projetado — ${proj.curta.length} meses`} icone={CalendarRange}>
        <GraficoFluxo
          pontos={proj.curta.map((m) => ({
            rotulo: rotuloCurto(m.periodo),
            entradas: m.receitas,
            saidas: -(m.despesas + m.dividas + m.previdencia),
            sobras: m.sobras,
            marco: m.observacoes[0],
          }))}
        />
      </Card>

      <Card titulo="Patrimônio nos mesmos meses" icone={LineChart} tom="brand">
        <GraficoPatrimonio
          pontos={proj.curta.map((m) => ({
            rotulo: rotuloCurto(m.periodo),
            valor: m.patrimonio,
            marco: m.observacoes[0],
          }))}
        />
        <TabelaProjecao
          rotulo="mês"
          linhas={proj.curta.map((m) => ({
            chave: String(m.periodo),
            rotulo: `${nomeDoMes(m.periodo).slice(0, 3)}/${String(anoDe(m.periodo) % 100)}`,
            marco: m.observacoes.join(", "),
            valores: [
              m.receitas,
              m.despesas,
              m.dividas,
              m.sobras,
              m.objetivos,
              m.patrimonio,
            ],
          }))}
          colunas={["Receitas", "Despesas", "Dívidas", "Sobras", "Objetivos", "Patrimônio"]}
        />
      </Card>
    </>
  );
}

function Longa({ proj }: { proj: Proj }) {
  return (
    <Card titulo="Projeção longa — até a aposentadoria" icone={LineChart}>
      <GraficoPatrimonio
        pontos={proj.longa.map((y) => ({
          rotulo: String(y.ano),
          valor: y.patrimonio,
        }))}
      />
      <TabelaProjecao
        rotulo="ano"
        linhas={proj.longa.map((y) => ({
          chave: String(y.ano),
          rotulo: String(y.ano),
          marco: `${y.idade} anos`,
          valores: [y.receitas, y.despesas, y.dividas, y.sobras, y.objetivos, y.patrimonio],
        }))}
        colunas={["Receitas", "Despesas", "Dívidas", "Sobras", "Objetivos", "Patrimônio"]}
      />
    </Card>
  );
}
