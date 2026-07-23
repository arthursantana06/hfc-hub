export type RiskProfile = "Conservador" | "Moderado" | "Arrojado";

export type PlanStatus = "Plano Ativo" | "Em Diagnóstico" | "Pendente";

export interface Client {
  id: string;
  name: string;
  email: string;
  initials: string;
  riskProfile: RiskProfile;
  netWorth: number;
  planStatus: PlanStatus;
}
