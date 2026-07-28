/**
 * Utilitários de data e grade de calendário, compartilhados entre o
 * `DatePicker` e a visão de calendário da Agenda — para não ter duas
 * implementações da mesma grade de 42 dias divergindo com o tempo.
 *
 * Tudo em UTC: fuso local com `new Date(iso)` desloca o dia (no Brasil,
 * "2026-07-28" vira 27/07 às 21h).
 */

export const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const hojeISO = (): string => new Date().toISOString().slice(0, 10);

export const primeiroDoMes = (iso: string): string => `${iso.slice(0, 7)}-01`;

export function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function somarMeses(iso: string, meses: number): string {
  const [ano, mes] = iso.split("-").map(Number);
  const total = ano * 12 + (mes - 1) + meses;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

export interface CelulaGrade {
  data: string;
  /** Falso para os dias de preenchimento do mês anterior/seguinte. */
  noMes: boolean;
}

/**
 * As 42 casas (6 semanas) do mês de `cursorIso`, com as pontas preenchidas
 * pelos dias vizinhos — como qualquer calendário mensal de verdade.
 */
export function gradeDoMes(cursorIso: string): CelulaGrade[] {
  const [ano, mes] = cursorIso.slice(0, 7).split("-").map(Number);
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1));
  const inicioSemana = primeiro.getUTCDay();
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();

  return Array.from({ length: 42 }, (_, i) => {
    const offset = i - inicioSemana + 1;
    const d = new Date(Date.UTC(ano, mes - 1, offset));
    return {
      data: d.toISOString().slice(0, 10),
      noMes: offset >= 1 && offset <= diasNoMes,
    };
  });
}
