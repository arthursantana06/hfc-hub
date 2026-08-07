import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarClock, Landmark, PieChart, Wallet } from "lucide-react";
import { getClient } from "@/lib/planning-dal";
import {
  carteiraDoCliente,
  diasEntre,
  formatarData,
  hojeISO,
  vencimentosProximos,
  type Posicao,
} from "@/lib/investimentos-dal";
import {
  CLASSE_LABEL,
  CLASSE_TOM,
  formatCurrency,
  INDEXADOR_LABEL,
  rotuloDaTaxa,
  TITULAR_LABEL,
} from "@/lib/types";
import { escreverMoeda } from "@/lib/forms/planejamento";
import {
  Barra,
  Card,
  Linha,
  SemServicoInvestimento,
  Stat,
  pct,
} from "@/components/planejamento/primitives";
import { ListaEditavel } from "@/components/planejamento/ListaEditavel";
import { salvarPosicao } from "@/lib/actions/investimentos";

export const metadata: Metadata = {
  title: "Investimentos — HFC Hub",
};

/** A partir de quantos dias um retrato deixa de ser "a posição de hoje". */
const DIAS_PARA_ENVELHECER = 45;

/**
 * A carteira real do cliente.
 *
 * Não se confunde com a carteira do planejamento (`investment`, na aba
 * Patrimônio): lá é um número que o planejador digita para a projeção partir de
 * algum lugar; aqui são as posições de verdade, com emissor, vencimento e custo.
 * As duas vão se reconciliar depois — por ora convivem, e é de propósito.
 *
 * Toda tela desta área mostra a DATA do valor ao lado do valor. A ingestão
 * automática ainda não existe, e mesmo quando existir será um arquivo do dia
 * anterior: um total sem data seria uma promessa de tempo real que o dado não
 * cumpre.
 */
export default async function Investimentos({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await getClient(id);
  if (!cliente) notFound();

  if (!cliente.temInvestimento) {
    return (
      <>
        <Cabecalho subtitulo="Serviço não contratado." />
        <div className="flex-1 overflow-y-auto p-8">
          <SemServicoInvestimento clienteId={id} />
        </div>
      </>
    );
  }

  const [carteira, vencimentos] = await Promise.all([
    carteiraDoCliente(id),
    vencimentosProximos(90, id),
  ]);

  const hoje = hojeISO();
  const atraso = carteira.dataMaisAntiga
    ? diasEntre(carteira.dataMaisAntiga, hoje)
    : null;
  const velho = atraso !== null && atraso > DIAS_PARA_ENVELHECER;

  const posicoes = carteira.posicoes.length;

  return (
    <>
      <Cabecalho
        subtitulo={
          posicoes === 0
            ? "Nenhuma posição lançada ainda."
            : `${posicoes} ${posicoes === 1 ? "posição" : "posições"} em ${
                carteira.contas.length
              } ${carteira.contas.length === 1 ? "conta" : "contas"}.`
        }
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Stat
              rotulo="Carteira"
              valor={formatCurrency(carteira.total, 2)}
              hint="soma do último retrato de cada posição"
            />
            <Stat
              rotulo="Contas"
              valor={String(carteira.contas.length)}
              hint={
                carteira.contas
                  .map((c) => c.conta.instituicao)
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .join(" · ") || "nenhuma cadastrada"
              }
            />
            <Stat rotulo="Posições" valor={String(posicoes)} />
            <Stat
              rotulo="Posição em"
              valor={formatarData(carteira.dataReferencia)}
              tom={velho ? "atencao" : "neutro"}
              hint={
                atraso === null
                  ? "sem valor lançado"
                  : velho
                    ? `a mais antiga tem ${atraso} dias — atualize antes de decidir`
                    : "dado recente"
              }
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card
              titulo="Alocação por classe"
              icone={PieChart}
              tom="brand"
              total={carteira.total}
            >
              {carteira.total > 0 ? (
                <div className="flex flex-col gap-4">
                  {carteira.porClasse.map(({ classe, valor }) => (
                    <div key={classe} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-baseline gap-4">
                        <span className="font-inter text-sm font-medium text-slate-700">
                          {CLASSE_LABEL[classe] ?? classe}
                        </span>
                        <span className="font-inter text-sm text-slate-600 tabular-nums">
                          {formatCurrency(valor, 2)}
                          <span className="text-slate-400 ml-2">
                            {pct(valor / carteira.total)}
                          </span>
                        </span>
                      </div>
                      <Barra
                        fracao={valor / carteira.total}
                        tom={CLASSE_TOM[classe] ?? "bg-slate-400"}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-inter text-sm text-slate-500 py-2">
                  A alocação aparece quando houver posição com valor lançado.
                </p>
              )}
            </Card>

            <Card titulo="Vencimentos em 90 dias" icone={CalendarClock} tom="ambar">
              {vencimentos.length === 0 ? (
                <p className="font-inter text-sm text-slate-500 py-2">
                  Nada vencendo nos próximos 90 dias.
                </p>
              ) : (
                <>
                  {vencimentos.map(({ posicao, dias }) => (
                    <Linha
                      key={posicao.id}
                      nome={posicao.nome}
                      detalhe={
                        dias < 0
                          ? `venceu em ${formatarData(posicao.vencimento)} — ${-dias} dias atrás`
                          : `${formatarData(posicao.vencimento)} · em ${dias} ${
                              dias === 1 ? "dia" : "dias"
                            }`
                      }
                      valor={posicao.valorAtual}
                      destaque={dias < 0}
                    />
                  ))}
                  <p className="font-inter text-xs text-slate-400 mt-4">
                    Vencido e não reinvestido aparece aqui em negrito, por até 30
                    dias — é dinheiro parado, não histórico.
                  </p>
                </>
              )}
            </Card>
          </div>

          <Card titulo="Contas" icone={Landmark} tom="roxo">
            <ListaEditavel
              entidade="conta_investimento"
              clientId={id}
              vazio="Nenhuma conta cadastrada. Comece por aqui — a posição pertence a uma conta."
              linhas={carteira.contas.map(({ conta, total, posicoes: suas }) => ({
                id: conta.id,
                titulo: conta.apelido,
                detalhe: [
                  conta.instituicao,
                  TITULAR_LABEL[conta.titular_tipo],
                  conta.numero ? `conta ${conta.numero}` : null,
                  `${suas.length} ${suas.length === 1 ? "posição" : "posições"}`,
                ]
                  .filter(Boolean)
                  .join(" · "),
                valor: `R$ ${escreverMoeda(total)}`,
                bruto: conta,
              }))}
            />
          </Card>

          {carteira.contas.map(({ conta, posicoes: suas, total }) => (
            <Card
              key={conta.id}
              titulo={`Posições · ${conta.apelido}`}
              icone={Wallet}
              tom="brand"
              total={total}
            >
              <ListaEditavel
                entidade="posicao"
                clientId={id}
                accountId={conta.id}
                acao={salvarPosicao}
                vazio="Nenhuma posição nesta conta."
                linhas={suas.map((p) => ({
                  id: p.id,
                  titulo: p.nome,
                  detalhe: detalheDaPosicao(p),
                  alerta: alertaDaPosicao(p, hoje),
                  valor: `R$ ${escreverMoeda(p.valorAtual)}`,
                  // O valor e a data são campos virtuais do formulário: moram em
                  // `position_snapshot`, então precisam ser devolvidos à mão para
                  // que a edição venha preenchida.
                  bruto: {
                    ...p,
                    valor_bruto: p.valorAtual,
                    data_referencia: p.dataReferencia,
                  },
                }))}
              />
            </Card>
          ))}

          <p className="font-inter text-xs text-slate-400">
            Toda posição aqui é lançada à mão, e continuará podendo ser: nenhum
            importador traz custo de aquisição ou data de compra, que são a base do
            imposto. Quando a importação existir, ela vai somar retratos novos sem
            tocar no que foi digitado.
          </p>
        </div>
      </div>
    </>
  );
}

function Cabecalho({ subtitulo }: { subtitulo: string }) {
  return (
    <header className="p-8 pb-6 shrink-0 border-b border-slate-200/60 bg-white shadow-sm z-0">
      <h1 className="font-poppins font-medium text-2xl text-brand-950">
        Investimentos
      </h1>
      <p className="font-inter text-sm text-slate-500 mt-1">{subtitulo}</p>
    </header>
  );
}

function detalheDaPosicao(p: Posicao): string {
  const taxa = rotuloDaTaxa(p.indexador, p.taxa === null ? null : Number(p.taxa));
  return [
    CLASSE_LABEL[p.classe] ?? p.classe,
    p.tipo_instrumento,
    p.emissor_nome,
    // Sem taxa informada, ainda vale dizer o indexador — "CDI" sozinho é
    // informação; string vazia (`nao_aplica`) não é.
    taxa ?? (INDEXADOR_LABEL[p.indexador] || null),
    p.vencimento ? `vence ${formatarData(p.vencimento)}` : null,
    p.isento_ir ? "isento de IR" : null,
    p.coberto_fgc ? "FGC" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function alertaDaPosicao(p: Posicao, hoje: string): string | undefined {
  if (!p.dataReferencia) return "Sem valor lançado";
  const dias = diasEntre(p.dataReferencia, hoje);
  if (dias > DIAS_PARA_ENVELHECER) {
    return `Valor de ${formatarData(p.dataReferencia)} — ${dias} dias atrás`;
  }
  return undefined;
}
