import { AlertTriangle, LineChart, Settings2 } from "lucide-react";
import { getPlanInput } from "@/lib/planning-dal";
import { project, type ProjectionResult } from "@/lib/planning/project";
import { anoDe, nomeDoMes, rotuloCurto } from "@/lib/planning/period";
import type { PlanInput } from "@/lib/planning/types";
import { formatCurrency } from "@/lib/types";
import { Card, Stat } from "@/components/planejamento/primitives";
import { FluxoProjetado } from "@/components/planejamento/FluxoProjetado";
import { GraficoPatrimonio } from "@/components/planejamento/GraficoPatrimonio";
import { TabelaProjecao } from "@/components/planejamento/TabelaProjecao";
import { FormularioPlano } from "@/components/planejamento/FormularioPlano";
import type { SecaoProps } from "./tipos";

/**
 * Projeção — o motor rodando sobre ESTE planejamento.
 *
 * Pré-HFC, HFC e Real têm cada um a própria projeção: é o que permite comparar
 * o futuro que o cliente tinha antes da consultoria com o que o plano desenha.
 * No Real, a projeção parte do período aberto na tela (o `inicio` dele).
 *
 * As premissas moram aqui porque só fazem diferença aqui — mexer em juros não
 * muda nenhuma linha digitada, muda o futuro que esta tela mostra.
 */
export async function SecaoProjecao({ clienteId, plano }: SecaoProps) {
  const plan = await getPlanInput(clienteId, plano.id);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {plan ? (
        <Projecao plan={plan} />
      ) : (
        <div className="bg-white rounded-xl border border-amber-200 border-l-4 border-l-amber-400 shadow-sm p-6">
          <p className="font-inter text-sm text-slate-600">
            Para projetar, o cadastro do cliente precisa da data de nascimento —
            é ela que diz quando a aposentadoria começa.
          </p>
        </div>
      )}

      <Card titulo="Premissas deste planejamento" icone={Settings2}>
        <FormularioPlano clientId={clienteId} plano={plano} />
      </Card>
    </div>
  );
}

function Projecao({ plan }: { plan: PlanInput }) {
  // As duas leituras do mesmo plano. Projetar duas vezes custa menos de dois
  // milissegundos e evita mandar o motor para o navegador só para alternar.
  const nominal = project(comModo(plan, "nominal"));
  const real = project(comModo(plan, "real"));
  const proj = plan.assumptions.modoValor === "real" ? real : nominal;
  const d = proj.desfecho;

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
          tom={d.rendaDesejada > 0 && d.rendaTotal >= d.rendaDesejada ? "bom" : "atencao"}
          hint={
            d.rendaDesejada > 0
              ? `${((d.rendaTotal / d.rendaDesejada) * 100).toFixed(0)}% da desejada`
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
          <p className="font-inter text-sm text-slate-600 max-w-3xl">
            Neste planejamento o patrimônio zera em {d.anoDeRuina}, aos{" "}
            {d.idadeDeRuina} anos. Adiar a aposentadoria, cortar o custo
            projetado ou elevar o aporte mensal são as três alavancas.
          </p>
        </div>
      )}

      <FluxoProjetado
        modoDoPlano={plan.assumptions.modoValor}
        inflacao={plan.assumptions.inflacao}
        nominal={nominal.meses.map(paraMes)}
        real={real.meses.map(paraMes)}
      />

      <Card titulo="Projeção longa — até a aposentadoria" icone={LineChart}>
        <GraficoPatrimonio
          pontos={proj.longa.map((y) => ({ rotulo: String(y.ano), valor: y.patrimonio }))}
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
    </>
  );
}

const comModo = (plan: PlanInput, modoValor: "nominal" | "real"): PlanInput => ({
  ...plan,
  assumptions: { ...plan.assumptions, modoValor },
});

const paraMes = (m: ProjectionResult["meses"][number]) => ({
  periodo: m.periodo,
  rotulo: `${nomeDoMes(m.periodo)} de ${anoDe(m.periodo)}`,
  rotuloCurto: rotuloCurto(m.periodo),
  ano: anoDe(m.periodo),
  receitas: m.receitas,
  despesas: m.despesas,
  dividas: m.dividas,
  previdencia: m.previdencia,
  sobras: m.sobras,
  objetivos: m.objetivos,
  patrimonio: m.patrimonio,
  marco: m.observacoes[0],
});
