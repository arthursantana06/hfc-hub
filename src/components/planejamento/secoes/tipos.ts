import type { Tables } from "@/lib/supabase/database.types";

/** O contrato de toda seção do Planejamento: o cliente e o plano já resolvidos. */
export interface SecaoProps {
  clienteId: string;
  plano: Tables<"financial_plan">;
}
