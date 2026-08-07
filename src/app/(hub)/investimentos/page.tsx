import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, CalendarClock, PieChart, RefreshCw } from "lucide-react";
import { listClients } from "@/lib/planning-dal";
import {
  cockpitDeInvestimentos,
  diasEntre,
  formatarData,
  hojeISO,
  vencimentosProximos,
} from "@/lib/investimentos-dal";
import { CLASSE_LABEL, CLASSE_TOM, formatCurrency } from "@/lib/types";
import { Page } from "@/components/layout/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Barra, Card, Linha, Stat, pct } from "@/components/planejamento/primitives";

export const metadata: Metadata = {
  title: "Investimentos — HFC Hub",
};

/** A partir de quantos dias um retrato deixa de ser "a posição de hoje". */
const DIAS_PARA_ENVELHECER = 45;

/**
 * O cockpit da área de Investimentos.
 *
 * A pergunta que ele responde não é "quanto temos sob assessoria" — é "onde
 * preciso olhar hoje". Por isso o cartão de frescor põe o dado mais VELHO no
 * topo, e não a maior carteira: a carteira grande com retrato de ontem não pede
 * nada; a pequena com retrato de três meses atrás pede.
 */
export default async function InvestimentosPage() {
  const [cockpit, clientes, vencimentos] = await Promise.all([
    cockpitDeInvestimentos(),
    listClients(),
    vencimentosProximos(30),
  ]);

  const hoje = hojeISO();
  const nomes = new Map(clientes.map((c) => [c.id, c.nome]));

  const comCarteira = cockpit.carteiras.filter((c) => c.total > 0);
  const ticket = comCarteira.length > 0 ? cockpit.total / comCarteira.length : 0;

  // O dado mais velho primeiro; quem nunca teve retrato vem antes de todos.
  const porFrescor = [...cockpit.carteiras].sort((a, b) => {
    if (a.dataReferencia === b.dataReferencia) return b.total - a.total;
    if (!a.dataReferencia) return -1;
    if (!b.dataReferencia) return 1;
    return a.dataReferencia < b.dataReferencia ? -1 : 1;
  });

  const desatualizados = porFrescor.filter(
    (c) =>
      !c.dataReferencia || diasEntre(c.dataReferencia, hoje) > DIAS_PARA_ENVELHECER,
  ).length;

  return (
    <Page
      title="Investimentos"
      subtitle={
        cockpit.clientesComServico === 0
          ? "Nenhum cliente com o serviço contratado ainda."
          : `${cockpit.clientesComServico} ${
              cockpit.clientesComServico === 1 ? "cliente" : "clientes"
            } com Investimento contratado.`
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Stat
            rotulo="Sob assessoria"
            valor={formatCurrency(cockpit.total, 2)}
            hint="soma do último retrato de cada posição"
          />
          <Stat
            rotulo="Clientes"
            valor={String(cockpit.clientesComServico)}
            hint={`${comCarteira.length} com posição lançada`}
          />
          <Stat
            rotulo="Ticket médio"
            valor={formatCurrency(ticket, 2)}
            hint="entre quem já tem carteira lançada"
          />
          <Stat
            rotulo="Dado desatualizado"
            valor={String(desatualizados)}
            tom={desatualizados > 0 ? "atencao" : "bom"}
            hint={`carteiras sem retrato nos últimos ${DIAS_PARA_ENVELHECER} dias`}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card
            titulo="Frescor dos dados"
            icone={RefreshCw}
            tom={desatualizados > 0 ? "ambar" : "verde"}
          >
            {porFrescor.length === 0 ? (
              <p className="font-inter text-sm text-slate-500 py-2">
                Marque “Investimento” no cadastro de um cliente para ele aparecer
                aqui.
              </p>
            ) : (
              <>
                <ul className="flex flex-col">
                  {porFrescor.map((c) => {
                    const dias = c.dataReferencia
                      ? diasEntre(c.dataReferencia, hoje)
                      : null;
                    const velho = dias === null || dias > DIAS_PARA_ENVELHECER;

                    return (
                      <li key={c.clientId}>
                        <Link
                          href={`/clientes/${c.clientId}/investimentos`}
                          className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 last:border-none hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition-colors"
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <Avatar src={c.avatarUrl} nome={c.nome} size={32} />
                            <span className="min-w-0">
                              <span className="block font-inter text-sm font-medium text-slate-700 truncate">
                                {c.nome}
                              </span>
                              <span
                                className={`block font-inter text-xs ${
                                  velho ? "text-amber-600" : "text-slate-500"
                                }`}
                              >
                                {dias === null
                                  ? "sem posição lançada"
                                  : `posição em ${formatarData(c.dataReferencia)}${
                                      dias > 0 ? ` · ${dias} dias` : " · hoje"
                                    }`}
                              </span>
                            </span>
                          </span>
                          <span className="font-inter text-sm text-slate-600 tabular-nums shrink-0">
                            {formatCurrency(c.total, 2)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <p className="font-inter text-xs text-slate-400 mt-4">
                  Ordenado pelo dado mais velho, não pela maior carteira. Enquanto
                  a carga é manual, esta é a lista de trabalho da área.
                </p>
              </>
            )}
          </Card>

          <Card
            titulo="Alocação agregada"
            icone={PieChart}
            tom="brand"
            total={cockpit.total}
          >
            {cockpit.total > 0 ? (
              <div className="flex flex-col gap-4">
                {cockpit.porClasse.map(({ classe, valor }) => (
                  <div key={classe} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-baseline gap-4">
                      <span className="font-inter text-sm font-medium text-slate-700">
                        {CLASSE_LABEL[classe] ?? classe}
                      </span>
                      <span className="font-inter text-sm text-slate-600 tabular-nums">
                        {formatCurrency(valor, 2)}
                        <span className="text-slate-400 ml-2">
                          {pct(valor / cockpit.total)}
                        </span>
                      </span>
                    </div>
                    <Barra
                      fracao={valor / cockpit.total}
                      tom={CLASSE_TOM[classe] ?? "bg-slate-400"}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-inter text-sm text-slate-500 py-2">
                Sem posições lançadas.
              </p>
            )}
          </Card>

          <Card titulo="Vencimentos em 30 dias" icone={CalendarClock} tom="ambar">
            {vencimentos.length === 0 ? (
              <p className="font-inter text-sm text-slate-500 py-2">
                Nada vencendo nos próximos 30 dias.
              </p>
            ) : (
              vencimentos.map(({ posicao, clientId, dias }) => (
                <Linha
                  key={posicao.id}
                  nome={posicao.nome}
                  detalhe={`${nomes.get(clientId) ?? "—"} · ${
                    dias < 0
                      ? `venceu ${-dias} dias atrás`
                      : `${formatarData(posicao.vencimento)} · em ${dias} ${
                          dias === 1 ? "dia" : "dias"
                        }`
                  }`}
                  valor={posicao.valorAtual}
                  destaque={dias < 0}
                />
              ))
            )}
          </Card>

          <Card titulo="Concentração por emissor" icone={AlertTriangle} tom="vermelho">
            {cockpit.porEmissor.length === 0 ? (
              <p className="font-inter text-sm text-slate-500 py-2">
                Sem posições lançadas.
              </p>
            ) : (
              <>
                {cockpit.porEmissor.slice(0, 12).map((e) => (
                  <Linha
                    key={e.emissor}
                    nome={e.emissor}
                    detalhe={`${e.posicoes} ${
                      e.posicoes === 1 ? "posição" : "posições"
                    } · ${pct(e.valor / cockpit.total)} da carteira total`}
                    valor={e.valor}
                  />
                ))}
                {cockpit.porEmissor.length > 12 && (
                  <p className="font-inter text-xs text-slate-400 mt-3">
                    Mostrando os 12 maiores de {cockpit.porEmissor.length} emissores.
                  </p>
                )}
                <p className="font-inter text-xs text-slate-400 mt-4">
                  Concentração é o total por emissor somando todos os clientes. O
                  cruzamento com o limite do FGC e com a nota de risco de crédito de
                  cada banco entra numa fase seguinte — hoje esta lista mostra onde
                  olhar, não se há problema.
                </p>
              </>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
