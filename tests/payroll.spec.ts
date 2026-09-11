import { describe, expect, it } from 'vitest';
import payrollData from '~/data/payroll-2026.json';
import { calcInss, calcIrrf, calcPayroll, type PayrollTables } from '~/utils/payroll';

const tables = payrollData.tables as PayrollTables;

describe('calcInss', () => {
  it('zera para salário zero ou negativo', () => {
    expect(calcInss(0, tables)).toBe(0);
    expect(calcInss(-100, tables)).toBe(0);
  });

  it('aplica a primeira faixa integralmente no salário mínimo', () => {
    const firstBracket = tables.inss.brackets[0]!;
    const expected = firstBracket.upTo * (firstBracket.ratePct / 100);
    expect(calcInss(firstBracket.upTo, tables)).toBeCloseTo(expected, 2);
  });

  it('é progressivo: salário maior nunca desconta menos', () => {
    let previous = 0;
    for (let salary = 500; salary <= 20000; salary += 500) {
      const current = calcInss(salary, tables);
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });

  it('respeita o teto de contribuição', () => {
    const atCeiling = calcInss(tables.inss.ceiling, tables);
    expect(calcInss(50000, tables)).toBe(atCeiling);
  });

  it('bate com o desconto máximo oficial de 2026 (R$ 988,09)', () => {
    expect(calcInss(tables.inss.ceiling, tables)).toBeCloseTo(988.09, 1);
  });
});

describe('calcIrrf', () => {
  it('isenta salários baixos', () => {
    expect(calcIrrf(1621, 0, tables)).toBe(0);
  });

  it('isenta totalmente até R$ 5.000 com a regra da Lei 15.270/2025', () => {
    expect(calcIrrf(3500, 0, tables)).toBe(0);
    expect(calcIrrf(4500, 0, tables)).toBe(0);
    expect(calcIrrf(5000, 0, tables)).toBe(0);
  });

  it('aplica redução parcial entre R$ 5.000 e R$ 7.350 e nada acima', () => {
    const taxAt6000 = calcIrrf(6000, 0, tables);
    expect(taxAt6000).toBeGreaterThan(0);
    // Redutor em 6.000: 978,62 − 0,133145 × 6.000 = 179,75
    const tableOnly = { ...tables, irrf: { ...tables.irrf, lowIncomeReduction: null } };
    expect(calcIrrf(6000, 0, tableOnly)).toBeCloseTo(taxAt6000 + 179.75, 1);
    expect(calcIrrf(8000, 0, tables)).toBeCloseTo(calcIrrf(8000, 0, tableOnly), 2);
  });

  it('cobra imposto de salários altos', () => {
    expect(calcIrrf(20000, 0, tables)).toBeGreaterThan(1000);
  });

  it('dependentes nunca aumentam o imposto', () => {
    for (const salary of [3000, 6000, 10000, 25000]) {
      expect(calcIrrf(salary, 2, tables)).toBeLessThanOrEqual(calcIrrf(salary, 0, tables));
    }
  });

  it('nunca retorna imposto negativo', () => {
    for (let salary = 0; salary <= 12000; salary += 250) {
      expect(calcIrrf(salary, 1, tables)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('calcPayroll', () => {
  it('fecha a conta: líquido + descontos = bruto', () => {
    const result = calcPayroll(7500, 1, tables);
    expect(result.net + result.totalTax).toBeCloseTo(result.gross, 2);
  });

  it('alíquota efetiva fica entre 0 e 1', () => {
    for (const salary of [0, 1621, 5000, 8000, 30000]) {
      const { effectiveRate } = calcPayroll(salary, 0, tables);
      expect(effectiveRate).toBeGreaterThanOrEqual(0);
      expect(effectiveRate).toBeLessThan(0.45);
    }
  });
});
