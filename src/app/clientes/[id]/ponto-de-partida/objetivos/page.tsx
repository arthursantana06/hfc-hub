import { Target, Repeat } from "lucide-react";
import { getClient, getPlanoAtivo, linhasDoCliente } from "@/lib/planning-dal";
import { totalVitalicio } from "@/lib/planning/changes";
import { formatCurrency } from "@/lib/types";
import { escreverMoeda } from "@/lib/forms/planejamento";
import { Card, Stat } from "@/components/planejamento/primitives";
import { ListaEditavel } from "@/components/planejamento/ListaEditavel";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default async function Objetivos({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cliente, plano, objetivos] = await Promise.all([
    getClient(id),
    getPlanoAtivo(id),
    linhasDoCliente("goal", id),
  ]);

  const idadeAtual = idadeDe(cliente?.nascimento ?? null);
  const curto = objetivos.filter((g) => g.prazo === "curto");
  const longo = objetivos.filter((g) => g.prazo === "longo");

  // Valor negativo é entrada de dinheiro, não compra.
  const saidas = curto.reduce((a, g) => a + Math.max(0, Number(g.alvo)), 0);
  const entradas = curto.reduce((a, g) => a + Math.min(0, Number(g.alvo)), 0);
  const totalLongo = longo.reduce(
    (a, g) =>
      a +
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
      ),
    0,
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Stat
          rotulo="Objetivos de curto prazo"
          valor={formatCurrency(saidas, 2)}
          hint={
            entradas < 0
              ? `${formatCurrency(-entradas, 2)} de entradas previstas`
              : `${curto.length} ${curto.length === 1 ? "objetivo" : "objetivos"} com data`
          }
        />
        <Stat
          rotulo="Objetivos recorrentes"
          valor={formatCurrency(totalLongo, 2)}
          hint={idadeAtual ? `custo até os 100, hoje com ${idadeAtual}` : "informe o nascimento"}
        />
        <Stat
          rotulo="Concluídos"
          valor={`${objetivos.filter((g) => g.concluido).length} de ${objetivos.length}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card titulo="Curto prazo" icone={Target} tom="brand">
          <ListaEditavel
            entidade="objetivo"
            planId={plano?.id ?? null}
            clientId={id}
            vazio="Nenhum objetivo com data marcada."
            linhas={curto
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
          />
        </Card>

        <Card titulo="Recorrentes" icone={Repeat} tom="roxo">
          <ListaEditavel
            entidade="objetivo"
            planId={plano?.id ?? null}
            clientId={id}
            vazio="Nenhum objetivo recorrente."
            linhas={longo.map((g) => ({
              id: g.id,
              titulo: g.titulo,
              detalhe: g.periodicidade_anos
                ? `${escreverMoeda(Number(g.alvo))} a cada ${g.periodicidade_anos} ${
                    g.periodicidade_anos === 1 ? "ano" : "anos"
                  }`
                : "sem periodicidade",
              valor: `R$ ${escreverMoeda(
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
                ),
              )}`,
              bruto: g,
            }))}
            extra={
              longo.length > 0 ? (
                <p className="font-inter text-xs text-slate-400 mt-4">
                  O total é o custo de repetir a compra até os 100 anos:
                  valor × (100 − idade) ÷ periodicidade. Soma nominal, sem
                  desconto de juros — como na planilha de origem.
                </p>
              ) : null
            }
          />
        </Card>
      </div>
    </div>
  );
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
