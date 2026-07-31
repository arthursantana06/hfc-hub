import { CircleDot, GitBranch, Repeat, Target } from "lucide-react";
import {
  getClient,
  getPlanoDoPeriodo,
  getProjection,
  linhasDoPlano,
} from "@/lib/planning-dal";
import { totalVitalicio } from "@/lib/planning/changes";
import { anoDe, nomeDoMes } from "@/lib/planning/period";
import { formatCurrency } from "@/lib/types";
import { escreverMoeda } from "@/lib/forms/planejamento";
import { Card, SemPlano, Stat } from "@/components/planejamento/primitives";
import { ListaEditavel } from "@/components/planejamento/ListaEditavel";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const CATEGORIA_LABEL: Record<string, string> = {
  receita: "Receita",
  despesa: "Despesa",
  divida: "Dívida",
};

/**
 * Objetivos e mudanças, na mesma tela.
 *
 * Eram duas abas, e a separação nunca se sustentou: as duas respondem à mesma
 * pergunta — o que vai acontecer com o dinheiro deste cliente que ainda não
 * está no mês típico. Um objetivo é uma saída marcada no calendário; uma
 * mudança é um degrau no fluxo. O planejador pensa nas duas na mesma conversa.
 */
export default async function ObjetivosEMudancas({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string }>;
}) {
  const [{ id }, { periodo }] = await Promise.all([params, searchParams]);
  const [cliente, plano] = await Promise.all([
    getClient(id),
    getPlanoDoPeriodo(id, periodo),
  ]);

  if (!plano) return <SemPlano clienteId={id} />;

  const [objetivos, mudancas, dividas, proj] = await Promise.all([
    linhasDoPlano("goal", plano.id),
    linhasDoPlano("plan_change", plano.id),
    linhasDoPlano("debt", plano.id),
    getProjection(id, plano.id),
  ]);

  const idadeAtual = idadeDe(cliente?.nascimento ?? null);
  const unicos = objetivos.filter((g) => g.prazo === "curto");
  const recorrentes = objetivos.filter((g) => g.prazo === "longo");

  // Valor negativo é entrada de dinheiro, não compra.
  const saidas = unicos.reduce((a, g) => a + Math.max(0, Number(g.alvo)), 0);
  const entradas = unicos.reduce((a, g) => a + Math.min(0, Number(g.alvo)), 0);
  const totalRecorrente = recorrentes.reduce(
    (a, g) => a + vitalicio(g, idadeAtual),
    0,
  );

  const quitacoes = dividas
    .filter((d) => d.fim)
    .map((d) => ({
      id: d.id,
      titulo: `${d.descricao} quitada`,
      quando: proximoMes(d.fim!),
      valor: Number(d.parcela ?? 0),
    }))
    .sort((a, b) => a.quando.localeCompare(b.quando));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Stat
          rotulo="Eventos únicos"
          valor={formatCurrency(saidas, 2)}
          hint={
            entradas < 0
              ? `${formatCurrency(-entradas, 2)} de entradas previstas`
              : `${unicos.length} ${unicos.length === 1 ? "objetivo" : "objetivos"} com data`
          }
        />
        <Stat
          rotulo="Objetivos recorrentes"
          valor={formatCurrency(totalRecorrente, 2)}
          hint={idadeAtual ? `custo até os 100, hoje com ${idadeAtual}` : "informe o nascimento"}
        />
        <Stat
          rotulo="Mudanças no plano"
          valor={String(mudancas.length)}
          hint={
            mudancas.filter((m) => !m.fim).length > 0
              ? `${mudancas.filter((m) => !m.fim).length} sem data de término`
              : undefined
          }
        />
        <Stat
          rotulo="Concluídos"
          valor={`${objetivos.filter((g) => g.concluido).length} de ${objetivos.length}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card titulo="Evento Único" icone={Target} tom="brand">
          <ListaEditavel
            entidade="objetivo"
            planId={plano.id}
            clientId={id}
            vazio="Nenhum objetivo com data marcada."
            linhas={unicos
              .slice()
              .sort((a, b) => (a.data_alvo ?? "").localeCompare(b.data_alvo ?? ""))
              .map((g) => ({
                id: g.id,
                titulo: g.concluido ? `✓ ${g.titulo}` : g.titulo,
                detalhe: g.data_alvo
                  ? `${MESES[Number(g.data_alvo.slice(5, 7)) - 1]} de ${g.data_alvo.slice(0, 4)}${
                      Number(g.alvo) < 0 ? " · entrada" : ""
                    }`
                  : "sem data",
                valor: `R$ ${escreverMoeda(Number(g.alvo))}`,
                bruto: g,
              }))}
            extra={
              <p className="font-inter text-xs text-slate-400 mt-4">
                Acontece uma vez, num mês marcado: a viagem, a entrada do imóvel,
                a reforma. Sai do patrimônio no mês em que cai.
              </p>
            }
          />
        </Card>

        <Card titulo="Recorrente" icone={Repeat} tom="roxo">
          <ListaEditavel
            entidade="objetivo"
            planId={plano.id}
            clientId={id}
            vazio="Nenhum objetivo recorrente."
            linhas={recorrentes.map((g) => ({
              id: g.id,
              titulo: g.titulo,
              detalhe: g.periodicidade_anos
                ? `${escreverMoeda(Number(g.alvo))} a cada ${g.periodicidade_anos} ${
                    g.periodicidade_anos === 1 ? "ano" : "anos"
                  }`
                : "sem periodicidade",
              valor: `R$ ${escreverMoeda(vitalicio(g, idadeAtual))}`,
              bruto: g,
            }))}
            extra={
              recorrentes.length > 0 ? (
                <p className="font-inter text-xs text-slate-400 mt-4">
                  O total é o custo de repetir a compra até os 100 anos:
                  valor × (100 − idade) ÷ periodicidade. Soma nominal, sem
                  desconto de juros — como na planilha de origem.
                </p>
              ) : (
                <p className="font-inter text-xs text-slate-400 mt-4">
                  Se repete a cada N anos: trocar de carro, de celular, a viagem
                  anual em família.
                </p>
              )
            }
          />
        </Card>
      </div>

      <Card titulo="Mudanças" icone={GitBranch} tom="ambar">
        <ListaEditavel
          entidade="mudanca"
          planId={plano.id}
          clientId={id}
          vazio="Nenhuma mudança. Sem elas a projeção repete o mês típico para sempre."
          linhas={mudancas
            .slice()
            .sort((a, b) => a.inicio.localeCompare(b.inicio))
            .map((m) => ({
              id: m.id,
              titulo: m.titulo,
              detalhe: `${CATEGORIA_LABEL[m.categoria]} · ${janela(m.inicio, m.fim)}${
                m.observacao ? ` · ${m.observacao}` : ""
              }`,
              valor: `${Number(m.valor) >= 0 ? "+" : ""}R$ ${escreverMoeda(Number(m.valor))}`,
              bruto: m,
            }))}
        />
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {quitacoes.length > 0 && (
          <Card titulo="Quitações previstas" icone={CircleDot} tom="verde">
            <ul className="flex flex-col">
              {quitacoes.map((q) => (
                <li
                  key={q.id}
                  className="flex items-baseline justify-between gap-4 py-2.5 border-b border-slate-50 last:border-none"
                >
                  <div className="min-w-0">
                    <p className="font-inter text-sm font-medium text-slate-700 truncate">
                      {q.titulo}
                    </p>
                    <p className="font-inter text-xs text-slate-500 mt-0.5">
                      {rotuloMes(q.quando)} — a parcela deixa de sair do caixa
                    </p>
                  </div>
                  <span className="font-inter text-sm text-emerald-600 tabular-nums shrink-0">
                    +R$ {escreverMoeda(q.valor)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="font-inter text-xs text-slate-400 mt-4">
              Derivado da data de fim de cada dívida, e não de uma mudança escrita
              à mão. Esquecer de registrar a quitação deixou de ser possível.
            </p>
          </Card>
        )}

        {proj && proj.curta.some((m) => m.observacoes.length > 0) && (
          <Card titulo="Marcos nos próximos meses" icone={CircleDot}>
            <ul className="flex flex-col">
              {proj.curta
                .filter((m) => m.observacoes.length > 0)
                .slice(0, 8)
                .map((m) => (
                  <li
                    key={m.periodo}
                    className="flex items-baseline justify-between gap-4 py-2.5 border-b border-slate-50 last:border-none"
                  >
                    <div className="min-w-0">
                      <p className="font-inter text-sm font-medium text-slate-700 truncate">
                        {m.observacoes.join(", ")}
                      </p>
                      <p className="font-inter text-xs text-slate-500 mt-0.5">
                        {nomeDoMes(m.periodo)} de {anoDe(m.periodo)}
                      </p>
                    </div>
                    <span className="font-inter text-sm text-slate-600 tabular-nums shrink-0">
                      R$ {escreverMoeda(m.objetivos !== 0 ? m.objetivos : m.sobras)}
                    </span>
                  </li>
                ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

type ObjetivoBruto = {
  titulo: string;
  alvo: number;
  periodicidade_anos: number | null;
  concluido: boolean;
};

const vitalicio = (g: ObjetivoBruto, idadeAtual: number) =>
  totalVitalicio(
    {
      titulo: g.titulo,
      prazo: "longo",
      alvo: Number(g.alvo),
      dataAlvo: null,
      periodicidadeAnos: g.periodicidade_anos,
      concluido: g.concluido,
    },
    idadeAtual,
  );

const rotuloMes = (iso: string) =>
  `${MESES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(0, 4)}`;

function janela(inicio: string, fim: string | null): string {
  if (!fim) return `a partir de ${rotuloMes(inicio)}, sem fim`;
  if (fim === inicio) return rotuloMes(inicio);
  return `${rotuloMes(inicio)} → ${rotuloMes(fim)}`;
}

/** A quitação vale no mês seguinte à última parcela. */
function proximoMes(iso: string): string {
  const total = Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)); // já é o seguinte
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

/**
 * Idade hoje, para o total vitalício.
 *
 * `new Date()` aqui é aceitável: é rótulo de tela, não entrada do motor — o
 * motor calcula a idade a partir do mês projetado, não do relógio.
 */
function idadeDe(nascimento: string | null): number {
  if (!nascimento) return 0;
  const [ano, mes] = nascimento.split("-").map(Number);
  const hoje = new Date();
  return Math.floor(
    (hoje.getFullYear() * 12 + hoje.getMonth() + 1 - (ano * 12 + mes)) / 12,
  );
}
