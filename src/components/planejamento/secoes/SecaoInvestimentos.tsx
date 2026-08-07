import { Wallet } from "lucide-react";
import { linhasDoPlano } from "@/lib/planning-dal";
import { ENTIDADES, valoresDoRegistro } from "@/lib/forms/planejamento";
import { Card } from "@/components/planejamento/primitives";
import { GradeEditavel } from "@/components/planejamento/grade/GradeEditavel";
import type { SecaoProps } from "./tipos";

/**
 * Investimentos do planejamento — a foto da carteira DENTRO deste retrato.
 *
 * Deliberadamente independente do CRM de contas e posições (aba Investimentos
 * do cliente): aqui é o número digitado de que a projeção parte, clonado por
 * período como tudo o mais. A reconciliação entre os dois é fase própria.
 */
export async function SecaoInvestimentos({ clienteId, plano }: SecaoProps) {
  const investimentos = await linhasDoPlano("investment", plano.id);

  return (
    <div className="max-w-7xl mx-auto">
      <Card titulo="Carteira de investimentos" icone={Wallet} tom="verde">
        <GradeEditavel
          titulo="Investimentos do planejamento"
          entidade="investimento"
          colunas={["nome", "classe", "valor", "instituicao", "liquidez"]}
          linhas={investimentos.map((i) => ({
            id: i.id,
            valores: valoresDoRegistro(ENTIDADES.investimento, i),
            persistencia: i.persistencia,
          }))}
          planId={plano.id}
          clientId={clienteId}
          colunaTotal="valor"
          vazio="Nenhum investimento — é daqui que a projeção parte."
        />
      </Card>
    </div>
  );
}
