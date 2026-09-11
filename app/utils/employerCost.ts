/**
 * Encargos obrigatórios do regime não-Simples. Incidem também sobre 13º e
 * férias, por isso são calculados sobre salário + provisões.
 */

export interface EmployerCostBreakdown {
  salary: number;
  provisions: number;
  charges: number;
  total: number;
  multiplier: number;
}

// 13º (8,33%) + férias (8,33%) + 1/3 (2,78%).
export const PROVISIONS_RATE = 0.1944;
// INSS 20% + FGTS 8% + RAT médio 2% + terceiros 5,8%.
export const CHARGES_RATE = 0.358;

export function employerCost(salary: number): EmployerCostBreakdown {
  const base = Math.max(0, salary);
  const provisions = base * PROVISIONS_RATE;
  const charges = (base + provisions) * CHARGES_RATE;
  const total = base + provisions + charges;
  return {
    salary: base,
    provisions,
    charges,
    total,
    multiplier: base > 0 ? total / base : 0,
  };
}
