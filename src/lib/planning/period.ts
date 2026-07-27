/**
 * Aritmética de meses sem `Date`.
 *
 * A projeção anda 620 meses adiante. Fazer isso com `Date` convida ao clássico
 * `new Date(2026, 0, 31)` + 1 mês = 03/03 — e um erro desses só aparece meses
 * depois, num total que não fecha. Um mês vira um inteiro `ano * 12 + (mês-1)`,
 * e somar meses passa a ser somar 1.
 */
export type YearMonth = number;

export function ym(ano: number, mes: number): YearMonth {
  return ano * 12 + (mes - 1);
}

export function anoDe(p: YearMonth): number {
  return Math.floor(p / 12);
}

/** 1–12. */
export function mesDe(p: YearMonth): number {
  return (p % 12) + 1;
}

/** Aceita `YYYY-MM-DD` ou `YYYY-MM`. O dia é irrelevante: a granularidade é o mês. */
export function fromISO(iso: string): YearMonth {
  const [ano, mes] = iso.split("-");
  return ym(Number(ano), Number(mes));
}

/** Primeiro dia do mês, no formato que o Postgres espera para `date`. */
export function toISO(p: YearMonth): string {
  return `${anoDe(p)}-${String(mesDe(p)).padStart(2, "0")}-01`;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

export function nomeDoMes(p: YearMonth): string {
  return MESES[mesDe(p) - 1];
}

/** "mar/26" — o rótulo curto usado nos gráficos do relatório. */
export function rotuloCurto(p: YearMonth): string {
  return `${MESES[mesDe(p) - 1].slice(0, 3).toLowerCase()}/${String(anoDe(p) % 100).padStart(2, "0")}`;
}

export function intervalo(de: YearMonth, ate: YearMonth): YearMonth[] {
  const out: YearMonth[] = [];
  for (let p = de; p <= ate; p++) out.push(p);
  return out;
}

/**
 * Quantos meses de [inicio, fim] caem dentro do ano.
 *
 * É o que substitui o `*12` fixo da planilha nas mudanças de longo prazo: uma
 * mudança que começa em julho contribui com 6 meses naquele ano, não 12.
 */
export function mesesNoAno(
  ano: number,
  inicio: YearMonth,
  fim: YearMonth | null,
): number {
  const primeiro = ym(ano, 1);
  const ultimo = ym(ano, 12);
  const de = Math.max(inicio, primeiro);
  const ate = Math.min(fim ?? ultimo, ultimo);
  return Math.max(0, ate - de + 1);
}

/** Idade completa em `p`, a partir da data de nascimento. */
export function idadeEm(nascimentoISO: string, p: YearMonth): number {
  const n = fromISO(nascimentoISO);
  return Math.floor((p - n) / 12);
}
