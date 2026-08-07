import { notFound } from "next/navigation";
import { getPlanejamento, getPlanoDoPeriodo } from "@/lib/planning-dal";
import { SemPlanejamento } from "@/components/planejamento/secoes/SemPlanejamento";
import { SecaoReceita } from "@/components/planejamento/secoes/SecaoReceita";
import { SecaoDespesa } from "@/components/planejamento/secoes/SecaoDespesa";
import { SecaoCartao } from "@/components/planejamento/secoes/SecaoCartao";
import { SecaoAtivos } from "@/components/planejamento/secoes/SecaoAtivos";
import { SecaoPassivos } from "@/components/planejamento/secoes/SecaoPassivos";
import { SecaoInvestimentos } from "@/components/planejamento/secoes/SecaoInvestimentos";
import { SecaoObjetivos } from "@/components/planejamento/secoes/SecaoObjetivos";
import { SecaoProjecao } from "@/components/planejamento/secoes/SecaoProjecao";
import type { SecaoProps } from "@/components/planejamento/secoes/tipos";

export const metadata = { title: "Planejamento — HFC Hub" };

/**
 * Uma página só para as 24 combinações (3 tipos × 8 seções).
 *
 * Oito pastas de rota repetiriam o mesmo preâmbulo — resolver o tipo, achar o
 * plano, tratar o vazio — e a diferença entre elas é exatamente um componente.
 */

const TIPO_DO_SLUG = {
  "pre-hfc": "pre_hfc",
  hfc: "hfc",
  real: "real",
} as const;

const SECAO_DO_SLUG: Record<string, (props: SecaoProps) => Promise<React.ReactNode>> = {
  receita: SecaoReceita,
  despesa: SecaoDespesa,
  cartao: SecaoCartao,
  ativos: SecaoAtivos,
  passivos: SecaoPassivos,
  investimentos: SecaoInvestimentos,
  objetivos: SecaoObjetivos,
  projecao: SecaoProjecao,
};

export default async function SecaoDoPlanejamento({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; tipo: string; secao: string }>;
  searchParams: Promise<{ periodo?: string }>;
}) {
  const [{ id, tipo: tipoSlug, secao }, { periodo }] = await Promise.all([
    params,
    searchParams,
  ]);

  const tipo = TIPO_DO_SLUG[tipoSlug as keyof typeof TIPO_DO_SLUG];
  const Secao = SECAO_DO_SLUG[secao];
  if (!tipo || !Secao) notFound();

  let plano = await getPlanejamento(id, tipo);

  // `?periodo=` abre um período anterior — mas só do Real, e só do próprio
  // cliente. Um id de outro tipo (ou forjado) cai de volta no corrente em vez
  // de abrir a coisa errada em silêncio.
  if (tipo === "real" && periodo) {
    const pedido = await getPlanoDoPeriodo(id, periodo);
    if (pedido?.tipo === "real") plano = pedido;
  }

  if (!plano) return <SemPlanejamento clienteId={id} tipo={tipo} />;

  return <Secao clienteId={id} plano={plano} />;
}
