import { redirect } from "next/navigation";

/**
 * A raiz do Planejamento só decide para onde ir.
 *
 * O HFC é a porta de entrada: é a base de comparação de tudo (o Real herda
 * dele, o Acompanhamento mede contra ele) e o primeiro que o planejador
 * preenche numa consultoria nova.
 */
export default async function Planejamento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/clientes/${id}/planejamento/hfc/receita`);
}
