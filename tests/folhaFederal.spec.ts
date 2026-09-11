import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { naPandemia } from '../app/utils/pandemia';

/**
 * A frase da peça só é verdadeira inteira: a folha quase dobrou em reais de hoje
 * e a fatia da receita caiu, porque a receita mais que triplicou. A série da
 * Tabela 1.1-A já vem deflacionada pelo Tesouro — daí `deflatorBase` obrigatório.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dados = JSON.parse(readFileSync(join(raiz, 'app', 'data', 'federal-payroll.json'), 'utf-8')) as {
  deflatorBase: string;
  source: string;
  url: string;
  years: Array<{ year: number; payrollBi: number; netRevenueBi: number; pctOfRevenue: number }>;
  intro: string;
  growth: { text: string };
  pandemic: { text: string };
  question: string;
};

const anos = dados.years;
const primeiro = anos[0]!;
const ultimo = anos.at(-1)!;

describe('a serie da folha do Governo Central', () => {
  it('vai de 1997 a 2025, sem buraco e so com ano fechado', () => {
    expect(primeiro.year).toBe(1997);
    expect(ultimo.year).toBe(2025);
    expect(anos).toHaveLength(2025 - 1997 + 1);
    anos.forEach((a, i) => expect(a.year).toBe(1997 + i));
  });

  it('declara a base do deflator — sem ela o numero nao significa nada', () => {
    expect(dados.deflatorBase).toMatch(/\d{4}/);
    expect(dados.url.startsWith('https://')).toBe(true);
  });

  it('publica pct_da_receita coerente com as duas colunas, ano a ano', () => {
    // A folga de 0,12 pp é de arredondamento: as colunas saem em bilhões com uma
    // casa e o percentual foi calculado antes disso (2019: 23,25 refeito × 23,2).
    for (const a of anos) {
      const refeito = (a.payrollBi / a.netRevenueBi) * 100;
      expect(Math.abs(refeito - a.pctOfRevenue), `${a.year}: ${refeito.toFixed(2)} vs ${a.pctOfRevenue}`)
        .toBeLessThan(0.12);
    }
  });

  it('a folha quase dobrou em reais de hoje', () => {
    const crescimento = ultimo.payrollBi / primeiro.payrollBi;
    expect(crescimento).toBeGreaterThan(1.8);
    expect(crescimento).toBeLessThan(2.1);
  });

  it('e a receita cresceu MAIS que a folha — e por isso a fatia caiu', () => {
    const folha = ultimo.payrollBi / primeiro.payrollBi;
    const receita = ultimo.netRevenueBi / primeiro.netRevenueBi;
    expect(receita).toBeGreaterThan(folha);
    expect(receita).toBeGreaterThan(3);
    expect(ultimo.pctOfRevenue).toBeLessThan(primeiro.pctOfRevenue);
  });

  it('marca a pandemia, onde a fatia sobe porque a RECEITA caiu', () => {
    const p2019 = anos.find((a) => a.year === 2019)!;
    const p2020 = anos.find((a) => a.year === 2020)!;
    expect(naPandemia(2020)).toBe(true);
    expect(p2020.netRevenueBi).toBeLessThan(p2019.netRevenueBi);
    expect(p2020.pctOfRevenue).toBeGreaterThan(p2019.pctOfRevenue);
  });

  it('escreve os numeros da prosa na regua do portugues', () => {
    // Prosa gerada por script sai com separador do inglês ("2442", "29.8").
    const decimalIngles = /\d+\.\d{1,2}(?![\d-])/;
    for (const [nome, texto] of Object.entries({
      intro: dados.intro,
      'growth.text': dados.growth.text,
      'pandemic.text': dados.pandemic.text,
      question: dados.question,
    })) {
      expect(decimalIngles.test(texto), `${nome}: ${texto.match(decimalIngles)?.[0]}`).toBe(false);
    }
    expect(dados.growth.text).toContain('2.442');
    expect(dados.growth.text).toContain('29,8%');
  });
});
