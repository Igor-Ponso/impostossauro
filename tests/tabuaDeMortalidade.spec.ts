import { describe, expect, it } from 'vitest';
import social from '../app/data/social-history.json';

/**
 * Dois produtos do IBGE para a mesma série: a Projeção da População (revisão
 * de 2018) dá 29,02‰ e 17,22‰ para 2000 e 2010; a Tábua Completa de
 * Mortalidade 2024, que cobre 1940 a 2024 num só lugar, dá 28,1‰ e 15,0‰.
 */
const acha = (chave: string) => social.indicators.find((i) => i.key === chave)!;

describe('mortalidade infantil e esperanca de vida saem de UM produto so', () => {
  for (const chave of ['infantMortality', 'lifeExpectancy']) {
    it(`${chave}: todo ponto cita a Tábua Completa de Mortalidade`, () => {
      const pontos = acha(chave).points;
      expect(pontos.length).toBeGreaterThan(3);
      for (const p of pontos) {
        expect(p.source, `${chave} ${p.year} saiu de outro produto: ${p.source}`)
          .toContain('Tábua Completa de Mortalidade');
      }
    });

    it(`${chave}: uma fonte só para a série inteira`, () => {
      const fontes = new Set(acha(chave).points.map((p) => p.source));
      expect(fontes.size, `a série cita ${fontes.size} fontes: ${[...fontes].join(' | ')}`).toBe(1);
    });
  }

  it('os valores batem com a Tábua 2024', () => {
    const mort = Object.fromEntries(acha('infantMortality').points.map((p) => [p.year, p.value]));
    expect(mort).toMatchObject({ 1940: 146.6, 1970: 97.6, 1991: 45.1, 2000: 28.1, 2010: 15.0, 2023: 12.5, 2024: 12.3 });

    const esp = Object.fromEntries(acha('lifeExpectancy').points.map((p) => [p.year, p.value]));
    expect(esp).toMatchObject({ 1940: 45.5, 1960: 52.5, 1980: 62.5, 2000: 71.1, 2010: 74.4, 2024: 76.6 });
  });

  it('os valores da projecao antiga nao voltam', () => {
    const mort = acha('infantMortality').points;
    expect(mort.find((p) => p.year === 2000)!.value).not.toBe(29.0);
    expect(mort.find((p) => p.year === 2010)!.value).not.toBe(17.2);
  });
});
