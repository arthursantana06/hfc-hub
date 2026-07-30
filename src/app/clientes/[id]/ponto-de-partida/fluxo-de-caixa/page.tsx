import Link from "next/link";
import { Wallet, ShoppingCart, CreditCard, Scale } from "lucide-react";
import {
  getPlanInput,
  getPlanoAtivo,
  linhasDoCliente,
  linhasDoPlano,
  listCategorias,
} from "@/lib/planning-dal";
import { summarizeBaseline } from "@/lib/planning/baseline";
import { formatCurrency } from "@/lib/types";
import { escreverMoeda } from "@/lib/forms/planejamento";
import {
  Barra,
  Card,
  Stat,
  pct,
} from "@/components/planejamento/primitives";
import { ListaEditavel } from "@/components/planejamento/ListaEditavel";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const GRUPOS: Record<string, string> = {
  casa: "Casa",
  saude: "Saúde",
  transporte: "Transporte",
  lazer: "Lazer",
  filhos_pets: "Filhos e Pets",
  outros: "Outros",
};

export default async function FluxoDeCaixa({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plano = await getPlanoAtivo(id);

  if (!plano) return <PrecisaPlano clienteId={id} />;

  const [plan, receitas, despesas, dividas, categorias] = await Promise.all([
    getPlanInput(id),
    linhasDoPlano("plan_income", plano.id),
    linhasDoPlano("plan_expense", plano.id),
    linhasDoCliente("debt", id),
    listCategorias(),
  ]);

  const base = plan ? summarizeBaseline(plan) : null;
  const nomeCategoria = new Map(categorias.map((c) => [c.valor, c]));

  const freq = (f: string, m: number | null) =>
    f === "anual" ? `Anual · ${m ? MESES[m - 1] : "sem mês"}` : "Mensal";

  const tomBalde: Record<string, string> = {
    fixo: "bg-brand-600",
    extra: "bg-amber-500",
    parcela: "bg-red-500",
    adicional: "bg-violet-500",
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {base && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Stat
            rotulo="Receita mensalizada"
            valor={formatCurrency(base.receitaTotalMensalizada, 2)}
            hint={`${formatCurrency(base.receitaMensal, 2)} num mês sem anuais`}
          />
          <Stat
            rotulo="Custo mensalizado"
            valor={formatCurrency(base.despesaTotalMensalizada, 2)}
            hint={`${formatCurrency(base.despesaMensal, 2)} num mês sem anuais`}
          />
          <Stat
            rotulo="Parcelas"
            valor={formatCurrency(base.parcelasMensais, 2)}
            hint={`${dividas.length} ${dividas.length === 1 ? "dívida" : "dívidas"}`}
          />
          <Stat
            rotulo="Sobras mensais"
            valor={formatCurrency(base.sobrasMensais, 2)}
            tom={base.sobrasMensais >= 0 ? "bom" : "ruim"}
            hint={
              base.sobrasMensais >= 0
                ? "o que sobra para investir"
                : "o mês típico fecha no vermelho"
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card
          titulo="Receitas"
          icone={Wallet}
          tom="verde"
          total={base?.receitaTotalMensalizada}
        >
          <ListaEditavel
            entidade="receita"
            planId={plano.id}
            clientId={id}
            vazio="Nenhuma receita. O plano começa por aqui."
            linhas={receitas.map((r) => ({
              id: r.id,
              titulo: r.fonte,
              detalhe: freq(r.frequencia, r.mes_ocorrencia),
              // Anual aparece rateado, para somar com as mensais na mesma coluna.
              valor: `R$ ${escreverMoeda(
                r.frequencia === "anual" ? Number(r.valor) / 12 : Number(r.valor),
              )}`,
              bruto: r,
            }))}
            extra={
              receitas.some((r) => r.frequencia === "anual") ? (
                <p className="font-inter text-xs text-slate-400 mt-3">
                  Receitas anuais aparecem rateadas por 12. Elas entram cheias no
                  mês de ocorrência.
                </p>
              ) : null
            }
          />
        </Card>

        <Card
          titulo="Custo de vida"
          icone={ShoppingCart}
          tom="vermelho"
          total={base?.despesaTotalMensalizada}
        >
          <ListaEditavel
            entidade="despesa"
            planId={plano.id}
            clientId={id}
            opcoesRef={{ categoria: categorias }}
            vazio="Nenhum custo registrado."
            comScroll
            linhas={despesas.map((e) => {
              const cat = nomeCategoria.get(e.categoria_id);
              return {
                id: e.id,
                titulo: e.descricao || cat?.rotulo || "—",
                detalhe: `${GRUPOS[cat?.grupo ?? "outros"]} · ${freq(e.frequencia, e.mes_ocorrencia)} · ${
                  e.bucket === "fixo" ? "fixo" : "extra"
                }`,
                valor: `R$ ${escreverMoeda(
                  e.frequencia === "anual" ? Number(e.valor) / 12 : Number(e.valor),
                )}`,
                bruto: e,
              };
            })}
          />
        </Card>

        <Card
          titulo="Parcelas e dívidas"
          icone={CreditCard}
          tom="ambar"
          total={base?.parcelasMensais}
        >
          <ListaEditavel
            entidade="divida"
            planId={plano.id}
            clientId={id}
            vazio="Sem dívidas ativas."
            linhas={dividas.map((d) => ({
              id: d.id,
              titulo: d.descricao,
              detalhe: d.fim
                ? `Até ${MESES[Number(d.fim.slice(5, 7)) - 1]}/${d.fim.slice(0, 4)}`
                : undefined,
              alerta: d.fim
                ? undefined
                : "Sem última parcela — a projeção a trata como perpétua",
              valor: `R$ ${escreverMoeda(Number(d.parcela ?? 0))}`,
              bruto: d,
            }))}
          />
        </Card>

        {base && (
          <Card
            titulo="Orçamento por controlabilidade"
            icone={Scale}
            tom="roxo"
            total={base.orcamentoTotal}
          >
            <div className="flex flex-col gap-4">
              {base.orcamento
                .filter((b) => b.total > 0)
                .map((b) => (
                  <div key={b.bucket} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-baseline gap-4">
                      <span className="font-inter text-sm font-medium text-slate-700">
                        {b.rotulo}
                      </span>
                      <span className="font-inter text-sm text-slate-600 tabular-nums">
                        {formatCurrency(b.total, 2)}
                        <span className="text-slate-400 ml-2">{pct(b.percentual)}</span>
                      </span>
                    </div>
                    <Barra fracao={b.percentual} tom={tomBalde[b.bucket]} />
                  </div>
                ))}
            </div>
            <p className="font-inter text-xs text-slate-400 mt-4">
              Derivado das listas ao lado: cada custo carrega se é fixo ou extra,
              e as parcelas vêm das dívidas. Anuais entram rateados.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function PrecisaPlano({ clienteId }: { clienteId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-poppins text-lg text-brand-950">
        Este cliente ainda não tem um plano
      </p>
      <p className="font-inter text-sm text-slate-500 mt-1 max-w-md">
        Receitas e custos precisam de um plano para existir. Ele leva meio minuto
        para criar — data de início, modo de valor e as taxas.
      </p>
      <Link
        href={`/clientes/${clienteId}/ponto-de-partida/cadastro`}
        className="mt-6 bg-brand-600 hover:bg-brand-900 transition-colors text-white font-poppins font-medium px-4 py-2 rounded-lg text-sm"
      >
        Criar o plano
      </Link>
    </div>
  );
}
