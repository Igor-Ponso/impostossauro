/** As tabelas vivem em `app/data/payroll-2026.json`: a atualização anual é troca de dado, não de código. */

export interface InssBracket {
  upTo: number;
  ratePct: number;
}

export interface IrrfBracket {
  upTo: number | null;
  ratePct: number;
  deduction: number;
}

export interface PayrollTables {
  inss: {
    brackets: InssBracket[];
    ceiling: number;
  };
  irrf: {
    brackets: IrrfBracket[];
    dependentDeduction: number;
    simplifiedDeduction: number;
    /** Redução da Lei 15.270/2025 (isenção até R$ 5 mil): max(0, a − b·renda). */
    lowIncomeReduction: { a: number; b: number } | null;
  };
}

export function calcInss(grossMonthly: number, tables: PayrollTables): number {
  const salary = Math.min(Math.max(0, grossMonthly), tables.inss.ceiling);
  let total = 0;
  let previousCap = 0;
  for (const bracket of tables.inss.brackets) {
    if (salary <= previousCap) break;
    const taxable = Math.min(salary, bracket.upTo) - previousCap;
    total += taxable * (bracket.ratePct / 100);
    previousCap = bracket.upTo;
  }
  return round2(total);
}

export function calcIrrf(
  grossMonthly: number,
  dependents: number,
  tables: PayrollTables,
): number {
  const inss = calcInss(grossMonthly, tables);
  const legalDeductions = inss + dependents * tables.irrf.dependentDeduction;
  const base =
    grossMonthly - Math.max(legalDeductions, tables.irrf.simplifiedDeduction);
  if (base <= 0) return 0;

  const bracket = tables.irrf.brackets.find(
    (candidate) => candidate.upTo === null || base <= candidate.upTo,
  );
  if (!bracket) return 0;

  let tax = base * (bracket.ratePct / 100) - bracket.deduction;

  // Lei 15.270/2025: até R$ 5.000 o teto legal de R$ 312,89 iguala o imposto
  // máximo da tabela, então max(0, a − b·renda) com corte em zero reproduz as
  // três faixas da lei.
  const reduction = tables.irrf.lowIncomeReduction;
  if (reduction) {
    const discount = Math.max(0, reduction.a - reduction.b * grossMonthly);
    tax -= discount;
  }

  return round2(Math.max(0, tax));
}

export interface PayrollBreakdown {
  gross: number;
  inss: number;
  irrf: number;
  totalTax: number;
  net: number;
  /** 0..1, não em %. */
  effectiveRate: number;
}

export function calcPayroll(
  grossMonthly: number,
  dependents: number,
  tables: PayrollTables,
): PayrollBreakdown {
  const gross = Math.max(0, grossMonthly);
  const inss = calcInss(gross, tables);
  const irrf = calcIrrf(gross, dependents, tables);
  const totalTax = round2(inss + irrf);
  return {
    gross,
    inss,
    irrf,
    totalTax,
    net: round2(gross - totalTax),
    effectiveRate: gross > 0 ? totalTax / gross : 0,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
