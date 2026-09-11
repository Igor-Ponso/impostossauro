import { describe, expect, it } from 'vitest';
import {
  collectedInRange,
  collectedThisYear,
  elapsedYearSeconds,
  formatBRLCompact,
  howMany,
  isLeapYear,
  perSecondRate,
  secondsInYear,
} from '~/utils/taxMath';

describe('isLeapYear / secondsInYear', () => {
  it('identifica anos bissextos corretamente', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
  });

  it('calcula os segundos do ano', () => {
    expect(secondsInYear(2026)).toBe(365 * 86400);
    expect(secondsInYear(2024)).toBe(366 * 86400);
  });
});

describe('perSecondRate', () => {
  it('converte bilhões anuais em R$/segundo', () => {
    // 3.900 bilhões em ano de 365 dias ≈ R$ 123.668/s
    const rate = perSecondRate(3900, 2026);
    expect(rate).toBeCloseTo((3900 * 1e9) / (365 * 86400), 6);
    expect(rate).toBeGreaterThan(100_000);
  });
});

describe('elapsedYearSeconds / collectedThisYear', () => {
  it('zera na virada do ano', () => {
    const newYear = new Date(2026, 0, 1, 0, 0, 0);
    expect(elapsedYearSeconds(newYear)).toBe(0);
    expect(collectedThisYear(3900, newYear)).toBe(0);
  });

  it('acumula o total anual ao fim do ano', () => {
    const lastSecond = new Date(2026, 11, 31, 23, 59, 59);
    const total = collectedThisYear(3900, lastSecond);
    expect(total / 1e9).toBeCloseTo(3900, 0);
  });
});

describe('collectedInRange', () => {
  const series = [
    { year: 2023, totalBillions: 100 },
    { year: 2024, totalBillions: 200 },
    { year: 2025, totalBillions: 300 },
  ];

  it('soma apenas os anos dentro do intervalo', () => {
    expect(collectedInRange(series, 2024, 2025)).toBe(500e9);
    expect(collectedInRange(series, 2023, 2023)).toBe(100e9);
    expect(collectedInRange(series, 2030, 2031)).toBe(0);
  });
});

describe('howMany', () => {
  it('faz o piso inteiro da divisão', () => {
    expect(howMany(1000, 300)).toBe(3);
    expect(howMany(0, 300)).toBe(0);
  });

  it('não explode com custo zero ou negativo', () => {
    expect(howMany(1000, 0)).toBe(0);
    expect(howMany(1000, -5)).toBe(0);
  });
});

describe('formatBRLCompact', () => {
  it('formata trilhões, bilhões e milhões em pt-BR', () => {
    expect(formatBRLCompact(3.2e12)).toContain('trilhões');
    expect(formatBRLCompact(480e9)).toContain('bilhões');
    expect(formatBRLCompact(12e6)).toContain('milhões');
  });
});
