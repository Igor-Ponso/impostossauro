import { describe, expect, it } from 'vitest';
import { employerCost } from '~/utils/employerCost';

describe('employerCost', () => {
  it('calcula o custo conservador de ~1,62x o salário', () => {
    const result = employerCost(5000);
    // 5.000 × 1,1944 × 1,358 ≈ 8.110
    expect(result.total).toBeCloseTo(8110, -1);
    expect(result.multiplier).toBeCloseTo(1.622, 2);
  });

  it('fecha a soma: salário + provisões + encargos = total', () => {
    const result = employerCost(8000);
    expect(result.salary + result.provisions + result.charges).toBeCloseTo(result.total, 6);
  });

  it('não explode com salário zero ou negativo', () => {
    expect(employerCost(0).total).toBe(0);
    expect(employerCost(-10).multiplier).toBe(0);
  });
});
