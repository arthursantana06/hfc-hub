import type { Enums } from "@/lib/supabase/database.types";

export type RiskProfile = Enums<"risk_profile">;
export type PlanStatus = Enums<"plan_status">;

/**
 * O cliente como as telas o consomem.
 *
 * Deriva de `public.client` com dois campos calculados no servidor:
 * `iniciais` (para o avatar sem foto) e `patrimonio` (ativos menos passivos).
 * Nenhum dos dois é coluna — recalcular é barato, e guardá-los seria mais uma
 * coisa para sair de sincronia.
 */
export interface Client {
  id: string;
  nome: string;
  email: string | null;
  iniciais: string;
  risco: RiskProfile | null;
  patrimonio: number;
  planoStatus: PlanStatus;
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

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  ativo: "Plano Ativo",
  diagnostico: "Em Diagnóstico",
  pendente: "Pendente",
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
