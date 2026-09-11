import { describe, expect, it } from 'vitest';
import payroll from '../app/data/payroll-2026.json';
import { calcIrrf, calcInss } from '../app/utils/payroll';

/**
 * Os valores abaixo foram lidos no documento primário, não em resumo de busca.
 * O teste trava os valores publicados, não a fórmula: uma tabela reajustada
 * pela metade aparece aqui.
 */
const { inss, irrf } = payroll.tables;

describe('INSS 2026 — Portaria Interministerial MPS/MF 13/2026', () => {
  it('as quatro faixas sao as do documento', () => {
    expect(inss.brackets).toEqual([
      { upTo: 1621, ratePct: 7.5 },
      { upTo: 2902.84, ratePct: 9 },
      { upTo: 4354.27, ratePct: 12 },
      { upTo: 8475.55, ratePct: 14 },
    ]);
  });

  it('o teto e o da portaria, e a ultima faixa termina nele', () => {
    expect(inss.ceiling).toBe(8475.55);
    expect(inss.brackets.at(-1)!.upTo).toBe(inss.ceiling);
  });

  it('a primeira faixa termina no salario minimo de 2026', () => {
    // R$ 1.621,00 — o mesmo piso do salário-de-contribuição na portaria.
    expect(inss.brackets[0]!.upTo).toBe(1621);
  });

  it('acima do teto a contribuicao para de crescer', () => {
    expect(calcInss(20000, payroll.tables)).toBe(calcInss(8475.55, payroll.tables));
  });
});

describe('IRRF 2026 — Receita Federal, tabela mensal', () => {
  it('as cinco faixas sao as da tabela publicada', () => {
    expect(irrf.brackets).toEqual([
      { upTo: 2428.8, ratePct: 0, deduction: 0 },
      { upTo: 2826.65, ratePct: 7.5, deduction: 182.16 },
      { upTo: 3751.05, ratePct: 15, deduction: 394.16 },
      { upTo: 4664.68, ratePct: 22.5, deduction: 675.49 },
      { upTo: null, ratePct: 27.5, deduction: 908.73 },
    ]);
  });

  it('as duas deducoes mensais sao as publicadas', () => {
    expect(irrf.dependentDeduction).toBe(189.59);
    expect(irrf.simplifiedDeduction).toBe(607.2);
  });
});

describe('redutor da Lei 15.270/2025 — os tres pontos que a Receita publica', () => {
  const { a, b } = irrf.lowIncomeReduction!;

  it('em R$ 5.000 o redutor vale exatamente o teto publicado de R$ 312,89', () => {
    expect(Number((a - b * 5000).toFixed(2))).toBe(312.89);
  });

  it('em R$ 7.350 o redutor zera, que e onde a lei o encerra', () => {
    expect(Math.max(0, a - b * 7350)).toBeCloseTo(0, 2);
  });

  it('ate R$ 5.000 nao sobra imposto — e a isencao que a lei criou', () => {
    for (const salario of [1621, 3000, 4500, 5000]) {
      expect(calcIrrf(salario, 0, payroll.tables), `sobrou IRRF em R$ ${salario}`).toBe(0);
    }
  });

  it('acima de R$ 7.350 o redutor nao entra mais', () => {
    const semRedutor = { ...payroll.tables, irrf: { ...irrf, lowIncomeReduction: null } };
    expect(calcIrrf(8000, 0, payroll.tables)).toBe(calcIrrf(8000, 0, semRedutor));
  });
});
