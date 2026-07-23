import type { Client, RiskProfile } from "./types";

export const clients: Client[] = [
  {
    id: "1",
    name: "Carlos E. Silva",
    email: "carlos.silva@email.com",
    initials: "CS",
    riskProfile: "Moderado",
    netWorth: 1_250_000,
    planStatus: "Plano Ativo",
  },
  {
    id: "2",
    name: "Mariana Souza",
    email: "mariana.souza@email.com",
    initials: "MS",
    riskProfile: "Conservador",
    netWorth: 850_000,
    planStatus: "Plano Ativo",
  },
  {
    id: "3",
    name: "Roberto Almeida",
    email: "roberto.almeida@email.com",
    initials: "RA",
    riskProfile: "Arrojado",
    netWorth: 4_320_000,
    planStatus: "Plano Ativo",
  },
];

export function getClientById(id: string): Client | undefined {
  return clients.find((client) => client.id === id);
}

export const riskProfileStyles: Record<RiskProfile, string> = {
  Conservador: "bg-emerald-100 text-emerald-700",
  Moderado: "bg-blue-100 text-blue-700",
  Arrojado: "bg-orange-100 text-orange-700",
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}
