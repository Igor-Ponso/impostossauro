import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo ESM sem tipos
import { mergeIpcaSeries, parseAnnualIpca } from '../scripts/update-data.mjs';

describe('parseAnnualIpca', () => {
  it('extrai apenas os fechamentos de dezembro', () => {
    const rows = [
      { D3C: '202511', V: '4,10' },
      { D3C: '202512', V: '4,26' },
      { D3C: '202612', V: '3,90' },
      { D3C: '202601', V: '0,50' },
    ];
    expect(parseAnnualIpca(rows)).toEqual([
      { year: 2025, pct: 4.26 },
      { year: 2026, pct: 3.9 },
    ]);
  });

  it('ignora linhas inválidas e valores não numéricos', () => {
    const rows = [
      { D3C: 'Mês (Código)', V: 'Valor' },
      { D3C: '202512', V: '...' },
      { D3C: '202412', V: '4,83' },
    ];
    expect(parseAnnualIpca(rows)).toEqual([{ year: 2024, pct: 4.83 }]);
  });
});

describe('mergeIpcaSeries', () => {
  const existing = [
    { year: 2024, pct: 4.83 },
    { year: 2025, pct: 4.26 },
  ];

  it('adiciona apenas anos novos, sem sobrescrever os existentes', () => {
    const incoming = [
      { year: 2025, pct: 9.99 },
      { year: 2026, pct: 3.9 },
    ];
    const { series, additions } = mergeIpcaSeries(existing, incoming);
    expect(additions).toEqual([{ year: 2026, pct: 3.9 }]);
    expect(series.find((entry) => entry.year === 2025)!.pct).toBe(4.26);
    expect(series).toHaveLength(3);
  });

  it('retorna vazio quando não há novidade', () => {
    const { additions } = mergeIpcaSeries(existing, existing);
    expect(additions).toEqual([]);
  });
});
