import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import journey from '../app/data/journey.json';

/**
 * O número gigante de cada etapa é a alíquota do tributo marcado com `destaque`
 * — exatamente um por etapa, nunca digitado no template. Um `icon` com emoji de
 * volta no JSON não quebra build nenhum; só reaparece na tela.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const jornadaSrc = readFileSync(join(raiz, 'app', 'pages', 'jornada.vue'), 'utf-8');

const EMOJI = /\p{Extended_Pictographic}/u;

describe('jornada — o trilho substituiu o emoji pelo numero', () => {
  it('nenhuma etapa carrega emoji', () => {
    for (const etapa of journey.steps) {
      expect(
        'icon' in etapa,
        `a etapa "${etapa.key}" voltou a ter o campo icon`,
      ).toBe(false);
      expect(
        EMOJI.test(JSON.stringify(etapa)),
        `a etapa "${etapa.key}" tem emoji em algum campo`,
      ).toBe(false);
    }
  });

  it('o template da pagina nao tem emoji', () => {
    expect(EMOJI.test(jornadaSrc), 'jornada.vue voltou a ter emoji no template').toBe(false);
  });

  it('cada etapa tem exatamente uma aliquota em destaque', () => {
    for (const etapa of journey.steps) {
      const destaques = etapa.taxes.filter((tributo) => 'destaque' in tributo && tributo.destaque);
      expect(
        destaques.length,
        `a etapa "${etapa.key}" tem ${destaques.length} destaques; o monumento precisa de exatamente 1`,
      ).toBe(1);
    }
  });

  it('o destaque tem alíquota e nome — é ele que vira o número e a legenda', () => {
    for (const etapa of journey.steps) {
      const destaque = etapa.taxes.find((tributo) => 'destaque' in tributo && tributo.destaque)!;
      expect(destaque.rate.trim().length, `o destaque de "${etapa.key}" esta sem rate`).toBeGreaterThan(0);
      expect(destaque.name.trim().length, `o destaque de "${etapa.key}" esta sem name`).toBeGreaterThan(0);
    }
  });

  it('o numero gigante nasce do destaque, nunca digitado no template', () => {
    for (const etapa of journey.steps) {
      const destaque = etapa.taxes.find((tributo) => 'destaque' in tributo && tributo.destaque)!;
      expect(
        jornadaSrc.includes(destaque.rate),
        `"${destaque.rate}" (etapa "${etapa.key}") foi digitado no template em vez de sair do JSON`,
      ).toBe(false);
    }
  });
});
