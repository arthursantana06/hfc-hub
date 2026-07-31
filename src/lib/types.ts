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
}

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
