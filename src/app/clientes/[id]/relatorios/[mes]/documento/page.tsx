import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getClient,
  getMetas,
  getPlanInput,
  getProjection,
  getRegistroMensal,
  linhasDoRegistro,
  listCategorias,
} from "@/lib/planning-dal";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { summarizeBaseline } from "@/lib/planning/baseline";
import { buildScorecard, type ScoreLine } from "@/lib/planning/scorecard";
import { anoDe, fromISO, nomeDoMes, rotuloCurto } from "@/lib/planning/period";
import { formatCurrency } from "@/lib/types";
import { GraficoFluxo } from "@/components/planejamento/GraficoFluxo";
import { GraficoPatrimonio } from "@/components/planejamento/GraficoPatrimonio";
import { BotaoImprimir } from "@/components/planejamento/BotaoImprimir";

/**
 * O relatório mensal — as cinco páginas que a planilha gerava.
 *
 * É HTML preparado para impressão, e não um PDF montado no servidor. Um
 * renderizador headless em função serverless significa carregar um Chromium de
 * ~50 MB a cada geração; o navegador que o planejador já tem aberto faz o mesmo
 * trabalho, com fontes corretas e sem dependência nova. "Imprimir → Salvar como
 * PDF" produz o arquivo.
 */
export default async function Documento({
  params,
}: {
  params: Promise<{ id: string; mes: string }>;
}) {
  const { id, mes } = await params;
  if (!/^\d{4}-\d{2}$/.test(mes)) notFound();

  const refMes = `${mes}-01`;
  const periodo = fromISO(refMes);
  await verifySession();
  const supabase = await createClient();

  const [cliente, registro, relatorio, plan, proj, metas, categorias] =
    await Promise.all([
      getClient(id),
      getRegistroMensal(id, refMes),
      supabase
        .from("report")
        .select("*")
        .eq("client_id", id)
        .eq("ref_mes", refMes)
        .maybeSingle(),
      getPlanInput(id),
      getProjection(id),
      getMetas(id),
      listCategorias(),
    ]);

  if (!cliente || !registro || !plan || !proj) notFound();

  const { receitas, despesas, faturas } = await linhasDoRegistro(registro.id);
  const direcionamentos = relatorio.data
    ? (
        await supabase
          .from("report_directive")
          .select("*")
          .eq("report_id", relatorio.data.id)
          .order("ordem")
      ).data ?? []
    : [];

  const base = summarizeBaseline(plan);
  const placar: ScoreLine[] =
    relatorio.data?.status === "publicado" && relatorio.data.placar
      ? (relatorio.data.placar as unknown as ScoreLine[])
      : metas
        ? buildScorecard(periodo, proj.curta, metas.serie)
        : [];

  const nomeCategoria = new Map(categorias.map((c) => [c.valor, c]));
  const doAno = proj.curta.filter((m) => m.periodo <= periodo + 12);
  const proximo = proj.curta.find((m) => m.periodo === periodo + 1);
  const titulo = `${nomeDoMes(periodo)} de ${anoDe(periodo)}`;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 print:bg-white print:overflow-visible">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between gap-4 print:hidden">
        <Link
          href={`/clientes/${id}/relatorios/${mes}`}
          className="inline-flex items-center gap-1.5 font-inter text-sm text-slate-500 hover:text-brand-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao fechamento
        </Link>
        <BotaoImprimir />
      </div>

      <div className="py-8 px-4 flex flex-col items-center gap-8 print:p-0 print:gap-0">
        {/* 1 — Placar e orçamento */}
        <Pagina numero={1} cliente={cliente.nome} titulo={titulo}>
          <h2 className="font-poppins text-lg text-brand-950 font-medium mb-4">
            Como foi {titulo}
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {placar.map((l) => (
              <div key={l.metrica} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-inter text-xs text-slate-500">{l.rotulo}</span>
                  <span className="text-amber-500 text-sm">
                    {"★".repeat(l.estrelas)}
                    <span className="text-slate-200">{"★".repeat(5 - l.estrelas)}</span>
                  </span>
                </div>
                <p className="font-poppins text-base text-brand-950 tabular-nums mt-1">
                  {formatCurrency(l.realizado, 0)}
                </p>
                <p className="font-inter text-xs text-slate-400">{l.leitura}</p>
              </div>
            ))}
            {placar.length === 0 && (
              <p className="font-inter text-sm text-slate-500 col-span-2">
                Sem metas congeladas para comparar este mês.
              </p>
            )}
          </div>

          <h3 className="font-poppins text-base text-brand-950 font-medium mb-3">
            Orçamento do mês
          </h3>
          <table className="w-full text-sm">
            <tbody>
              {base.orcamento
                .filter((b) => b.total > 0)
                .map((b) => (
                  <tr key={b.bucket} className="border-b border-slate-100">
                    <td className="py-1.5 font-inter text-slate-700">{b.rotulo}</td>
                    <td className="py-1.5 text-right font-inter text-slate-400 tabular-nums">
                      {(b.percentual * 100).toFixed(1)}%
                    </td>
                    <td className="py-1.5 text-right font-inter text-slate-700 tabular-nums">
                      {formatCurrency(b.total, 2)}
                    </td>
                  </tr>
                ))}
              <tr>
                <td className="py-2 font-inter font-semibold text-brand-950">Total</td>
                <td />
                <td className="py-2 text-right font-inter font-semibold text-brand-950 tabular-nums">
                  {formatCurrency(base.orcamentoTotal, 2)}
                </td>
              </tr>
            </tbody>
          </table>
        </Pagina>

        {/* 2 — Fluxo projetado */}
        <Pagina numero={2} cliente={cliente.nome} titulo={titulo}>
          <h2 className="font-poppins text-lg text-brand-950 font-medium mb-1">
            Fluxo projetado
          </h2>
          <p className="font-inter text-sm text-slate-500 mb-5">
            Entradas e saídas dos próximos doze meses, com os marcos do plano.
          </p>
          <GraficoFluxo pontos={doAno.map(paraFluxo)} altura={230} />
        </Pagina>

        {/* 3 — Patrimônio */}
        <Pagina numero={3} cliente={cliente.nome} titulo={titulo}>
          <h2 className="font-poppins text-lg text-brand-950 font-medium mb-1">
            Patrimônio
          </h2>
          <p className="font-inter text-sm text-slate-500 mb-5">
            Acumulado mês a mês na janela curta, e ano a ano até a aposentadoria.
          </p>
          <GraficoPatrimonio
            pontos={proj.curta.map((m) => ({
              rotulo: rotuloCurto(m.periodo),
              valor: m.patrimonio,
            }))}
            altura={170}
          />
          <div className="mt-6">
            <GraficoPatrimonio
              pontos={proj.longa.map((y) => ({ rotulo: String(y.ano), valor: y.patrimonio }))}
              altura={170}
            />
          </div>
        </Pagina>

        {/* 4 — Realizado */}
        <Pagina numero={4} cliente={cliente.nome} titulo={titulo}>
          <h2 className="font-poppins text-lg text-brand-950 font-medium mb-5">
            O que aconteceu no mês
          </h2>

          <div className="grid grid-cols-2 gap-8">
            <Bloco titulo="Receitas" linhas={receitas.map((r) => [r.fonte, Number(r.valor)])} />
            <Bloco
              titulo="Gastos"
              linhas={despesas.map((d) => [
                d.descricao || nomeCategoria.get(d.categoria_id ?? "")?.rotulo || "—",
                Number(d.valor),
              ])}
            />
          </div>

          {faturas.length > 0 && (
            <div className="mt-8">
              <Bloco
                titulo="Faturas de cartão"
                linhas={faturas.map((f) => [
                  `${f.cartao} · ${f.categoria}`,
                  Number(f.valor),
                ])}
              />
            </div>
          )}

          {registro.observacao && (
            <div className="mt-8">
              <h3 className="font-poppins text-base text-brand-950 font-medium mb-2">
                Observações
              </h3>
              <p className="font-inter text-sm text-slate-600 whitespace-pre-wrap">
                {registro.observacao}
              </p>
            </div>
          )}
        </Pagina>

        {/* 5 — Próximo mês */}
        <Pagina numero={5} cliente={cliente.nome} titulo={titulo}>
          <h2 className="font-poppins text-lg text-brand-950 font-medium mb-5">
            O próximo mês
          </h2>

          {proximo && (
            <div className="grid grid-cols-4 gap-3 mb-8">
              <Meta rotulo="Receita" valor={proximo.receitas} />
              <Meta
                rotulo="Despesa"
                valor={proximo.despesas + proximo.dividas + proximo.previdencia}
              />
              <Meta rotulo="Sobras" valor={proximo.sobras} />
              <Meta rotulo="Patrimônio" valor={proximo.patrimonio} />
            </div>
          )}

          <h3 className="font-poppins text-base text-brand-950 font-medium mb-3">
            Direcionamentos
          </h3>
          {direcionamentos.length === 0 ? (
            <p className="font-inter text-sm text-slate-500">
              Nenhum direcionamento registrado para este mês.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {direcionamentos.map((d, i) => (
                <li key={d.id} className="flex gap-3 items-baseline">
                  <span className="font-poppins text-brand-600 text-sm shrink-0">
                    {i + 1}.
                  </span>
                  <span className="font-inter text-sm text-slate-700">{d.texto}</span>
                </li>
              ))}
            </ol>
          )}

          {plan.goals.filter((g) => g.prazo === "curto").length > 0 && (
            <div className="mt-8">
              <h3 className="font-poppins text-base text-brand-950 font-medium mb-3">
                Objetivos
              </h3>
              <ul className="flex flex-col gap-1.5">
                {plan.goals
                  .filter((g) => g.prazo === "curto")
                  .map((g) => (
                    <li key={g.titulo} className="flex gap-3 items-baseline">
                      <span className="shrink-0 text-sm">{g.concluido ? "✓" : "○"}</span>
                      <span
                        className={`font-inter text-sm ${
                          g.concluido ? "text-slate-400 line-through" : "text-slate-700"
                        }`}
                      >
                        {g.titulo}
                      </span>
                      <span className="ml-auto font-inter text-sm text-slate-500 tabular-nums">
                        {formatCurrency(g.alvo, 0)}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </Pagina>
      </div>
    </div>
  );
}

const paraFluxo = (m: {
  periodo: number;
  receitas: number;
  despesas: number;
  dividas: number;
  previdencia: number;
  sobras: number;
  observacoes: string[];
}) => ({
  rotulo: rotuloCurto(m.periodo),
  entradas: m.receitas,
  saidas: -(m.despesas + m.dividas + m.previdencia),
  sobras: m.sobras,
  marco: m.observacoes[0],
});

/**
 * Uma folha A4.
 *
 * `break-after-page` faz cada folha virar uma página na impressão; a sombra e o
 * fundo cinza existem só na tela, para que o planejador veja o que vai sair.
 */
function Pagina({
  numero,
  cliente,
  titulo,
  children,
}: {
  numero: number;
  cliente: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="bg-white shadow-sm print:shadow-none w-full max-w-[210mm] min-h-[297mm] p-[16mm] flex flex-col break-after-page last:break-after-auto"
      aria-label={`Página ${numero}`}
    >
      <header className="flex items-baseline justify-between border-b border-slate-200 pb-3 mb-6">
        <span className="font-poppins text-sm text-brand-950 font-medium">
          {cliente}
        </span>
        <span className="font-inter text-xs text-slate-400">
          Planejamento financeiro · {titulo}
        </span>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="pt-4 mt-6 border-t border-slate-100 flex items-baseline justify-between">
        <span className="font-inter text-xs text-slate-400">HFC Consultoria</span>
        <span className="font-inter text-xs text-slate-400">{numero} / 5</span>
      </footer>
    </section>
  );
}

function Bloco({ titulo, linhas }: { titulo: string; linhas: [string, number][] }) {
  const total = linhas.reduce((a, [, v]) => a + v, 0);
  return (
    <div>
      <h3 className="font-poppins text-base text-brand-950 font-medium mb-3">{titulo}</h3>
      {linhas.length === 0 ? (
        <p className="font-inter text-sm text-slate-400">Nada lançado.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {linhas.map(([nome, valor], i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1.5 font-inter text-slate-700">{nome}</td>
                <td className="py-1.5 text-right font-inter text-slate-600 tabular-nums">
                  {formatCurrency(valor, 2)}
                </td>
              </tr>
            ))}
            <tr>
              <td className="py-2 font-inter font-semibold text-brand-950">Total</td>
              <td className="py-2 text-right font-inter font-semibold text-brand-950 tabular-nums">
                {formatCurrency(total, 2)}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

function Meta({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3">
      <p className="font-inter text-xs text-slate-500">{rotulo}</p>
      <p
        className={`font-poppins text-base tabular-nums mt-1 ${
          valor < 0 ? "text-red-700" : "text-brand-950"
        }`}
      >
        {formatCurrency(valor, 0)}
      </p>
    </div>
  );
}
