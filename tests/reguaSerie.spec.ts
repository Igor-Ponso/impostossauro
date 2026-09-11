import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { anosDaReguaCompleta } from '../app/utils/period';
import dados from '../app/data/tax-data.json';

/**
 * O arquivo da Receita não traz receita previdenciária antes de 2013: os anos
 * anteriores saem ~30% menores, e emendar as duas metades desenha um salto de
 * 56,6% em 2013 que é mudança de definição, não de arrecadação.
 */
describe('anosDaReguaCompleta', () => {
  it('devolve so os anos de regua completa', () => {
    const serie = [
      { year: 2011, ruler: 'nucleo' },
      { year: 2012, ruler: 'nucleo' },
      { year: 2013, ruler: 'completa' },
      { year: 2014, ruler: 'completa' },
    ];
    expect(anosDaReguaCompleta(serie).map((x) => x.year)).toEqual([2013, 2014]);
  });

  it('devolve vazio quando nenhum ano tem a regua completa', () => {
    expect(anosDaReguaCompleta([{ year: 2011, ruler: 'nucleo' }])).toEqual([]);
  });

  it('nao desenha ano sem regua declarada', () => {
    expect(anosDaReguaCompleta([{ year: 2013 }, { year: 2014, ruler: 'completa' }])
      .map((x) => x.year)).toEqual([2014]);
  });

  it('diante de buraco, fica com o trecho final e nao pula ano calado', () => {
    const serie = [
      { year: 2013, ruler: 'completa' },
      { year: 2015, ruler: 'completa' },
      { year: 2016, ruler: 'completa' },
    ];
    expect(anosDaReguaCompleta(serie).map((x) => x.year)).toEqual([2015, 2016]);
  });

  it('sobre a serie de verdade, devolve um trecho contiguo de uma regua so', () => {
    const desenhados = anosDaReguaCompleta(
      dados.federalRevenueSeries as Array<{ year: number; ruler: string }>,
    );
    expect(desenhados.length, 'o grafico ficaria vazio').toBeGreaterThan(1);
    expect(desenhados.every((x) => x.ruler === 'completa')).toBe(true);
    const anos = desenhados.map((x) => x.year);
    expect(anos, 'o grafico pularia um ano').toEqual(
      Array.from({ length: anos.length }, (_, i) => anos[0]! + i),
    );
  });

  /**
   * Os testes acima provam a função; nada impede o componente de deixar de
   * chamá-la. O `.vue` é lido como texto porque montá-lo exigiria o i18n e os
   * auto-imports do Nuxt.
   */
  describe('o grafico nao pode desenhar a serie crua', () => {
    const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
    const grafico = readFileSync(
      join(raiz, 'app', 'components', 'FederalRevenueChart.vue'),
      'utf-8',
    );

    it('passa a serie pela regua antes de desenhar', () => {
      expect(
        grafico,
        'FederalRevenueChart deixou de chamar anosDaReguaCompleta',
      ).toContain('anosDaReguaCompleta(taxData.federalRevenueSeries)');
    });

    it('nao usa a serie crua em lugar nenhum do desenho', () => {
      // Sobram as menções legítimas: a chamada acima e o filtro que monta
      // `naoDesenhados` (a ressalva dos anos que ficaram de fora).
      const mencoes = grafico.match(/taxData\.federalRevenueSeries/g) ?? [];
      expect(
        mencoes.length,
        'apareceu um uso novo da serie crua; ele precisa passar por anosDaReguaCompleta',
      ).toBe(2);
    });
  });
});
