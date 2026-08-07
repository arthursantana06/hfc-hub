"use client";

import { useState } from "react";
import { CreditCard, ReceiptText } from "lucide-react";
import { Card } from "@/components/planejamento/primitives";
import { escreverMoeda, lerMoeda } from "@/lib/forms/planejamento";
import {
  faturasPorCartao,
  type CardPurchaseLine,
} from "@/lib/planning/cartao";
import { fromISO, intervalo, rotuloCurto } from "@/lib/planning/period";
import { GradeEditavel, type LinhaGrid } from "./GradeEditavel";

const COLUNAS_COMPRA = ["descricao", "cartao", "valor_parcela", "parcelas", "inicio"];

/**
 * A seção Cartão: o grid de compras parceladas e, abaixo, a fatura projetada
 * cartão × mês derivada dele em tempo real.
 *
 * A tabela de fatura lê as linhas do próprio grid (via `aoMudarLinhas`), não o
 * servidor: é o único jeito de ela acompanhar a digitação, já que as actions
 * do grid não revalidam a rota.
 */
export function PainelCartao({
  linhas: linhasIniciais,
  planId,
  clientId,
  inicioDoPlano,
  comPin,
}: {
  linhas: LinhaGrid[];
  planId: string;
  clientId: string;
  /** `financial_plan.inicio` (ISO) — o primeiro mês da janela de fatura. */
  inicioDoPlano: string;
  comPin?: boolean;
}) {
  const [linhas, setLinhas] = useState(linhasIniciais);

  const inicio = fromISO(inicioDoPlano);
  const meses = intervalo(inicio, inicio + 11);

  const compras = linhas
    .map(paraCompra)
    .filter((c): c is CardPurchaseLine => c !== null);
  const porCartao = faturasPorCartao(compras, meses);

  return (
    <div className="flex flex-col gap-6">
      <Card titulo="Compras parceladas" icone={CreditCard} tom="roxo">
        <GradeEditavel
          titulo="Compras parceladas no cartão"
          entidade="compra_cartao"
          colunas={COLUNAS_COMPRA}
          linhas={linhasIniciais}
          planId={planId}
          clientId={clientId}
          comPin={comPin}
          colunaTotal="valor_parcela"
          vazio="Nenhuma compra parcelada — a fatura projetada nasce daqui."
          aoMudarLinhas={setLinhas}
        />
      </Card>

      <Card titulo="Fatura projetada — 12 meses" icone={ReceiptText} tom="brand">
        {porCartao.length === 0 ? (
          <p className="font-inter text-sm text-slate-500 py-2">
            Cadastre compras acima para ver a fatura de cada cartão, mês a mês.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0">
              <caption className="sr-only">Fatura projetada por cartão e mês</caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="px-2 pb-2 font-inter text-xs font-medium text-slate-400 text-left"
                  >
                    Cartão
                  </th>
                  {meses.map((m) => (
                    <th
                      key={m}
                      scope="col"
                      className="px-2 pb-2 font-inter text-xs font-medium text-slate-400 text-right whitespace-nowrap"
                    >
                      {rotuloCurto(m)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {porCartao.map((c) => (
                  <tr key={c.cartao}>
                    <th
                      scope="row"
                      className="px-2 py-1.5 border-t border-slate-50 font-inter text-sm font-medium text-slate-700 text-left whitespace-nowrap"
                    >
                      {c.cartao}
                    </th>
                    {c.valores.map((v, i) => (
                      <td
                        key={meses[i]}
                        className="px-2 py-1.5 border-t border-slate-50 font-inter text-sm text-right tabular-nums text-slate-600"
                      >
                        {v === 0 ? "—" : escreverMoeda(v)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th
                    scope="row"
                    className="px-2 pt-2 border-t border-slate-200 font-inter text-sm font-medium text-slate-500 text-left"
                  >
                    Total
                  </th>
                  {meses.map((m, i) => {
                    const total = porCartao.reduce((a, c) => a + c.valores[i], 0);
                    return (
                      <td
                        key={m}
                        className="px-2 pt-2 border-t border-slate-200 font-inter text-sm text-right tabular-nums font-medium text-brand-950"
                      >
                        {total === 0 ? "—" : escreverMoeda(total)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/** Linha do grid (textos de tela) → linha do cálculo. Incompleta = fora. */
function paraCompra(l: LinhaGrid): CardPurchaseLine | null {
  const valor = lerMoeda(l.valores.valor_parcela ?? "");
  const parcelas = Number(l.valores.parcelas ?? "");
  const mes = l.valores.inicio ?? "";

  if (valor === null || valor === 0) return null;
  if (!Number.isInteger(parcelas) || parcelas < 1) return null;
  if (!/^\d{4}-\d{2}$/.test(mes)) return null;

  return {
    descricao: l.valores.descricao ?? "",
    cartao: (l.valores.cartao ?? "").trim() || "Sem cartão",
    valorParcela: valor,
    parcelas,
    inicio: fromISO(`${mes}-01`),
  };
}
