import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarPlus,
  FileText,
  LineChart,
  Snowflake,
  Umbrella,
} from "lucide-react";
import {
  getMetas,
  getPlanInput,
  getPlanoAtivo,
  listRegistrosMensais,
} from "@/lib/planning-dal";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { hashDoPlano, project, type ProjectionResult } from "@/lib/planning/project";
import { anoDe, mesDe, nomeDoMes, rotuloCurto, toISO } from "@/lib/planning/period";
import type { PlanInput } from "@/lib/planning/types";
import { formatCurrency } from "@/lib/types";
import { Card, Linha, SemPlano, Stat } from "@/components/planejamento/primitives";
import { FluxoProjetado } from "@/components/planejamento/FluxoProjetado";
import { GraficoPatrimonio } from "@/components/planejamento/GraficoPatrimonio";
import { TabelaProjecao } from "@/components/planejamento/TabelaProjecao";
import {
  BotaoCongelarMetas,
  FormularioAbrirMes,
} from "@/components/planejamento/AcoesMes";

/**
 * Acompanhamento: o diagnóstico e o fechamento mensal na mesma tela.
 *
 * Eram duas abas — "Diagnóstico & Metas" e "Relatórios" — e a divisão obrigava
 * o planejador a saltar entre elas para responder a uma pergunta só: como o
 * cliente está indo contra o que combinamos. O alvo e a medição agora ficam
 * juntos, na ordem em que se conversa sobre eles.
 */
export default async function Acompanhamento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await verifySession();
  const supabase = await createClient();

  const [plan, plano, metas, registros, relatorios] = await Promise.all([
    getPlanInput(id),
    getPlanoAtivo(id),
    getMetas(id),
    listRegistrosMensais(id),
    supabase
      .from("report")
      .select("*")
      .eq("client_id", id)
      .order("ref_mes", { ascending: false }),
  ]);

  return (
    <>
      <header className="p-8 pb-6 shrink-0 border-b border-slate-200/60 bg-white shadow-sm z-0">
        <h1 className="font-poppins font-medium text-2xl text-brand-950">
          Acompanhamento
        </h1>
        <p className="font-inter text-sm text-slate-500 mt-1">
          A projeção do plano e o que cada mês devolveu dela.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {!plan ? (
          <SemPlano clienteId={id} />
        ) : (
          <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            <Projecao plan={plan} />
            <Fechamento
              clientId={id}
              plan={plan}
              planoId={plano?.id ?? null}
              inicioPlano={plano?.inicio ?? null}
              metas={metas}
              registros={registros}
              relatorios={relatorios.data ?? []}
            />
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Projeção
// ─────────────────────────────────────────────────────────────

function Projecao({ plan }: { plan: PlanInput }) {
  // As duas leituras do mesmo plano. Projetar duas vezes custa menos de dois
  // milissegundos e evita mandar o motor para o navegador só para alternar uma
  // visão.
  const nominal = project(comModo(plan, "nominal"));
  const real = project(comModo(plan, "real"));
  const proj = plan.assumptions.modoValor === "real" ? real : nominal;

  return (
    <>
      <Aposentadoria proj={proj} />
      <FluxoProjetado
        modoDoPlano={plan.assumptions.modoValor}
        inflacao={plan.assumptions.inflacao}
        nominal={nominal.meses.map(paraMes)}
        real={real.meses.map(paraMes)}
      />
      <Longa proj={proj} />
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

function Aposentadoria({ proj }: { proj: ProjectionResult }) {
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

function Longa({ proj }: { proj: ProjectionResult }) {
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

// ─────────────────────────────────────────────────────────────
// Fechamento mensal
// ─────────────────────────────────────────────────────────────

type Registro = Awaited<ReturnType<typeof listRegistrosMensais>>[number];
type Relatorio = { ref_mes: string | null; status: string };

function Fechamento({
  clientId,
  plan,
  planoId,
  inicioPlano,
  metas,
  registros,
  relatorios,
}: {
  clientId: string;
  plan: PlanInput;
  planoId: string | null;
  inicioPlano: string | null;
  metas: Awaited<ReturnType<typeof getMetas>>;
  registros: Registro[];
  relatorios: Relatorio[];
}) {
  const porMes = new Map(relatorios.map((r) => [r.ref_mes ?? "", r]));

  // O plano mudou desde que as metas foram congeladas?
  const desatualizado =
    metas !== null && metas.hash !== null && metas.hash !== hashDoPlano(plan);

  const sugestao = proximoMesAberto(
    inicioPlano,
    registros.map((r) => r.ref_mes),
  );

  return (
    <>
      <Card titulo="Metas do plano" icone={Snowflake} tom="roxo">
        <div className="flex flex-col gap-4">
          <p className="font-inter text-sm text-slate-600 max-w-2xl">
            {metas
              ? `Metas congeladas em ${new Date(metas.geradoEm).toLocaleDateString("pt-BR")}${
                  metas.rotulo ? ` — ${metas.rotulo}` : ""
                }. É contra elas que cada mês é medido.`
              : "Nenhuma meta congelada ainda. Sem elas o placar do mês não tem contra o que comparar — é o primeiro passo do acompanhamento."}
          </p>

          {desatualizado && (
            <p className="font-inter text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 max-w-2xl">
              O plano mudou desde que as metas foram congeladas. Isso é legítimo
              — a meta é histórica de propósito — mas vale saber que os meses
              novos serão medidos contra um alvo anterior às mudanças.
            </p>
          )}

          <BotaoCongelarMetas clientId={clientId} jaCongelado={metas !== null} />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card titulo="Abrir um mês" icone={CalendarPlus}>
          <FormularioAbrirMes
            clientId={clientId}
            planId={planoId}
            sugestao={sugestao}
          />
        </Card>

        <Card titulo="Meses acompanhados" icone={FileText} tom="brand">
          {registros.length === 0 ? (
            <p className="font-inter text-sm text-slate-500">Nenhum mês aberto ainda.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {registros.map((r) => {
                const rel = porMes.get(r.ref_mes);
                const publicado = rel?.status === "publicado";
                return (
                  <Link
                    key={r.id}
                    href={`/clientes/${clientId}/relatorios/${r.ref_mes.slice(0, 7)}`}
                    className="group flex items-center gap-4 px-3 py-3 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-inter text-sm font-medium text-brand-950">
                        {rotulo(r.ref_mes)}
                      </p>
                      <p className="font-inter text-xs text-slate-500 mt-0.5">
                        {publicado
                          ? `Publicado${r.fechado_em ? ` em ${new Date(r.fechado_em).toLocaleDateString("pt-BR")}` : ""}`
                          : "Rascunho"}
                      </p>
                    </div>
                    <span
                      className={`font-inter text-xs px-2.5 py-1 rounded-full font-medium ${
                        publicado
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {publicado ? "Publicado" : "Rascunho"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

const rotulo = (iso: string) =>
  `${nomeDoMes(Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1)} de ${iso.slice(0, 4)}`;

/**
 * Primeiro mês do plano que ainda não foi aberto.
 *
 * Evita que o planejador tenha de lembrar em que mês parou — e evita o erro
 * mais comum, que é abrir de novo um mês já fechado.
 */
function proximoMesAberto(inicioPlano: string | null, abertos: string[]): string {
  const usados = new Set(abertos.map((d) => d.slice(0, 7)));
  if (!inicioPlano) return "";

  let p = Number(inicioPlano.slice(0, 4)) * 12 + Number(inicioPlano.slice(5, 7)) - 1;
  for (let i = 0; i < 240; i++) {
    const chave = toISO(p).slice(0, 7);
    if (!usados.has(chave)) return chave;
    p++;
  }
  return `${anoDe(p)}-${String(mesDe(p)).padStart(2, "0")}`;
}
