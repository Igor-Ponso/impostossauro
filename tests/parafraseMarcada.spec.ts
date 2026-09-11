import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import contrasts from '../app/data/contrasts.json';
import governments from '../app/data/governments.json';

/**
 * Aspas prometem fala literal. Resumo de veículo, tradução livre ou frase
 * relatada por terceiro só entra com `paraphrase: true`, que tira as aspas na
 * tela e escreve "paráfrase" ao lado. O marcador antigo, "(paráfrase)" dentro do
 * contexto, não vale: a tela não o lia.
 */
const MARCA = /par[áa]frase|paraphrase|resume o post|nas palavras de|relatad/i;

interface Fala { quote: string | { text: string }; context?: string; occasion?: string; paraphrase?: boolean }

function falas(): { onde: string; fala: Fala }[] {
  const saida: { onde: string; fala: Fala }[] = [];
  governments.governments.forEach((governo, g) => {
    governo.promises.forEach((promessa, p) => saida.push({ onde: `governments[${g}].promises[${p}]`, fala: promessa }));
    if (governo.excuse) saida.push({ onde: `governments[${g}].excuse`, fala: governo.excuse });
  });
  contrasts.contrasts.forEach((contraste, c) => saida.push({ onde: `contrasts[${c}].quote`, fala: { ...contraste.quote, quote: contraste.quote } }));
  return saida;
}

describe('parafrase nunca sai entre aspas', () => {
  it.each(falas().map((f) => [f.onde, f.fala]))('%s: contexto que fala em parafrase leva a marca', (_onde, fala) => {
    const contexto = `${fala.context ?? ''} ${fala.occasion ?? ''}`;
    if (MARCA.test(contexto)) expect(fala.paraphrase).toBe(true);
  });

  it('as falas marcadas existem e sao as conhecidas', () => {
    const marcadas = falas().filter((f) => f.fala.paraphrase === true).map((f) => f.onde);
    expect(marcadas).toEqual([
      'governments[0].promises[1]',
      'governments[1].promises[0]',
      'governments[1].promises[1]',
      'governments[2].promises[0]',
      'governments[2].promises[1]',
      'governments[2].promises[2]',
      'governments[3].promises[1]',
      'governments[3].promises[2]',
      'governments[3].excuse',
      'contrasts[1].quote',
    ]);
  });

  it('as telas tiram as aspas da parafrase', () => {
    const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'components');
    for (const nome of ['MandateDossier.vue', 'QuoteContrast.vue']) {
      const fonte = readFileSync(join(raiz, nome), 'utf-8');
      expect(fonte).toContain('paraphrase');
      expect(fonte).toContain("t('dossier.paraphrase')");
    }
  });
});
