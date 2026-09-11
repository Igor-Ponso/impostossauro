import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — o consolidador é .mjs sem tipos, de propósito: ele roda no
// runner do GitHub com node puro, fora do build do Nuxt.
import { lerArrecadacao } from '../scripts/coleta/consolidar.mjs';

/**
 * O CSV da Receita muda de convenção numérica no meio (vírgula de milhar em
 * 2001-2002, ponto de milhar depois) e 2005 traz três meses soltos de receita
 * previdenciária. O CSV de `fixtures/` reproduz as armadilhas, em latin-1.
 */
const fixture = join(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'arrecadacao-tres-armadilhas.csv',
);

const { porAnoUf, anosCompletos, reguaPorAno } = lerArrecadacao(fixture);

describe('lerArrecadacao — as duas armadilhas do CSV da Receita', () => {
  it('soma 2001 pela convencao em que a virgula e separador de milhar', () => {
    // 12 meses × 1.000.000. Com `Number('1,000,000')` o valor é NaN, o NaN é
    // descartado pelo guarda de `Number.isFinite`, e este total vira 0.
    expect(
      porAnoUf.get('2001|SP'),
      'zero aqui significa que a leitura do numero deixou de passar por numeroCsv',
    ).toBe(12_000_000);
  });

  it('soma 2026 pela convencao em que o ponto e separador de milhar', () => {
    // 6 meses × (3.000.000,50 + 900 + 100).
    expect(porAnoUf.get('2026|SP')).toBeCloseTo(6 * 3_001_000.5, 2);
  });

  it('conta os MESES da coluna de regua, nao a soma dela', () => {
    // Se aparecer 12, a contagem de meses virou soma da coluna — e 2005 se
    // declara de régua completa com três meses.
    expect(reguaPorAno.get(2005).previdenciaria.size).toBe(3);
    expect(reguaPorAno.get(2005).outrosOrgaos.size).toBe(12);
  });

  it('2005 nao e regua completa: falta previdenciaria em nove meses', () => {
    const regua = reguaPorAno.get(2005);
    const completa = regua.previdenciaria.size === 12 && regua.outrosOrgaos.size === 12;
    expect(completa, '2005 se declarou completo com tres meses soltos').toBe(false);
  });

  it('ano com os doze meses entra; ano pela metade nao', () => {
    expect(anosCompletos.has(2001), '2001 tem os doze meses e ficou de fora').toBe(true);
    expect(anosCompletos.has(2005), '2005 tem os doze meses e ficou de fora').toBe(true);
    expect(anosCompletos.has(2026), '2026 tem seis meses e entrou como ano fechado').toBe(false);
  });
});
