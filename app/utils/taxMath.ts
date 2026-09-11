/**
 * A arrecadação do ano é distribuída uniformemente por segundo, como no
 * Impostômetro da ACSP; simplificação declarada na metodologia.
 */

const BILLION = 1_000_000_000;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function secondsInYear(year: number): number {
  return (isLeapYear(year) ? 366 : 365) * 24 * 60 * 60;
}

export function perSecondRate(totalBillions: number, year: number): number {
  return (totalBillions * BILLION) / secondsInYear(year);
}

export function elapsedYearSeconds(now: Date): number {
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return (now.getTime() - startOfYear.getTime()) / 1000;
}

export function collectedThisYear(totalBillions: number, now: Date): number {
  return perSecondRate(totalBillions, now.getFullYear()) * elapsedYearSeconds(now);
}

export function collectedInRange(
  series: ReadonlyArray<{ year: number; totalBillions: number }>,
  startYear: number,
  endYear: number,
): number {
  return series
    .filter((entry) => entry.year >= startYear && entry.year <= endYear)
    .reduce((sum, entry) => sum + entry.totalBillions * BILLION, 0);
}

export function howMany(amount: number, unitCost: number): number {
  if (unitCost <= 0) return 0;
  return Math.floor(amount / unitCost);
}

/**
 * Mesma moeda, convenção diferente: o ponto separa milhar em português e decimal
 * em inglês. Tela não chama estas funções direto; `useMoeda()` as amarra ao idioma
 * da rota (`tests/formatacaoPorIdioma.spec.ts`). `Intl.NumberFormat` é caro: cache por idioma.
 */
export const IDIOMA_PADRAO = 'pt-BR';

const cache = new Map<string, Intl.NumberFormat>();
function formatador(chave: string, idioma: string, opcoes: Intl.NumberFormatOptions) {
  const id = `${chave}|${idioma}`;
  let pronto = cache.get(id);
  if (!pronto) {
    pronto = new Intl.NumberFormat(idioma, opcoes);
    cache.set(id, pronto);
  }
  return pronto;
}

export type Moeda = 'BRL' | 'USD';

export function formatMoney(value: number, idioma: string = IDIOMA_PADRAO, moeda: Moeda = 'BRL'): string {
  return formatador(`cheio|${moeda}`, idioma, { style: 'currency', currency: moeda, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function formatMoneyInteger(value: number, idioma: string = IDIOMA_PADRAO, moeda: Moeda = 'BRL'): string {
  return formatador(`inteiro|${moeda}`, idioma, { style: 'currency', currency: moeda, maximumFractionDigits: 0 }).format(value);
}

export function simboloDaMoeda(idioma: string = IDIOMA_PADRAO, moeda: Moeda = 'BRL'): string {
  return formatador(`inteiro|${moeda}`, idioma, { style: 'currency', currency: moeda, maximumFractionDigits: 0 })
    .formatToParts(0).find((parte) => parte.type === 'currency')?.value ?? moeda;
}

/** Símbolo com o espaço que o idioma usa depois dele: "US$ " em português, "$" em inglês. */
export function prefixoDaMoeda(idioma: string = IDIOMA_PADRAO, moeda: Moeda = 'BRL'): string {
  const partes = formatador(`inteiro|${moeda}`, idioma, { style: 'currency', currency: moeda, maximumFractionDigits: 0 }).formatToParts(0);
  const indice = partes.findIndex((parte) => parte.type === 'currency');
  if (indice < 0) return `${moeda} `;
  const seguinte = partes[indice + 1];
  return partes[indice]!.value + (seguinte?.type === 'literal' ? seguinte.value : '');
}

export function formatBRL(value: number, idioma: string = IDIOMA_PADRAO): string {
  return formatMoney(value, idioma, 'BRL');
}

export function formatBRLInteger(value: number, idioma: string = IDIOMA_PADRAO): string {
  return formatMoneyInteger(value, idioma, 'BRL');
}

export function formatCount(value: number, idioma: string = IDIOMA_PADRAO): string {
  return formatador('contagem', idioma, { maximumFractionDigits: 0 }).format(value);
}

/** Palavras de escala são texto e moram no i18n (`units.*`). */
export interface EscalasDeGrandeza {
  trillions: string;
  billions: string;
  millions: string;
}

const ESCALAS_PADRAO: EscalasDeGrandeza = {
  trillions: 'trilhões',
  billions: 'bilhões',
  millions: 'milhões',
};

export function formatMoneyCompact(
  value: number,
  idioma: string = IDIOMA_PADRAO,
  escalas: EscalasDeGrandeza = ESCALAS_PADRAO,
  moeda: Moeda = 'BRL',
): string {
  const abs = Math.abs(value);
  const simbolo = simboloDaMoeda(idioma, moeda);
  const num = (divisor: number, casas: number) =>
    formatador(`compacto${casas}`, idioma, { maximumFractionDigits: casas }).format(value / divisor);
  if (abs >= 1e12) return `${simbolo} ${num(1e12, 2)} ${escalas.trillions}`;
  if (abs >= 1e9) return `${simbolo} ${num(1e9, 1)} ${escalas.billions}`;
  if (abs >= 1e6) return `${simbolo} ${num(1e6, 1)} ${escalas.millions}`;
  return formatMoneyInteger(value, idioma, moeda);
}

export function formatBRLCompact(
  value: number,
  idioma: string = IDIOMA_PADRAO,
  escalas: EscalasDeGrandeza = ESCALAS_PADRAO,
): string {
  return formatMoneyCompact(value, idioma, escalas, 'BRL');
}
