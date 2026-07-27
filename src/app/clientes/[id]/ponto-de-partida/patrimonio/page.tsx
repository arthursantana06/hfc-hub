import { Building2, CreditCard, LineChart, Scale } from "lucide-react";
import { getPlanoAtivo, linhasDoCliente } from "@/lib/planning-dal";
import { formatCurrency } from "@/lib/types";
import { escreverMoeda } from "@/lib/forms/planejamento";
import { Barra, Card, Stat, pct } from "@/components/planejamento/primitives";
import { ListaEditavel } from "@/components/planejamento/ListaEditavel";

const CLASSE_LABEL: Record<string, string> = {
  renda_fixa: "Renda Fixa",
  renda_variavel: "Renda Variável",
  previdencia: "Previdência",
};

const CLASSE_TOM: Record<string, string> = {
  renda_fixa: "bg-brand-600",
  renda_variavel: "bg-amber-500",
  previdencia: "bg-violet-500",
};

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export default async function Patrimonio({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [plano, ativos, passivos, investimentos, dividas] = await Promise.all([
    getPlanoAtivo(id),
    linhasDoCliente("asset", id),
    linhasDoCliente("liability", id),
    linhasDoCliente("investment", id),
    linhasDoCliente("debt", id),
  ]);

  const somaAtivos = ativos.reduce((a, x) => a + Number(x.valor), 0);
  const somaPassivos = passivos.reduce((a, x) => a + Number(x.valor), 0);
  const carteira = investimentos.reduce((a, x) => a + Number(x.valor), 0);

  // Alocação por classe — o percentual é derivado, nunca guardado.
  const porClasse = new Map<string, number>();
  for (const i of investimentos) {
    porClasse.set(i.classe, (porClasse.get(i.classe) ?? 0) + Number(i.valor));
  }

  const saldoDevedor = dividas.reduce((a, d) => a + mesesRestantes(d) * Number(d.parcela ?? 0), 0);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Stat rotulo="Patrimônio líquido" valor={formatCurrency(somaAtivos - somaPassivos, 2)} />
        <Stat rotulo="Ativos" valor={formatCurrency(somaAtivos, 2)} />
        <Stat rotulo="Passivos" valor={formatCurrency(somaPassivos, 2)} />
        <Stat
          rotulo="Carteira investida"
          valor={formatCurrency(carteira, 2)}
          hint="ponto de partida da projeção"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card titulo="Ativos" icone={Building2} tom="verde" total={somaAtivos}>
          <ListaEditavel
            entidade="ativo"
            planId={plano?.id ?? null}
            clientId={id}
            vazio="Nenhum ativo registrado."
            linhas={ativos.map((a) => ({
              id: a.id,
              titulo: a.nome,
              valor: `R$ ${escreverMoeda(Number(a.valor))}`,
              bruto: a,
            }))}
          />
        </Card>

        <Card titulo="Passivos" icone={Scale} tom="vermelho" total={somaPassivos}>
          <ListaEditavel
            entidade="passivo"
            planId={plano?.id ?? null}
            clientId={id}
            vazio="Nenhum passivo registrado."
            linhas={passivos.map((p) => ({
              id: p.id,
              titulo: p.nome,
              valor: `R$ ${escreverMoeda(Number(p.valor))}`,
              bruto: p,
            }))}
          />
        </Card>

        <Card
          titulo="Carteira de investimentos"
          icone={LineChart}
          tom="brand"
          total={carteira}
        >
          {carteira > 0 && (
            <div className="flex flex-col gap-4 mb-5">
              {[...porClasse].map(([classe, valor]) => (
                <div key={classe} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="font-inter text-sm font-medium text-slate-700">
                      {CLASSE_LABEL[classe] ?? classe}
                    </span>
                    <span className="font-inter text-sm text-slate-600 tabular-nums">
                      {formatCurrency(valor, 2)}
                      <span className="text-slate-400 ml-2">{pct(valor / carteira)}</span>
                    </span>
                  </div>
                  <Barra
                    fracao={valor / carteira}
                    tom={CLASSE_TOM[classe] ?? "bg-slate-400"}
                  />
                </div>
              ))}
            </div>
          )}

          <ListaEditavel
            entidade="investimento"
            planId={plano?.id ?? null}
            clientId={id}
            vazio="Nenhum investimento. A projeção parte de zero de patrimônio."
            linhas={investimentos.map((i) => ({
              id: i.id,
              titulo: i.nome ?? CLASSE_LABEL[i.classe] ?? i.classe,
              detalhe: [CLASSE_LABEL[i.classe], i.instituicao, i.liquidez]
                .filter(Boolean)
                .join(" · "),
              valor: `R$ ${escreverMoeda(Number(i.valor))}`,
              bruto: i,
            }))}
          />
        </Card>

        <Card
          titulo="Dívidas a liquidar"
          icone={CreditCard}
          tom="ambar"
          total={saldoDevedor}
        >
          <ListaEditavel
            entidade="divida"
            planId={plano?.id ?? null}
            clientId={id}
            vazio="Sem dívidas ativas."
            linhas={dividas.map((d) => ({
              id: d.id,
              titulo: d.descricao,
              detalhe: `${escreverMoeda(Number(d.parcela ?? 0))}/mês${
                d.fim ? ` até ${rotulo(d.fim)}` : ""
              }`,
              alerta: d.fim ? undefined : "Sem última parcela — corre para sempre",
              valor: d.fim
                ? `R$ ${escreverMoeda(mesesRestantes(d) * Number(d.parcela ?? 0))}`
                : "—",
              bruto: d,
            }))}
            extra={
              dividas.length > 0 ? (
                <p className="font-inter text-xs text-slate-400 mt-4">
                  Saldo devedor estimado pelo que ainda será pago: parcela × meses
                  restantes. Não desconta juros embutidos — é o desembolso, não o
                  valor presente.
                </p>
              ) : null
            }
          />
        </Card>
      </div>
    </div>
  );
}

type Divida = { inicio: string | null; fim: string | null };

/** Meses de parcela que ainda faltam, contados a partir do início da dívida. */
function mesesRestantes(d: Divida): number {
  if (!d.fim || !d.inicio) return 0;
  const [ai, mi] = d.inicio.split("-").map(Number);
  const [af, mf] = d.fim.split("-").map(Number);
  return Math.max(0, (af * 12 + mf) - (ai * 12 + mi) + 1);
}

const rotulo = (iso: string) => `${MESES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(0, 4)}`;
