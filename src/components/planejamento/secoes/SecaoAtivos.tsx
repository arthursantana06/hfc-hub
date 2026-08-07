import { Landmark } from "lucide-react";
import { linhasDoPlano } from "@/lib/planning-dal";
import { ENTIDADES, valoresDoRegistro } from "@/lib/forms/planejamento";
import { Card } from "@/components/planejamento/primitives";
import { GradeEditavel } from "@/components/planejamento/grade/GradeEditavel";
import type { SecaoProps } from "./tipos";

/** Ativos — bens que não rendem juros. A carteira investida tem seção própria. */
export async function SecaoAtivos({ clienteId, plano }: SecaoProps) {
  const ativos = await linhasDoPlano("asset", plano.id);

  return (
    <div className="max-w-7xl mx-auto">
      <Card titulo="Bens" icone={Landmark} tom="brand">
        <GradeEditavel
          titulo="Bens do planejamento"
          entidade="ativo"
          colunas={["nome", "valor"]}
          linhas={ativos.map((a) => ({
            id: a.id,
            valores: valoresDoRegistro(ENTIDADES.ativo, a),
            persistencia: a.persistencia,
          }))}
          planId={plano.id}
          clientId={clienteId}
          comPin={plano.tipo === "real"}
          colunaTotal="valor"
          vazio="Nenhum bem — imóveis, veículos, participações entram aqui."
        />
      </Card>
    </div>
  );
}
