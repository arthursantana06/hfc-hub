import type { Enums } from "@/lib/supabase/database.types";

export type RiskProfile = Enums<"risk_profile">;

/**
 * O cliente como as telas o consomem.
 *
 * Deriva de `public.client` com campos calculados no servidor: `iniciais` (para
 * o avatar sem foto), `patrimonio` (o balanço do período corrente) e `temPlano`.
 * Nenhum é coluna — recalcular é barato, e guardá-los seria mais uma coisa para
 * sair de sincronia.
 *
 * `plano_status` saiu da tela na Fase 2: era um rótulo digitado à mão que
 * envelhecia sozinho. Quem tem plano ativo, o banco sabe responder.
 */
export interface Client {
  id: string;
  nome: string;
  email: string | null;
  iniciais: string;
  risco: RiskProfile | null;
  patrimonio: number;
  /** Tem um período de planejamento aberto — deriva de `financial_plan`. */
  temPlano: boolean;
  avatarUrl: string | null;
  nascimento: string | null;
  profissao: string | null;
  adesao: string | null;
  notas: string | null;
  /** Serviços contratados — governam quais áreas do painel existem para ele. */
  temPlanejamento: boolean;
  temInvestimento: boolean;
}

/**
 * O serviço contratado, derivado das duas flags.
 *
 * Duas flags e não um enum de três valores: um quarto serviço custa uma coluna,
 * enquanto o enum custaria sete valores e um toque em todo lugar que hoje testa
 * o tipo. E derivado em vez de guardado porque um rótulo guardado poderia
 * discordar das flags que governam a navegação — que é o começo de uma tela
 * dizendo "Investimento" sem a aba existir.
 */
export type Servico = "planejamento" | "investimento" | "ambos" | "nenhum";

export function servicoDe(
  c: Pick<Client, "temPlanejamento" | "temInvestimento">,
): Servico {
  if (c.temPlanejamento && c.temInvestimento) return "ambos";
  if (c.temInvestimento) return "investimento";
  if (c.temPlanejamento) return "planejamento";
  return "nenhum";
}

export const SERVICO_LABEL: Record<Servico, string> = {
  planejamento: "Planejamento",
  investimento: "Investimento",
  ambos: "Planejamento e Investimento",
  nenhum: "Sem serviço",
};

export const SERVICO_STYLE: Record<Servico, string> = {
  planejamento: "bg-brand-300/25 text-brand-900",
  investimento: "bg-teal-100 text-teal-800",
  ambos: "bg-violet-100 text-violet-800",
  nenhum: "bg-slate-100 text-slate-500",
};

export const RISK_LABEL: Record<RiskProfile, string> = {
  conservador: "Conservador",
  moderado: "Moderado",
  arrojado: "Arrojado",
};

export const RISK_STYLE: Record<RiskProfile, string> = {
  conservador: "bg-emerald-100 text-emerald-700",
  moderado: "bg-blue-100 text-blue-700",
  arrojado: "bg-orange-100 text-orange-700",
};

/**
 * As classes de ativo, como as telas as mostram.
 *
 * Vive aqui e não em cada página porque três telas falam delas — o balanço do
 * planejamento, a carteira do cliente e o cockpit — e cores de alocação que
 * discordam entre telas fazem o mesmo ativo parecer duas coisas.
 */
export const CLASSE_LABEL: Record<string, string> = {
  renda_fixa: "Renda Fixa",
  renda_variavel: "Renda Variável",
  previdencia: "Previdência",
};

export const CLASSE_TOM: Record<string, string> = {
  renda_fixa: "bg-brand-600",
  renda_variavel: "bg-amber-500",
  previdencia: "bg-violet-500",
};

export const INDEXADOR_LABEL: Record<string, string> = {
  cdi: "CDI",
  ipca: "IPCA+",
  prefixado: "Prefixado",
  selic: "Selic",
  nao_aplica: "",
};

/**
 * A remuneração de um ativo em uma linha.
 *
 * Cada indexador tem sua convenção de leitura e escrever todas do mesmo jeito
 * mentiria sobre duas delas: 110 no CDI é um percentual DO índice, enquanto 6,2
 * no IPCA é um spread SOBRE o índice. "110% do CDI" e "IPCA + 6,2%" são as
 * formas em que essas duas coisas são ditas em voz alta.
 */
export function rotuloDaTaxa(
  indexador: string,
  taxa: number | null,
): string | null {
  if (indexador === "nao_aplica" || taxa === null) return null;
  const n = taxa.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

  if (indexador === "cdi") return `${n}% do CDI`;
  if (indexador === "ipca") return `IPCA + ${n}%`;
  if (indexador === "selic") return `Selic + ${n}%`;
  return `${n}% a.a.`;
}

export const TITULAR_LABEL: Record<string, string> = {
  pf: "Pessoa física",
  pj: "Pessoa jurídica",
};

export function formatCurrency(value: number, casas = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(value);
}

/** "Ana Beatriz Souza" → "AS". */
export function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase() || "?";
}
