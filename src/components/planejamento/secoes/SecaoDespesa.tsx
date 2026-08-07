import { blocosDeDespesa, linhasDoPlano, nomesDeCategoriaDaOrg } from "@/lib/planning-dal";
import { ENTIDADES, valoresDoRegistro } from "@/lib/forms/planejamento";
import { PainelDespesa } from "@/components/planejamento/grade/PainelDespesa";
import type { SecaoProps } from "./tipos";

/**
 * Despesa — blocos livres por categoria, um grid por bloco.
 *
 * O servidor semeia blocos e linhas de uma vez e agrupa aqui; o painel client
 * é dono do estado dali em diante (as actions do grid não revalidam a rota).
 */
export async function SecaoDespesa({ clienteId, plano }: SecaoProps) {
  const [blocos, despesas, sugestoes] = await Promise.all([
    blocosDeDespesa(plano.id),
    linhasDoPlano("plan_expense", plano.id),
    nomesDeCategoriaDaOrg(),
  ]);

  const porBloco = new Map(blocos.map((b) => [b.id, [] as typeof despesas]));
  for (const d of despesas) porBloco.get(d.categoria_plan_id)?.push(d);

  return (
    <div className="max-w-7xl mx-auto">
      <PainelDespesa
        planId={plano.id}
        clientId={clienteId}
        sugestoes={sugestoes}
        blocos={blocos.map((b) => ({
          id: b.id,
          nome: b.nome,
          linhas: (porBloco.get(b.id) ?? []).map((d) => ({
            id: d.id,
            valores: valoresDoRegistro(ENTIDADES.despesa, d),
            persistencia: d.persistencia,
          })),
        }))}
      />
    </div>
  );
}
