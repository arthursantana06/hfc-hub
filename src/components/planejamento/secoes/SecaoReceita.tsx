import { Wallet } from "lucide-react";
import { linhasDoPlano } from "@/lib/planning-dal";
import { ENTIDADES, valoresDoRegistro } from "@/lib/forms/planejamento";
import { Card } from "@/components/planejamento/primitives";
import { GradeEditavel } from "@/components/planejamento/grade/GradeEditavel";
import type { SecaoProps } from "./tipos";

/**
 * Receita — o primeiro grid da remodelação.
 *
 * O total do rodapé soma os valores CHEIOS (uma receita anual entra inteira,
 * não ÷12): este é o grid de entrada de dados, e o número que confere com o
 * extrato é o cheio. A leitura mensalizada vive na Projeção.
 */
export async function SecaoReceita({ clienteId, plano }: SecaoProps) {
  const receitas = await linhasDoPlano("plan_income", plano.id);

  return (
    <div className="max-w-7xl mx-auto">
      <Card titulo="Receitas" icone={Wallet} tom="verde">
        <GradeEditavel
          titulo="Receitas do planejamento"
          entidade="receita"
          colunas={["fonte", "valor", "frequencia", "mes_ocorrencia", "meses", "derivado"]}
          linhas={receitas.map((r) => ({
            id: r.id,
            valores: valoresDoRegistro(ENTIDADES.receita, r),
            persistencia: r.persistencia,
          }))}
          planId={plano.id}
          clientId={clienteId}
          colunaTotal="valor"
          vazio="Nenhuma receita — o planejamento começa por aqui."
        />
      </Card>
    </div>
  );
}
