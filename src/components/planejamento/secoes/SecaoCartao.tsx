import { comprasDeCartao } from "@/lib/planning-dal";
import { ENTIDADES, valoresDoRegistro } from "@/lib/forms/planejamento";
import { PainelCartao } from "@/components/planejamento/grade/PainelCartao";
import type { SecaoProps } from "./tipos";

/** Cartão — compras parceladas e a fatura projetada derivada delas. */
export async function SecaoCartao({ clienteId, plano }: SecaoProps) {
  const compras = await comprasDeCartao(plano.id);

  return (
    <div className="max-w-7xl mx-auto">
      <PainelCartao
        planId={plano.id}
        clientId={clienteId}
        inicioDoPlano={plano.inicio}
        comPin={plano.tipo === "real"}
        linhas={compras.map((c) => ({
          id: c.id,
          valores: valoresDoRegistro(ENTIDADES.compra_cartao, c),
          persistencia: c.persistencia,
        }))}
      />
    </div>
  );
}
