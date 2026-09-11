import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * O lucro anunciado das 44 estatais soma dois caixas que não se tocam: as
 * dependentes custam ao Tesouro e não pagam dividendo; as não dependentes dão o
 * lucro. CODERN e INFRAERO são as exceções declaradas, abaixo de 1% do repasse.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dados = JSON.parse(readFileSync(join(raiz, 'app', 'data', 'state-companies.json'), 'utf-8')) as {
  period: string;
  announced: { profitBi: number };
  totals: { receivedBi: number; dividendsToUnionBi: number; profitBi: number; employees: number };
  groups: Array<{
    key: 'dependente' | 'naoDependente';
    count: number;
    receivedBi: number;
    dividendsToUnionBi: number;
    profitBi: number;
    employees: number;
  }>;
  exceptions: { tickers: string[]; receivedBi: number };
  topReceivers: Array<{ ticker: string; receivedBi: number; profitBi: number }>;
  topPayers: Array<{ ticker: string; dividendsToUnionBi: number }>;
};

const dep = dados.groups.find((g) => g.key === 'dependente')!;
const ind = dados.groups.find((g) => g.key === 'naoDependente')!;

describe('as estatais federais, pela planilha da SEST', () => {
  it('separa as 44 empresas em 17 dependentes e 27 nao dependentes', () => {
    expect(dep.count + ind.count).toBe(44);
    expect(dep.count).toBe(17);
    expect(ind.count).toBe(27);
  });

  it('nenhuma dependente devolve um centavo a Uniao', () => {
    expect(dep.dividendsToUnionBi).toBe(0);
  });

  it('o lucro anunciado vem de quem NAO custa ao Tesouro', () => {
    expect(ind.profitBi).toBeGreaterThan(dados.announced.profitBi);
    expect(dep.profitBi).toBeLessThan(0);
  });

  it('declara as duas excecoes, e elas sao menos de 1% do repasse', () => {
    expect(dados.exceptions.tickers).toEqual(['CODERN', 'INFRAERO']);
    expect(dados.exceptions.receivedBi / dados.totals.receivedBi).toBeLessThan(0.01);
    // e a soma dos dois grupos tem de fechar com o total, excecoes incluidas
    expect(dep.receivedBi + ind.receivedBi).toBeCloseTo(dados.totals.receivedBi, 1);
  });

  it('volta a Uniao menos de um terco do lucro anunciado', () => {
    expect(dados.totals.dividendsToUnionBi).toBeLessThan(dados.announced.profitBi / 3);
  });

  it('lista quem mais recebe e quem mais devolve, sem cruzar as listas', () => {
    expect(dados.topReceivers.length).toBeGreaterThanOrEqual(5);
    expect(dados.topPayers.length).toBeGreaterThanOrEqual(4);
    const recebem = new Set(dados.topReceivers.map((e) => e.ticker));
    expect(dados.topPayers.some((e) => recebem.has(e.ticker))).toBe(false);
  });

  it('soma os empregados dos dois grupos no total publicado', () => {
    expect(dep.employees + ind.employees).toBe(dados.totals.employees);
  });
});
