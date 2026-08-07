import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, FileText, Target } from "lucide-react";
import {
  getPlanInput,
  getPlanejamento,
  getPlanoDoPeriodo,
  listPeriodos,
  listRegistrosMensais,
} from "@/lib/planning-dal";
import { project } from "@/lib/planning/project";
import { buildScorecard } from "@/lib/planning/scorecard";
import { fromISO, nomeDoMes, anoDe } from "@/lib/planning/period";
import { Card } from "@/components/planejamento/primitives";
import { Placar } from "@/components/planejamento/Placar";
import { SeletorPeriodo } from "@/components/planejamento/SeletorPeriodo";
import { SecaoReceita } from "@/components/planejamento/secoes/SecaoReceita";
import { SecaoDespesa } from "@/components/planejamento/secoes/SecaoDespesa";
import { SecaoCartao } from "@/components/planejamento/secoes/SecaoCartao";

export const metadata = { title: "Acompanhamento — HFC Hub" };

/** As seções que não mudam toda reunião ficam a um clique, não na rolagem. */
const OUTRAS_SECOES = [
  { slug: "ativos", rotulo: "Ativos" },
  { slug: "passivos", rotulo: "Passivos" },
  { slug: "investimentos", rotulo: "Investimentos" },
  { slug: "objetivos", rotulo: "Objetivos e Mudanças" },
  { slug: "projecao", rotulo: "Projeção" },
];

/**
 * Acompanhamento: a página que o planejador abre durante a reunião.
 *
 * Duas coisas, na ordem em que a conversa acontece. Primeiro a **síntese**:
 * como o mês ficou contra o que foi combinado no HFC, com as quatro métricas e
 * as estrelas — que agora saem de uma régua e não mais da digitação à mão da
 * planilha. Depois a **edição do período**, para ajustar o que o cliente conta
 * enquanto conta.
 *
 * Só Receita, Despesa e Cartão vêm embutidas: são as que mudam em toda reunião.
 * Empilhar as oito faria a síntese sumir da tela no primeiro rolar, e é ela que
 * dá o assunto da conversa.
 */
export default async function Acompanhamento({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string }>;
}) {
  const [{ id }, { periodo }] = await Promise.all([params, searchParams]);

  const [hfc, periodos] = await Promise.all([
    getPlanejamento(id, "hfc"),
    listPeriodos(id),
  ]);

  const real = periodo
    ? ((await getPlanoDoPeriodo(id, periodo))?.tipo === "real"
        ? await getPlanoDoPeriodo(id, periodo)
        : await getPlanejamento(id, "real"))
    : await getPlanejamento(id, "real");

  return (
    <>
      <header className="p-8 pb-6 shrink-0 border-b border-slate-200/60 bg-white shadow-sm z-0">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="font-poppins font-medium text-2xl text-brand-950">
              Acompanhamento
            </h1>
            <p className="font-inter text-sm text-slate-500 mt-1">
              {real
                ? `Período de ${rotuloDoMes(real.inicio)} — o mês contra o que foi combinado.`
                : "O mês contra o que foi combinado no HFC."}
            </p>
          </div>

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
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
          {!hfc ? (
            <SemBase clienteId={id} />
          ) : !real ? (
            <SemPeriodo clienteId={id} />
          ) : (
            <>
              <Sintese clienteId={id} hfcId={hfc.id} realId={real.id} inicio={real.inicio} />
              <SecaoReceita clienteId={id} plano={real} />
              <SecaoDespesa clienteId={id} plano={real} />
              <SecaoCartao clienteId={id} plano={real} />
              <OutrasSecoes clienteId={id} periodoId={real.id} corrente={real.status === "ativo"} />
            </>
          )}

          <Legado clienteId={id} />
        </div>
      </div>
    </>
  );
}

/**
 * A síntese do mês: o período do Real contra o HFC, no mesmo mês.
 *
 * Os dois lados são projeções — plano contra plano. Nenhum deles vem de
 * extrato bancário, e a tela diz isso, para ninguém ler as estrelas como se
 * fossem a conciliação do banco.
 */
async function Sintese({
  clienteId,
  hfcId,
  realId,
  inicio,
}: {
  clienteId: string;
  hfcId: string;
  realId: string;
  inicio: string;
}) {
  const [planHfc, planReal] = await Promise.all([
    getPlanInput(clienteId, hfcId),
    getPlanInput(clienteId, realId),
  ]);

  if (!planHfc || !planReal) {
    return (
      <Card titulo="Síntese do mês" icone={Target} tom="brand">
        <p className="font-inter text-sm text-slate-500">
          Para comparar, o cadastro do cliente precisa da data de nascimento — é
          ela que fecha a projeção dos dois lados.
        </p>
      </Card>
    );
  }

  const refMes = fromISO(inicio);
  const linhas = buildScorecard(refMes, project(planReal).meses, project(planHfc).meses);

  return (
    <Card titulo={`Síntese de ${rotuloDoMes(inicio)}`} icone={Target} tom="brand">
      <Placar linhas={linhas} />
      <p className="font-inter text-xs text-slate-400 mt-4">
        Realizado é a projeção deste período do Planejamento Real; a meta é a do
        HFC no mesmo mês. As estrelas medem o desvio da meta — superar só conta
        como acerto em sobras e investimentos.
      </p>
    </Card>
  );
}

function OutrasSecoes({
  clienteId,
  periodoId,
  corrente,
}: {
  clienteId: string;
  periodoId: string;
  corrente: boolean;
}) {
  // O período corrente dispensa `?periodo=`: a URL limpa é a de hoje.
  const query = corrente ? "" : `?periodo=${periodoId}`;

  return (
    <Card titulo="Outras seções deste período" icone={ArrowRight}>
      <div className="flex flex-wrap gap-2">
        {OUTRAS_SECOES.map((s) => (
          <Link
            key={s.slug}
            href={`/clientes/${clienteId}/planejamento/real/${s.slug}${query}`}
            className="inline-flex items-center gap-1.5 font-inter text-sm text-slate-600 hover:text-brand-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 transition-colors"
          >
            {s.rotulo}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ))}
      </div>
    </Card>
  );
}

function SemBase({ clienteId }: { clienteId: string }) {
  return (
    <Card titulo="Falta o planejamento HFC" icone={Target} tom="ambar">
      <p className="font-inter text-sm text-slate-600 max-w-2xl">
        O Acompanhamento mede cada mês contra o HFC, e é dele que cada período
        do Real nasce. Sem ele não há o que comparar nem de onde herdar.
      </p>
      <Link
        href={`/clientes/${clienteId}/planejamento/hfc/receita`}
        className="inline-flex items-center gap-1.5 mt-4 font-inter text-sm text-brand-600 hover:text-brand-900"
      >
        Montar o HFC
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </Card>
  );
}

function SemPeriodo({ clienteId }: { clienteId: string }) {
  return (
    <Card titulo="Nenhum período aberto" icone={Target}>
      <p className="font-inter text-sm text-slate-600 max-w-2xl">
        Abra o primeiro período do Planejamento Real pelo botão acima. Ele nasce
        igual ao HFC; a partir do segundo, herda o HFC mais os ajustes que você
        marcar como permanentes.
      </p>
      <Link
        href={`/clientes/${clienteId}/planejamento/real/receita`}
        className="inline-flex items-center gap-1.5 mt-4 font-inter text-sm text-brand-600 hover:text-brand-900"
      >
        Ver o Planejamento Real
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </Card>
  );
}

/**
 * Os meses fechados pelo fluxo antigo.
 *
 * Só leitura, e só se existirem: o período do Planejamento Real ocupou o lugar
 * do "abrir mês", então não há mais por que criar registros novos por aqui. O
 * que já foi publicado continua alcançável — a Fase 3 decide se vira histórico
 * arquivado ou se o relatório do cliente é regerado sobre a base nova.
 */
async function Legado({ clienteId }: { clienteId: string }) {
  const registros = await listRegistrosMensais(clienteId);
  if (registros.length === 0) return null;

  return (
    <div className="border-t border-slate-200/70 pt-5">
      <p className="font-inter text-xs text-slate-400 mb-2 inline-flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" />
        Fechamentos mensais do fluxo anterior
      </p>
      <div className="flex flex-wrap gap-2">
        {registros.map((r) => (
          <Link
            key={r.id}
            href={`/clientes/${clienteId}/relatorios/${r.ref_mes.slice(0, 7)}`}
            className="font-inter text-xs text-slate-500 hover:text-brand-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1.5 transition-colors tabular-nums"
          >
            {rotuloDoMes(r.ref_mes)}
          </Link>
        ))}
      </div>
    </div>
  );
}

const rotuloDoMes = (iso: string) => {
  const p = fromISO(iso);
  return `${nomeDoMes(p)} de ${anoDe(p)}`;
};
