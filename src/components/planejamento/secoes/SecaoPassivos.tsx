import { CreditCard, Scale } from "lucide-react";
import { linhasDoPlano } from "@/lib/planning-dal";
import { ENTIDADES, valoresDoRegistro } from "@/lib/forms/planejamento";
import { Card } from "@/components/planejamento/primitives";
import { GradeEditavel } from "@/components/planejamento/grade/GradeEditavel";
import type { SecaoProps } from "./tipos";

/**
 * Passivos — dois grids de propósito.
 *
 * Dívida tem parcela mensal, prazo e credor: pesa no fluxo de caixa e a
 * projeção precisa saber quando ela acaba. Passivo é o resto — o que se deve
 * sem parcela (empréstimo de familiar, tributo em aberto). Misturar os dois
 * num grid só obrigaria metade das colunas a ficar vazia em metade das linhas.
 */
export async function SecaoPassivos({ clienteId, plano }: SecaoProps) {
  const [dividas, passivos] = await Promise.all([
    linhasDoPlano("debt", plano.id),
    linhasDoPlano("liability", plano.id),
  ]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <Card titulo="Dívidas parceladas" icone={CreditCard} tom="ambar">
        <GradeEditavel
          titulo="Dívidas parceladas"
          entidade="divida"
          colunas={["descricao", "parcela", "credor", "inicio", "fim", "saldo"]}
          linhas={dividas.map((d) => ({
            id: d.id,
            valores: valoresDoRegistro(ENTIDADES.divida, d),
            persistencia: d.persistencia,
          }))}
          planId={plano.id}
          clientId={clienteId}
          colunaTotal="parcela"
          vazio="Nenhuma dívida parcelada neste planejamento."
        />
      </Card>

      <Card titulo="Outros passivos" icone={Scale} tom="vermelho">
        <GradeEditavel
          titulo="Outros passivos"
          entidade="passivo"
          colunas={["nome", "valor"]}
          linhas={passivos.map((p) => ({
            id: p.id,
            valores: valoresDoRegistro(ENTIDADES.passivo, p),
            persistencia: p.persistencia,
          }))}
          planId={plano.id}
          clientId={clienteId}
          colunaTotal="valor"
          vazio="Nenhum passivo sem parcela — o que tem parcela é dívida, acima."
        />
      </Card>
    </div>
  );
}
