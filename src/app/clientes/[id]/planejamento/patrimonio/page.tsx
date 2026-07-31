import { Building2, CreditCard, LineChart, Scale } from "lucide-react";
import { getPlanInput, getPlanoDoPeriodo, linhasDoPlano } from "@/lib/planning-dal";
import { saldoDevedorEm, summarizeBalance } from "@/lib/planning/balance";
import { fromISO } from "@/lib/planning/period";
import { formatCurrency } from "@/lib/types";
import { escreverMoeda } from "@/lib/forms/planejamento";
import { Barra, Card, SemPlano, Stat, pct } from "@/components/planejamento/primitives";
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

/**
 * O balanço do período.
 *
 * Duas coisas mudaram na Fase 2 e é aqui que se veem: a carteira investida
 * passou a ser ativo (antes o patrimônio líquido a ignorava, embora a projeção
 * partisse dela), e o saldo devedor das dívidas passou a ser passivo sem ser
 * redigitado — a dívida já sabe quanto falta pagar.
 */
export default async function Patrimonio({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string }>;
}) {
  const [{ id }, { periodo }] = await Promise.all([params, searchParams]);
  const plano = await getPlanoDoPeriodo(id, periodo);

  if (!plano) return <SemPlano clienteId={id} />;

  const [plan, ativos, passivos, investimentos, dividas] = await Promise.all([
    getPlanInput(id, plano.id),
    linhasDoPlano("asset", plano.id),
    linhasDoPlano("liability", plano.id),
    linhasDoPlano("investment", plano.id),
    linhasDoPlano("debt", plano.id),
  ]);

  const mesDoPeriodo = fromISO(plano.inicio);
  const balanco = plan
    ? summarizeBalance(plan)
    : summarizeBalance({
        assumptions: { inicio: mesDoPeriodo } as never,
        ativosNaoInvestidos: soma(ativos),
        passivosDeclarados: soma(passivos),
        patrimonioInicial: soma(investimentos),
        debts: dividas.map(paraDivida),
      });

  const carteira = balanco.carteira;

  // Alocação por classe — o percentual é derivado, nunca guardado.
  const porClasse = new Map<string, number>();
  for (const i of investimentos) {
    porClasse.set(i.classe, (porClasse.get(i.classe) ?? 0) + Number(i.valor));
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Stat
          rotulo="Patrimônio líquido"
          valor={formatCurrency(balanco.liquido, 2)}
          tom={balanco.liquido >= 0 ? "neutro" : "ruim"}
          hint="ativos e carteira, menos passivos e dívidas"
        />
        <Stat
          rotulo="Ativos"
          valor={formatCurrency(balanco.ativos, 2)}
          hint={`${formatCurrency(carteira, 2)} investidos`}
        />
        <Stat
          rotulo="Passivos"
          valor={formatCurrency(balanco.passivos, 2)}
          hint={`${formatCurrency(balanco.saldoDevedor, 2)} de saldo devedor`}
        />
        <Stat
          rotulo="Carteira investida"
          valor={formatCurrency(carteira, 2)}
          hint="ponto de partida da projeção"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card titulo="Bens" icone={Building2} tom="verde" total={balanco.ativosNaoInvestidos}>
          <ListaEditavel
            entidade="ativo"
            planId={plano.id}
            clientId={id}
            vazio="Nenhum bem registrado."
            linhas={ativos.map((a) => ({
              id: a.id,
              titulo: a.nome,
              valor: `R$ ${escreverMoeda(Number(a.valor))}`,
              bruto: a,
            }))}
            extra={
              <p className="font-inter text-xs text-slate-400 mt-4">
                Imóvel, veículo, participação — o que tem valor mas não rende
                juros. A carteira investida está no cartão ao lado e entra no
                mesmo patrimônio líquido.
              </p>
            }
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
            planId={plano.id}
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
          titulo="Dívidas"
          icone={CreditCard}
          tom="ambar"
          total={balanco.saldoDevedor}
        >
          <ListaEditavel
            entidade="divida"
            planId={plano.id}
            clientId={id}
            vazio="Sem dívidas neste período."
            linhas={dividas.map((d) => ({
              id: d.id,
              titulo: d.descricao,
              detalhe: `${escreverMoeda(Number(d.parcela ?? 0))}/mês${
                d.fim ? ` até ${rotulo(d.fim)}` : ""
              }${d.saldo !== null ? " · saldo informado" : ""}`,
              alerta: d.fim ? undefined : "Sem última parcela — corre para sempre",
              valor: `R$ ${escreverMoeda(saldoDevedorEm(paraDivida(d), mesDoPeriodo))}`,
              bruto: d,
            }))}
            extra={
              dividas.length > 0 ? (
                <p className="font-inter text-xs text-slate-400 mt-4">
                  O valor à direita é o saldo devedor, e é ele que entra no
                  passivo do balanço. Sem saldo informado, estimamos por parcela
                  × meses restantes — o desembolso que falta, sem descontar os
                  juros embutidos.
                </p>
              ) : null
            }
          />
        </Card>

        <Card
          titulo="Outros passivos"
          icone={Scale}
          tom="vermelho"
          total={balanco.passivosDeclarados}
        >
          <ListaEditavel
            entidade="passivo"
            planId={plano.id}
            clientId={id}
            vazio="Nenhum passivo fora das dívidas."
            linhas={passivos.map((p) => ({
              id: p.id,
              titulo: p.nome,
              valor: `R$ ${escreverMoeda(Number(p.valor))}`,
              bruto: p,
            }))}
            extra={
              <p className="font-inter text-xs text-slate-400 mt-4">
                Só o que não tem parcela mensal. O que tem vive como dívida, e
                entra no balanço a partir dela — cadastrar nos dois lugares
                contaria a mesma coisa duas vezes.
              </p>
            }
          />
        </Card>
      </div>
    </div>
  );
}

const soma = (linhas: { valor: number }[]) =>
  linhas.reduce((a, x) => a + Number(x.valor), 0);

type DividaBruta = {
  descricao?: string;
  parcela: number | null;
  inicio: string | null;
  fim: string | null;
  saldo: number | null;
};

const paraDivida = (d: DividaBruta) => ({
  descricao: d.descricao ?? "",
  parcela: Number(d.parcela ?? 0),
  inicio: d.inicio ? fromISO(d.inicio) : null,
  fim: d.fim ? fromISO(d.fim) : null,
  saldo: d.saldo === null ? null : Number(d.saldo),
});

const rotulo = (iso: string) => `${MESES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(0, 4)}`;
