"use client";

import { useMemo, useState } from "react";
import { CalendarRange, LineChart } from "lucide-react";
import { formatCurrency } from "@/lib/types";
import { Card } from "./primitives";
import { GraficoFluxo } from "./GraficoFluxo";
import { GraficoPatrimonio } from "./GraficoPatrimonio";
import { TabelaProjecao } from "./TabelaProjecao";

export interface MesProjetado {
  periodo: number;
  rotulo: string;
  rotuloCurto: string;
  ano: number;
  receitas: number;
  despesas: number;
  dividas: number;
  previdencia: number;
  sobras: number;
  objetivos: number;
  patrimonio: number;
  marco?: string;
}

const HORIZONTES = [12, 24, 36, 60, 120] as const;

/**
 * O fluxo projetado, com o horizonte na mão do planejador.
 *
 * Antes a janela era fixa em `meses_curto`, uma premissa gravada no plano: para
 * ver dois anos em vez de três era preciso editar o plano e voltar. Agora o
 * horizonte é uma pergunta da tela, não do dado — mudar a lente não muda o
 * plano.
 *
 * A alternância nominal/real é o mesmo raciocínio. As duas séries chegam
 * calculadas do servidor (cada projeção custa menos de um milissegundo), e o
 * botão só escolhe qual mostrar: "com inflação" é o que vai cair na conta do
 * cliente, "sem inflação" é o que aquilo compra em dinheiro de hoje. As duas
 * leituras são necessárias, e nenhuma delas é a resposta sozinha.
 */
export function FluxoProjetado({
  nominal,
  real,
  modoDoPlano,
  inflacao,
}: {
  nominal: MesProjetado[];
  real: MesProjetado[];
  modoDoPlano: "nominal" | "real";
  inflacao: number;
}) {
  const [horizonte, setHorizonte] = useState<number>(36);
  const [comInflacao, setComInflacao] = useState(modoDoPlano === "nominal");

  const serie = comInflacao ? nominal : real;
  const janela = useMemo(() => serie.slice(0, horizonte), [serie, horizonte]);
  const resumo = useMemo(() => porAno(janela), [janela]);

  const totalSobras = janela.reduce((a, m) => a + m.sobras, 0);
  const totalObjetivos = janela.reduce((a, m) => a + m.objetivos, 0);
  const patrimonioFinal = janela.length ? janela[janela.length - 1].patrimonio : 0;

  return (
    <>
      <Card
        titulo="Fluxo projetado"
        icone={CalendarRange}
        acao={
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Alternador
              opcoes={HORIZONTES.map((h) => ({
                valor: String(h),
                rotulo: h < 24 ? `${h}m` : `${h / 12}a`,
              }))}
              valor={String(horizonte)}
              onChange={(v) => setHorizonte(Number(v))}
              rotulo="Horizonte da projeção"
            />
            <Alternador
              opcoes={[
                { valor: "nominal", rotulo: "Com inflação" },
                { valor: "real", rotulo: "Hoje" },
              ]}
              valor={comInflacao ? "nominal" : "real"}
              onChange={(v) => setComInflacao(v === "nominal")}
              rotulo="Modo de valor"
            />
          </div>
        }
      >
        <GraficoFluxo
          pontos={janela.map((m) => ({
            rotulo: m.rotuloCurto,
            entradas: m.receitas,
            saidas: -(m.despesas + m.dividas + m.previdencia),
            sobras: m.sobras,
            marco: m.marco,
          }))}
        />

        <p className="font-inter text-xs text-slate-400 mt-4">
          {comInflacao
            ? `Valores correntes: receitas e custos sobem ${(inflacao * 100).toFixed(1)}% ao ano. É o número que vai aparecer no extrato.`
            : "Valores em poder de compra de hoje: a inflação sai dos dois lados e o retorno já vem descontado dela."}
        </p>

        {/* A tabela resumo — o que o gráfico mostra como tendência, somado ano
            a ano. É o que o planejador lê em voz alta na reunião. */}
        <div className="mt-5 border-t border-slate-100 pt-4 overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">
              Resumo do fluxo de caixa por ano, nos próximos {horizonte} meses
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="text-left font-inter text-xs uppercase tracking-wide text-slate-400 font-medium pb-2"
                >
                  Ano
                </th>
                {["Entradas", "Saídas", "Sobras", "Objetivos", "Patrimônio"].map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className="text-right font-inter text-xs uppercase tracking-wide text-slate-400 font-medium pb-2"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resumo.map((r) => (
                <tr key={r.ano} className="border-t border-slate-100">
                  <th
                    scope="row"
                    className="py-2 text-left font-inter font-normal text-slate-700 whitespace-nowrap"
                  >
                    {r.ano}
                    <span className="ml-2 font-inter text-xs text-slate-400">
                      {r.meses} {r.meses === 1 ? "mês" : "meses"}
                    </span>
                  </th>
                  <Celula valor={r.entradas} />
                  <Celula valor={r.saidas} />
                  <Celula valor={r.sobras} destaque />
                  <Celula valor={r.objetivos} />
                  <Celula valor={r.patrimonio} />
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <th
                  scope="row"
                  className="py-2 text-left font-inter font-semibold text-brand-950 whitespace-nowrap"
                >
                  Total
                </th>
                <Celula valor={resumo.reduce((a, r) => a + r.entradas, 0)} forte />
                <Celula valor={resumo.reduce((a, r) => a + r.saidas, 0)} forte />
                <Celula valor={totalSobras} forte />
                <Celula valor={totalObjetivos} forte />
                <Celula valor={patrimonioFinal} forte />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card titulo="Patrimônio nos mesmos meses" icone={LineChart} tom="brand">
        <GraficoPatrimonio
          pontos={janela.map((m) => ({
            rotulo: m.rotuloCurto,
            valor: m.patrimonio,
            marco: m.marco,
          }))}
        />
        <TabelaProjecao
          rotulo="mês"
          linhas={janela.map((m) => ({
            chave: String(m.periodo),
            rotulo: m.rotuloCurto,
            marco: m.marco,
            valores: [
              m.receitas,
              m.despesas,
              m.dividas,
              m.sobras,
              m.objetivos,
              m.patrimonio,
            ],
          }))}
          colunas={["Receitas", "Despesas", "Dívidas", "Sobras", "Objetivos", "Patrimônio"]}
        />
      </Card>
    </>
  );
}

interface ResumoAno {
  ano: number;
  meses: number;
  entradas: number;
  saidas: number;
  sobras: number;
  objetivos: number;
  /** Estoque: vale o do último mês do ano dentro da janela. */
  patrimonio: number;
}

/**
 * Agrega a janela por ano.
 *
 * Anos parciais aparecem com a contagem de meses ao lado — sem isso, o primeiro
 * e o último ano da janela pareceriam anos ruins quando são só anos curtos.
 */
function porAno(meses: MesProjetado[]): ResumoAno[] {
  const mapa = new Map<number, ResumoAno>();

  for (const m of meses) {
    const atual = mapa.get(m.ano) ?? {
      ano: m.ano,
      meses: 0,
      entradas: 0,
      saidas: 0,
      sobras: 0,
      objetivos: 0,
      patrimonio: 0,
    };

    atual.meses += 1;
    atual.entradas += m.receitas;
    atual.saidas += m.despesas + m.dividas + m.previdencia;
    atual.sobras += m.sobras;
    atual.objetivos += m.objetivos;
    atual.patrimonio = m.patrimonio;
    mapa.set(m.ano, atual);
  }

  return [...mapa.values()].sort((a, b) => a.ano - b.ano);
}

function Celula({
  valor,
  destaque = false,
  forte = false,
}: {
  valor: number;
  destaque?: boolean;
  forte?: boolean;
}) {
  const cor = valor < 0 ? "text-red-700" : destaque ? "text-emerald-700" : "text-slate-600";
  return (
    <td
      className={`py-2 text-right tabular-nums font-inter whitespace-nowrap ${
        forte ? "font-semibold text-brand-950" : cor
      }`}
    >
      {valor === 0 ? "—" : formatCurrency(valor, 0)}
    </td>
  );
}

/** Grupo de botões que se comportam como um seletor — sem abrir painel. */
function Alternador({
  opcoes,
  valor,
  onChange,
  rotulo,
}: {
  opcoes: { valor: string; rotulo: string }[];
  valor: string;
  onChange: (v: string) => void;
  rotulo: string;
}) {
  return (
    <div
      role="group"
      aria-label={rotulo}
      className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5"
    >
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={o.valor === valor}
          onClick={() => onChange(o.valor)}
          className={`font-inter text-xs px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
            o.valor === valor
              ? "bg-white text-brand-950 shadow-sm font-medium"
              : "text-slate-500 hover:text-brand-950"
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
