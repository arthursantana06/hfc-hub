import { Flag, Shuffle } from "lucide-react";
import { linhasDoPlano } from "@/lib/planning-dal";
import { ENTIDADES, valoresDoRegistro } from "@/lib/forms/planejamento";
import { Card } from "@/components/planejamento/primitives";
import { GradeEditavel } from "@/components/planejamento/grade/GradeEditavel";
import type { SecaoProps } from "./tipos";

/**
 * Objetivos e Mudanças — os dois motores de variação da projeção.
 *
 * Objetivo é aonde o cliente quer chegar (comprar, juntar, quitar); mudança é
 * o que altera o fluxo a partir de um mês (aluguel que acaba, renda que sobe).
 * Grids separados porque os campos não se sobrepõem em nada além do título.
 */
export async function SecaoObjetivos({ clienteId, plano }: SecaoProps) {
  const [objetivos, mudancas] = await Promise.all([
    linhasDoPlano("goal", plano.id),
    linhasDoPlano("plan_change", plano.id),
  ]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <Card titulo="Objetivos" icone={Flag} tom="brand">
        <GradeEditavel
          titulo="Objetivos do planejamento"
          entidade="objetivo"
          colunas={["titulo", "prazo", "alvo", "data_alvo", "periodicidade_anos", "concluido"]}
          linhas={objetivos.map((o) => ({
            id: o.id,
            valores: valoresDoRegistro(ENTIDADES.objetivo, o),
            persistencia: o.persistencia,
          }))}
          planId={plano.id}
          clientId={clienteId}
          vazio="Nenhum objetivo ainda."
        />
      </Card>

      <Card titulo="Mudanças" icone={Shuffle} tom="roxo">
        <GradeEditavel
          titulo="Mudanças do planejamento"
          entidade="mudanca"
          colunas={["titulo", "valor", "categoria", "inicio", "fim", "observacao"]}
          linhas={mudancas.map((m) => ({
            id: m.id,
            valores: valoresDoRegistro(ENTIDADES.mudanca, m),
            persistencia: m.persistencia,
          }))}
          planId={plano.id}
          clientId={clienteId}
          vazio="Nenhuma mudança — é o que move a projeção para longe do mês típico."
        />
      </Card>
    </div>
  );
}
