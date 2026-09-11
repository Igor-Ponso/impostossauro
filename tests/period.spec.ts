import { describe, expect, it } from 'vitest';
import {
  fillRevenueSeries,
  inflationFactor,
  periodHasApproximation,
  sumPeriod,
} from '~/utils/period';

const anchors = [
  { year: 2010, totalBillions: 1300 },
  { year: 2015, totalBillions: 2000 },
  { year: 2018, totalBillions: 2300 },
];
const current = { year: 2026, totalBillions: 4400 };

describe('fillRevenueSeries', () => {
  const filled = fillRevenueSeries(anchors, current);

  it('interpola linearmente os anos sem marco', () => {
    const y2012 = filled.find((entry) => entry.year === 2012)!;
    expect(y2012.totalBillions).toBe(1580); // 1300 + (700/5)*2
    expect(y2012.interpolated).toBe(true);
  });

  it('mantém os marcos verificados sem flag', () => {
    const y2015 = filled.find((entry) => entry.year === 2015)!;
    expect(y2015.totalBillions).toBe(2000);
    expect(y2015.interpolated).toBeUndefined();
  });

  it('anexa a estimativa do ano corrente com flag', () => {
    const last = filled.at(-1)!;
    expect(last.year).toBe(2026);
    expect(last.estimate).toBe(true);
  });

  it('cobre todos os anos sem buracos', () => {
    const years = filled.filter((entry) => entry.year <= 2018).map((entry) => entry.year);
    expect(years).toEqual([2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018]);
  });
});

describe('sumPeriod', () => {
  const filled = fillRevenueSeries(anchors, current);
  const midYear = new Date(2026, 6, 2); // ~50% do ano

  it('soma anos completos do intervalo', () => {
    expect(sumPeriod(filled, 2010, 2011, new Date(2026, 0, 15))).toBe(
      (1300 + 1440) * 1e9,
    );
  });

  it('conta o ano corrente proporcional ao tempo decorrido', () => {
    const total = sumPeriod(filled, 2026, 2026, midYear);
    expect(total / 1e9).toBeGreaterThan(4400 * 0.48);
    expect(total / 1e9).toBeLessThan(4400 * 0.52);
  });

  it('ignora anos futuros', () => {
    expect(sumPeriod(filled, 2027, 2030, midYear)).toBe(0);
  });
});

describe('periodHasApproximation', () => {
  const filled = fillRevenueSeries(anchors, current);

  it('detecta interpolação e estimativa no período', () => {
    expect(periodHasApproximation(filled, 2011, 2012)).toBe(true);
    expect(periodHasApproximation(filled, 2026, 2026)).toBe(true);
    expect(periodHasApproximation(filled, 2015, 2015)).toBe(false);
  });
});

describe('inflationFactor', () => {
  const ipca = [
    { year: 2021, pct: 10.06 },
    { year: 2022, pct: 5.79 },
  ];

  it('compõe a inflação de vários anos', () => {
    expect(inflationFactor(ipca, 2021, 2022)).toBeCloseTo(1.1006 * 1.0579, 6);
  });

  it('retorna 1 fora da cobertura da série', () => {
    expect(inflationFactor(ipca, 2030, 2031).valueOf()).toBe(1);
  });
});
