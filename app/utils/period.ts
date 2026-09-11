import { elapsedYearSeconds, secondsInYear } from './taxMath';

/**
 * A série do Impostômetro só tem marcos verificados em alguns anos; os demais
 * são interpolação linear, declarada na metodologia e sinalizada item a item.
 */

export interface YearRevenue {
  year: number;
  totalBillions: number;
  interpolated?: boolean;
  estimate?: boolean;
}

export function fillRevenueSeries(
  anchors: ReadonlyArray<{ year: number; totalBillions: number }>,
  currentYear: { year: number; totalBillions: number },
): YearRevenue[] {
  const sorted = [...anchors].sort((a, b) => a.year - b.year);
  const filled: YearRevenue[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const anchor = sorted[i]!;
    filled.push({ year: anchor.year, totalBillions: anchor.totalBillions });
    const next = sorted[i + 1];
    if (!next) break;
    const gap = next.year - anchor.year;
    for (let step = 1; step < gap; step++) {
      filled.push({
        year: anchor.year + step,
        totalBillions:
          Math.round(
            anchor.totalBillions +
              ((next.totalBillions - anchor.totalBillions) * step) / gap,
          ),
        interpolated: true,
      });
    }
  }

  if (currentYear.year > (sorted.at(-1)?.year ?? 0)) {
    filled.push({
      year: currentYear.year,
      totalBillions: currentYear.totalBillions,
      estimate: true,
    });
  }

  return filled;
}

export function sumPeriod(
  filled: ReadonlyArray<YearRevenue>,
  startYear: number,
  endYear: number,
  now: Date,
): number {
  let total = 0;
  for (const entry of filled) {
    if (entry.year < startYear || entry.year > endYear) continue;
    let fraction = 1;
    if (entry.year === now.getFullYear()) {
      fraction = elapsedYearSeconds(now) / secondsInYear(entry.year);
    } else if (entry.year > now.getFullYear()) {
      fraction = 0;
    }
    total += entry.totalBillions * 1e9 * fraction;
  }
  return total;
}

export function periodHasApproximation(
  filled: ReadonlyArray<YearRevenue>,
  startYear: number,
  endYear: number,
): boolean {
  return filled.some(
    (entry) =>
      entry.year >= startYear &&
      entry.year <= endYear &&
      (entry.interpolated || entry.estimate),
  );
}

export function inflationFactor(
  ipca: ReadonlyArray<{ year: number; pct: number }>,
  startYear: number,
  endYear: number,
): number {
  return ipca
    .filter((entry) => entry.year >= startYear && entry.year <= endYear)
    .reduce((factor, entry) => factor * (1 + entry.pct / 100), 1);
}

/**
 * A série federal muda de régua: receita previdenciária só de 2013, administradas
 * por outros órgãos só de 2010; antes o total sai ~30% menor, e emendar desenha
 * um degrau de 56,6% em 2013 que é definição, não arrecadação. Só `completa` entra.
 */
export function anosDaReguaCompleta<T extends { year: number; ruler?: string }>(
  serie: readonly T[],
): T[] {
  const completos = serie.filter((entry) => entry.ruler === 'completa');
  if (completos.length === 0) return [];

  // Buraco no meio é defeito de geração (a régua não alterna): fica só o trecho final contíguo.
  const ordenados = [...completos].sort((a, b) => a.year - b.year);
  let inicio = 0;
  for (let i = 1; i < ordenados.length; i += 1) {
    if (ordenados[i]!.year !== ordenados[i - 1]!.year + 1) inicio = i;
  }
  return ordenados.slice(inicio);
}
