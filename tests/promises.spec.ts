import { describe, expect, it } from 'vitest';
import { casosPublicaveis, type PromiseCase } from '~/utils/promises';
import promises from '~/data/promises.json';

const base: PromiseCase = {
  id: 'exemplo',
  layer: 'tributo',
  promise: { legalText: 'o produto da arrecadacao sera destinado a X' },
  verified: 'primaria',
};

describe('casosPublicaveis', () => {
  it('publica o caso conferido na fonte primaria', () => {
    expect(casosPublicaveis([base])).toHaveLength(1);
  });

  it('nunca publica caso de segunda mao', () => {
    const segundaMao = { ...base, verified: 'secundaria' as const };
    expect(casosPublicaveis([segundaMao])).toHaveLength(0);
  });

  it('nunca publica caso sem o texto da lei, mesmo marcado como primaria', () => {
    const semTexto = { ...base, promise: { legalText: '' } };
    expect(casosPublicaveis([semTexto])).toHaveLength(0);
  });

  it('nao quebra com lista vazia', () => {
    expect(casosPublicaveis([])).toEqual([]);
  });

  it('preserva a ordem dos casos que passam', () => {
    const a = { ...base, id: 'a' };
    const b = { ...base, id: 'b' };
    const reprovado = { ...base, id: 'x', verified: 'secundaria' as const };
    expect(casosPublicaveis([a, reprovado, b]).map((c) => c.id)).toEqual(['a', 'b']);
  });
});

describe('integridade das citacoes legais', () => {
  it('todo texto de lei publicado tem acentuacao portuguesa', () => {
    // Nenhum texto legal brasileiro desta extensao passa sem um unico acento;
    // transcricao sem acento adultera a citacao.
    const acentos = /[áàâãéêíóôõúüç]/i;
    for (const caso of promises.cases as PromiseCase[]) {
      const textos = [
        caso.promise.legalText,
        (caso.promise as Record<string, unknown>).deadlineText,
        (caso.outcome as Record<string, unknown> | undefined)?.legalText,
      ].filter((t): t is string => typeof t === 'string' && t.length > 80);

      for (const texto of textos) {
        expect(acentos.test(texto), `sem acento: ${texto.slice(0, 60)}`).toBe(true);
      }
    }
  });
});
