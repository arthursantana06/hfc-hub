import Link from "next/link";
import { ArrowRight, Settings2 } from "lucide-react";
import { getPlanInput } from "@/lib/planning-dal";
import { summarizeBaseline } from "@/lib/planning/baseline";
import { anoDe, idadeEm, nomeDoMes } from "@/lib/planning/period";
import { formatCurrency } from "@/lib/types";
import { Card, Linha, SemPlano, Stat } from "@/components/planejamento/primitives";

export default async function PontoDePartida({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = await getPlanInput(id);

  if (!plan) return <SemPlano clienteId={id} />;

  const base = summarizeBaseline(plan);
  const a = plan.assumptions;
  const idade = idadeEm(plan.nascimento, a.inicio);

  const atalhos = [
    {
      href: `/clientes/${id}/ponto-de-partida/fluxo-de-caixa`,
      titulo: "Fluxo de caixa",
      desc: `${plan.incomes.length} receitas, ${plan.expenses.length} linhas de custo`,
    },
    {
      href: `/clientes/${id}/ponto-de-partida/patrimonio`,
      titulo: "Patrimônio",
      desc: `${plan.debts.length} dívidas ativas`,
    },
    {
      href: `/clientes/${id}/ponto-de-partida/objetivos`,
      titulo: "Objetivos",
      desc: `${plan.goals.length} objetivos registrados`,
    },
    {
      href: `/clientes/${id}/ponto-de-partida/linha-do-tempo`,
      titulo: "Linha do tempo",
      desc: `${plan.changes.length} mudanças previstas`,
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Stat
          rotulo="Sobras mensais"
          valor={formatCurrency(base.sobrasMensais, 2)}
          tom={base.sobrasMensais >= 0 ? "bom" : "ruim"}
          hint="num mês típico, já rateando os anuais"
        />
        <Stat
          rotulo="Taxa de poupança"
          valor={
            base.receitaTotalMensalizada > 0
              ? `${((base.sobrasMensais / base.receitaTotalMensalizada) * 100).toFixed(1)}%`
              : "—"
          }
          hint="das sobras sobre a receita"
        />
        <Stat
          rotulo="Comprometido com dívidas"
          valor={
            base.receitaTotalMensalizada > 0
              ? `${((base.parcelasMensais / base.receitaTotalMensalizada) * 100).toFixed(1)}%`
              : "—"
          }
          tom={
            base.parcelasMensais / base.receitaTotalMensalizada > 0.3
              ? "atencao"
              : "neutro"
          }
          hint={formatCurrency(base.parcelasMensais, 2) + " por mês"}
        />
        <Stat
          rotulo="Idade"
          valor={`${idade} anos`}
          hint={`plano iniciado em ${nomeDoMes(a.inicio).toLowerCase()}/${anoDe(a.inicio)}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card titulo="Premissas do plano" icone={Settings2}>
          <Linha
            nome="Modo de valor"
            detalhe={
              a.modoValor === "real"
                ? "valores em poder de compra de hoje; o retorno é descontado da inflação"
                : "valores correntes; receitas e despesas crescem com a inflação"
            }
            valor={a.modoValor === "real" ? "Valor Real" : "Valor Nominal"}
          />
          <Linha
            nome="Juros — curto prazo"
            detalhe={`primeiros ${a.mesesCurto} meses`}
            valor={`${(a.jurosCurto * 100).toFixed(1)}% a.a.`}
          />
          <Linha
            nome="Juros — longo prazo"
            detalhe="até a aposentadoria"
            valor={`${(a.jurosLongo * 100).toFixed(1)}% a.a.`}
          />
          <Linha
            nome="Juros — aposentadoria"
            valor={`${(a.jurosAposentadoria * 100).toFixed(1)}% a.a.`}
          />
          <Linha nome="Inflação" valor={`${(a.inflacao * 100).toFixed(1)}% a.a.`} />
          <Linha
            nome="Aposentadoria"
            detalhe={`renda do INSS de ${formatCurrency(plan.retirement.rendaInss, 2)}`}
            valor={`aos ${plan.retirement.idadeAlvo}`}
          />
          <Linha nome="Horizonte" valor={`até os ${a.idadeLimite} anos`} />
        </Card>

        <Card titulo="Onde continuar" icone={ArrowRight}>
          <div className="flex flex-col gap-2">
            {atalhos.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="group flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-300/5 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-inter text-sm font-medium text-brand-950">
                    {t.titulo}
                  </p>
                  <p className="font-inter text-xs text-slate-500 mt-0.5">{t.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
