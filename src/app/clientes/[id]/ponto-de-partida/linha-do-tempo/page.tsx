import { CircleDot, GitBranch } from "lucide-react";
import { getPlanoAtivo, getProjection, linhasDoCliente, linhasDoPlano } from "@/lib/planning-dal";
import { anoDe, nomeDoMes } from "@/lib/planning/period";
import { escreverMoeda } from "@/lib/forms/planejamento";
import { Card, Stat } from "@/components/planejamento/primitives";
import { ListaEditavel } from "@/components/planejamento/ListaEditavel";

const CATEGORIA_LABEL: Record<string, string> = {
  receita: "Receita",
  despesa: "Despesa",
  divida: "Dívida",
};

/**
 * As mudanças do plano — o que altera o fluxo de caixa a partir de uma data.
 *
 * A planilha guardava isto em duas tabelas separadas por horizonte, e o fim de
 * uma dívida era uma linha solta que somava o valor de volta. Aqui as mudanças
 * são editáveis numa lista só, e as quitações aparecem ao lado como o que são:
 * consequência das datas da própria dívida.
 */
export default async function LinhaDoTempo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plano = await getPlanoAtivo(id);

  const [mudancas, dividas, proj] = await Promise.all([
    plano ? linhasDoPlano("plan_change", plano.id) : [],
    linhasDoCliente("debt", id),
    getProjection(id),
  ]);

  const perpetuas = mudancas.filter((m) => !m.fim).length;
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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Stat rotulo="Mudanças no plano" valor={String(mudancas.length)} />
        <Stat
          rotulo="Sem data de término"
          valor={String(perpetuas)}
          tom={perpetuas > 0 ? "atencao" : "neutro"}
          hint={perpetuas > 0 ? "valem até o fim do horizonte" : undefined}
        />
        <Stat
          rotulo="Dívidas que se encerram"
          valor={String(quitacoes.length)}
          hint={`${dividas.length - quitacoes.length} sem data de fim`}
        />
      </div>

      <Card titulo="Mudanças" icone={GitBranch} tom="roxo">
        <ListaEditavel
          entidade="mudanca"
          planId={plano?.id ?? null}
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
  );
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const rotuloMes = (iso: string) =>
  `${MESES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(0, 4)}`;

function janela(inicio: string, fim: string | null): string {
  if (!fim) return `a partir de ${rotuloMes(inicio)}, sem fim`;
  if (fim === inicio) return rotuloMes(inicio);
  return `${rotuloMes(inicio)} → ${rotuloMes(fim)}`;
}

/** A quitação vale no mês seguinte à última parcela. */
function proximoMes(iso: string): string {
  const ano = Number(iso.slice(0, 4));
  const mes = Number(iso.slice(5, 7));
  const total = ano * 12 + mes; // já é o mês seguinte em base 0
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}
