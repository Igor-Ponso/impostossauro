/**
 * O IR sobre ganho de capital incide sobre o ganho nominal, sem correção
 * monetária desde a Lei 9.249/1995: a parte que só repõe a inflação também paga.
 */

export interface InvestmentSimulation {
  principal: number;
  finalValue: number;
  nominalGain: number;
  inflationPortion: number;
  realGain: number;
  tax: number;
  taxOnInflation: number;
  realNetAfterTax: number;
  effectiveRealRatePct: number | null;
}

export function simulateInvestment(
  principal: number,
  years: number,
  annualReturnPct: number,
  annualInflationPct: number,
  taxRatePct = 15,
): InvestmentSimulation {
  const safePrincipal = Math.max(0, principal);
  const growth = Math.pow(1 + annualReturnPct / 100, Math.max(0, years));
  const inflationFactor = Math.pow(1 + annualInflationPct / 100, Math.max(0, years));

  const finalValue = safePrincipal * growth;
  const nominalGain = finalValue - safePrincipal;
  const inflationPortion = safePrincipal * (inflationFactor - 1);
  const realGain = finalValue - safePrincipal * inflationFactor;

  const tax = Math.max(0, nominalGain) * (taxRatePct / 100);
  const taxOnInflation =
    Math.min(Math.max(0, nominalGain), Math.max(0, inflationPortion)) *
    (taxRatePct / 100);

  const realNetAfterTax = (finalValue - tax) / inflationFactor;

  const effectiveRealRatePct = realGain > 0 ? (tax / realGain) * 100 : null;

  return {
    principal: safePrincipal,
    finalValue,
    nominalGain,
    inflationPortion,
    realGain,
    tax,
    taxOnInflation,
    realNetAfterTax,
    effectiveRealRatePct,
  };
}

/** Média geométrica, em % a.a. */
export function averageInflationPct(
  series: ReadonlyArray<{ pct: number }>,
): number {
  if (series.length === 0) return 0;
  const factor = series.reduce((acc, entry) => acc * (1 + entry.pct / 100), 1);
  return (Math.pow(factor, 1 / series.length) - 1) * 100;
}
