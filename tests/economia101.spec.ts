import { describe, expect, it } from 'vitest';
import econ from '../app/data/economia101.json';

/**
 * A URL pode estar certa e a descrição ao lado dela errada (edição ou ano-base
 * diferentes) — defeito invisível para quem só confere se o link existe.
 */
describe('economia101 — a descricao da fonte nao pode contradizer o link', () => {
  const cards = econ.worldData as Array<{
    key: string;
    source: string;
    url: string;
    label: string;
  }>;

  it('descreve a mesma edicao que o link aponta', () => {
    for (const card of cards) {
      const naUrl = card.url.match(/(\d+)a-edicao/);
      if (!naUrl) continue;
      const naDescricao = card.source.match(/(\d+)ª edição/);
      expect(naDescricao, `${card.key}: a url cita edicao mas a fonte nao`).not.toBeNull();
      expect(
        naDescricao![1],
        `${card.key}: a fonte diz ${naDescricao![1]}a edicao e a url aponta para a ${naUrl[1]}a`,
      ).toBe(naUrl[1]);
    }
  });

  it('descreve o mesmo ano-base que o link aponta', () => {
    for (const card of cards) {
      const naUrl = card.url.match(/dados-de-(\d{4})/);
      if (!naUrl) continue;
      const anosNaDescricao = card.source.match(/\b(19|20)\d{2}\b/g) ?? [];
      expect(
        anosNaDescricao,
        `${card.key}: a fonte cita ${anosNaDescricao.join(', ') || 'nenhum ano'} `
        + `e a url aponta para dados de ${naUrl[1]}`,
      ).toContain(naUrl[1]);
    }
  });

  it('nao afirma contagem de anos consecutivos sem a fonte sustentar', () => {
    // O IBPT publica a tabela por edição (14, desde 2011) e não fala em anos consecutivos.
    for (const card of cards) {
      expect(
        /\d+º ano consecutivo/.test(card.label),
        `${card.key}: afirma "ano consecutivo", que o estudo do IBPT nao declara. `
        + 'Ele publica a tabela por edicao — use "nas N edicoes do estudo".',
      ).toBe(false);
    }
  });
});
