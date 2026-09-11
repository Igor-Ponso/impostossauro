import { describe, expect, it } from 'vitest';
import { averageInflationPct, simulateInvestment } from '~/utils/investment';

describe('simulateInvestment', () => {
  it('reproduz o exemplo das ações: 10 mil → 50 mil em 10 anos', () => {
    // Retorno que quintuplica em 10 anos: 5^(1/10) − 1 ≈ 17,46% a.a.
    const result = simulateInvestment(10_000, 10, 17.4618, 6, 15);
    expect(result.finalValue).toBeCloseTo(50_000, -2);
    expect(result.nominalGain).toBeCloseTo(40_000, -2);
    // Inflação de 6% a.a. por 10 anos ≈ 79% acumulada
    expect(result.inflationPortion).toBeCloseTo(7_908, -2);
    // Imposto de 15% sobre o ganho nominal inteiro
    expect(result.tax).toBeCloseTo(6_000, -2);
    // ~R$ 1.186 do imposto incidem sobre pura inflação
    expect(result.taxOnInflation).toBeCloseTo(1_186, -1);
    // Alíquota efetiva sobre o ganho real é maior que os 15% nominais
    expect(result.effectiveRealRatePct!).toBeGreaterThan(15);
  });

  it('cobra imposto mesmo quando o ganho real é negativo', () => {
    // Rendeu 4% a.a. com inflação de 8% a.a.: perdeu poder de compra
    const result = simulateInvestment(10_000, 10, 4, 8, 15);
    expect(result.nominalGain).toBeGreaterThan(0);
    expect(result.realGain).toBeLessThan(0);
    expect(result.tax).toBeGreaterThan(0);
    expect(result.effectiveRealRatePct).toBeNull();
    // Todo o imposto incide sobre "ganho" que é só inflação
    expect(result.taxOnInflation).toBeCloseTo(result.tax, 2);
  });

  it('sem inflação, imposto sobre inflação é zero', () => {
    const result = simulateInvestment(10_000, 10, 10, 0, 15);
    expect(result.taxOnInflation).toBe(0);
    expect(result.effectiveRealRatePct).toBeCloseTo(15, 5);
  });

  it('não explode com principal zero ou negativo', () => {
    const result = simulateInvestment(0, 10, 10, 6, 15);
    expect(result.tax).toBe(0);
    expect(result.realNetAfterTax).toBe(0);
  });
});

describe('averageInflationPct', () => {
  it('calcula a média geométrica da série', () => {
    expect(averageInflationPct([{ pct: 10 }, { pct: 10 }])).toBeCloseTo(10, 6);
    expect(averageInflationPct([])).toBe(0);
  });
});
