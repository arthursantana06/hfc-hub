import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  ListChecks,
  MessageSquare,
  ShoppingCart,
  Star,
  Wallet,
} from "lucide-react";
import {
  getMetas,
  getProjection,
  getRegistroMensal,
  linhasDoRegistro,
  listCategorias,
} from "@/lib/planning-dal";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { buildScorecard } from "@/lib/planning/scorecard";
import { fromISO, nomeDoMes } from "@/lib/planning/period";
import { escreverMoeda } from "@/lib/forms/planejamento";
import { formatCurrency } from "@/lib/types";
import { Card, Stat } from "@/components/planejamento/primitives";
import { ListaEditavel } from "@/components/planejamento/ListaEditavel";
import { Placar } from "@/components/planejamento/Placar";
import {
  AcoesRelatorio,
  FormularioObservacao,
} from "@/components/planejamento/AcoesMes";

const CARTAO_CATEGORIA: Record<string, string> = {
  alimentacao: "Alimentação",
  transporte: "Transporte",
  compras: "Compras",
  saude: "Saúde",
  vestuario: "Vestuário",
  lazer: "Lazer",
  outros: "Outros",
};

export default async function FechamentoDoMes({
  params,
}: {
  params: Promise<{ id: string; mes: string }>;
}) {
  const { id, mes } = await params;
  if (!/^\d{4}-\d{2}$/.test(mes)) notFound();

  const refMes = `${mes}-01`;
  await verifySession();
  const supabase = await createClient();

  const [registro, relatorio, proj, metas, categorias] = await Promise.all([
    getRegistroMensal(id, refMes),
    supabase
      .from("report")
      .select("*")
      .eq("client_id", id)
      .eq("ref_mes", refMes)
      .maybeSingle(),
    getProjection(id),
    getMetas(id),
    listCategorias(),
  ]);

  if (!registro) notFound();

  const { receitas, despesas, faturas } = await linhasDoRegistro(registro.id);
  const publicado = relatorio.data?.status === "publicado";

  const placar =
    proj && metas ? buildScorecard(fromISO(refMes), proj.curta, metas.serie) : [];

  const direcionamentos = relatorio.data
    ? (
        await supabase
          .from("report_directive")
          .select("*")
          .eq("report_id", relatorio.data.id)
          .order("ordem")
      ).data ?? []
    : [];

  const totalReceitas = receitas.reduce((a, r) => a + Number(r.valor), 0);
  const totalDespesas = despesas.reduce((a, d) => a + Number(d.valor), 0);
  const totalFaturas = faturas.reduce((a, f) => a + Number(f.valor), 0);
  const nomeCategoria = new Map(categorias.map((c) => [c.valor, c]));

  return (
    <>
      <header className="p-8 pb-6 shrink-0 border-b border-slate-200/60 bg-white shadow-sm flex items-end justify-between gap-6 flex-wrap">
        <div>
          <Link
            href={`/clientes/${id}/relatorios`}
            className="inline-flex items-center gap-1.5 font-inter text-sm text-slate-500 hover:text-brand-950 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Relatórios
          </Link>
          <h1 className="font-poppins font-medium text-2xl text-brand-950">
            {nomeDoMes(fromISO(refMes))} de {mes.slice(0, 4)}
          </h1>
        </div>

        {relatorio.data && (
          <Link
            href={`/clientes/${id}/relatorios/${mes}/documento`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 font-inter text-sm text-slate-700 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Ver o documento
          </Link>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Stat
              rotulo="Receitas do mês"
              valor={formatCurrency(totalReceitas, 2)}
              hint={`${receitas.length} lançamentos`}
            />
            <Stat
              rotulo="Gastos do mês"
              valor={formatCurrency(totalDespesas, 2)}
              hint={`${despesas.length} lançamentos`}
            />
            <Stat
              rotulo="Sobra realizada"
              valor={formatCurrency(totalReceitas - totalDespesas, 2)}
              tom={totalReceitas - totalDespesas >= 0 ? "bom" : "ruim"}
            />
          </div>

          <Card titulo="Placar do mês" icone={Star} tom="ambar">
            {!metas ? (
              <div className="flex flex-col gap-2">
                <p className="font-inter text-sm text-slate-500">
                  As metas do plano ainda não foram congeladas — sem elas não há
                  contra o que comparar.
                </p>
                <Link
                  href={`/clientes/${id}/relatorios`}
                  className="font-inter text-sm text-brand-600 hover:text-brand-900 transition-colors"
                >
                  Congelar as metas
                </Link>
              </div>
            ) : (
              <>
                <Placar
                  linhas={
                    publicado && relatorio.data?.placar
                      ? (relatorio.data.placar as unknown as typeof placar)
                      : placar
                  }
                />
                <p className="font-inter text-xs text-slate-400 mt-4">
                  A nota mede o <b>desvio</b> da meta, não o percentual atingido:
                  até 5% de desvio são cinco estrelas. Em sobras e investimentos,
                  superar a meta vale nota máxima; em despesas, estourar o
                  orçamento nunca vira nota alta.
                </p>
              </>
            )}
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card titulo="Receitas realizadas" icone={Wallet} tom="verde" total={totalReceitas}>
              <ListaEditavel
                entidade="receita_realizada"
                clientId={id}
                recordId={registro.id}
                somenteLeitura={publicado}
                vazio="Nenhuma receita lançada."
                linhas={receitas.map((r) => ({
                  id: r.id,
                  titulo: r.fonte,
                  valor: `R$ ${escreverMoeda(Number(r.valor))}`,
                  bruto: r,
                }))}
              />
            </Card>

            <Card
              titulo="Gastos realizados"
              icone={ShoppingCart}
              tom="vermelho"
              total={totalDespesas}
            >
              <ListaEditavel
                entidade="despesa_realizada"
                clientId={id}
                recordId={registro.id}
                opcoesRef={{ categoria: categorias }}
                somenteLeitura={publicado}
                vazio="Nenhum gasto lançado."
                linhas={despesas.map((d) => ({
                  id: d.id,
                  titulo: d.descricao || nomeCategoria.get(d.categoria_id ?? "")?.rotulo || "—",
                  detalhe: d.bucket,
                  valor: `R$ ${escreverMoeda(Number(d.valor))}`,
                  bruto: d,
                }))}
              />
            </Card>
          </div>

          <Card titulo="Faturas de cartão" icone={CreditCard} tom="roxo" total={totalFaturas}>
            <ListaEditavel
              entidade="fatura"
              clientId={id}
              recordId={registro.id}
              somenteLeitura={publicado}
              vazio="Nenhuma fatura lançada."
              linhas={faturas.map((f) => ({
                id: f.id,
                titulo: f.cartao,
                detalhe: CARTAO_CATEGORIA[f.categoria] ?? f.categoria,
                valor: `R$ ${escreverMoeda(Number(f.valor))}`,
                bruto: f,
              }))}
              extra={
                <p className="font-inter text-xs text-slate-400 mt-3">
                  A categoria aqui é a que o banco devolve no extrato, e não a do
                  plano — são taxonomias diferentes de propósito.
                </p>
              }
            />
          </Card>

          <Card titulo="Observações do mês" icone={MessageSquare}>
            <FormularioObservacao
              recordId={registro.id}
              valor={registro.observacao}
              somenteLeitura={publicado}
            />
          </Card>

          {relatorio.data && (
            <Card titulo="Direcionamentos do próximo mês" icone={ListChecks} tom="brand">
              <ListaEditavel
                entidade="direcionamento"
                clientId={id}
                reportId={relatorio.data.id}
                somenteLeitura={publicado}
                vazio="Nenhum direcionamento escrito."
                linhas={direcionamentos.map((d) => ({
                  id: d.id,
                  titulo: d.texto,
                  valor: "",
                  bruto: d,
                }))}
              />
            </Card>
          )}

          {relatorio.data && (
            <Card titulo="Publicação" icone={FileText}>
              <AcoesRelatorio
                clientId={id}
                reportId={relatorio.data.id}
                recordId={registro.id}
                refMes={refMes}
                publicado={publicado}
              />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
