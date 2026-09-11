import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import taxData from '../app/data/tax-data.json';

/**
 * A definição da série vive no dado (`federalRevenueDefinition`, em
 * `tax-data.json`); a página tem de lê-la campo por campo, porque texto
 * duplicado à mão é como duas versões se separam.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const pagina = readFileSync(join(raiz, 'app', 'pages', 'metodologia.vue'), 'utf-8');

describe('metodologia documenta a serie federal', () => {
  it('le a definicao do proprio dado', () => {
    expect(pagina, 'a pagina nao usa federalRevenueDefinition').toContain('federalRevenueDefinition');
  });

  it.each(['metric', 'includes', 'note', 'source', 'url'])('mostra o campo %s', (campo) => {
    expect(pagina).toMatch(new RegExp(`serieFederal\\.${campo}`));
  });

  it('percorre TODAS as reguas, e nao so a que vai ao grafico', () => {
    expect(pagina, 'a pagina escolhe reguas a mao em vez de percorrer o dado').toMatch(
      /v-for="\(texto, regua\) in serieFederal\.rulers"/,
    );
    expect(Object.keys(taxData.federalRevenueDefinition.rulers).length).toBeGreaterThanOrEqual(2);
  });

  it('o aviso interno nao vai para a tela', () => {
    // `avisoParaQuemPublicar` fala com quem mexe no dado, nao com quem le a metodologia.
    expect(taxData.federalRevenueDefinition).toHaveProperty('avisoParaQuemPublicar');
    expect(pagina, 'o aviso interno esta sendo renderizado').not.toContain('avisoParaQuemPublicar');
    expect(taxData.federalRevenueDefinition.rulers.nucleo).not.toContain('ATENÇÃO');
  });

  it('nao copia a prosa da definicao para dentro da pagina', () => {
    const inicioDoNote = taxData.federalRevenueDefinition.note.slice(0, 40);
    expect(
      pagina.includes(inicioDoNote),
      'o texto foi duplicado na pagina; ele precisa vir do JSON',
    ).toBe(false);
  });
});
