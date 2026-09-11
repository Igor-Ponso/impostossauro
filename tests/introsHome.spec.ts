import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en.json';
import pt from '../i18n/locales/pt-BR.json';
import { navEntries, navGroups } from '../app/utils/navegacao';
import { introDaPagina } from '../app/utils/intros';

/**
 * Nenhum texto novo nasce na home: cada secao reaproveita o kicker, o titulo e a
 * frase-resumo que a propria pagina ja publica, para nao duplicar a fonte.
 */
const locales: Record<string, Record<string, Record<string, string>>> = {
  'pt-BR': pt as never,
  en: en as never,
};

describe('secoes introdutorias da home', () => {
  it('toda pagina do site tem uma, e uma so', () => {
    const cobertas = navGroups.flatMap((g) => g.items);
    expect(cobertas.length).toBe(navEntries.length);
    for (const entrada of navEntries) {
      expect(cobertas, `a pagina "${entrada.key}" ficou sem secao`).toContain(entrada.key);
    }
  });

  it('todo texto de secao existe nos dois idiomas e vem da propria pagina', () => {
    for (const entrada of navEntries) {
      const intro = introDaPagina(entrada.key);
      const caminhos = [intro.kicker, intro.title, intro.paragrafo, intro.resumo].filter(
        (c): c is string => c !== undefined,
      );
      for (const [nome, l] of Object.entries(locales)) {
        for (const caminho of caminhos) {
          const valor = caminho.split('.').reduce<unknown>((o, p) => (o as never)?.[p], l);
          expect(
            typeof valor === 'string' && valor.length > 0,
            `${nome}: a chave "${caminho}", usada na secao de "${entrada.key}", nao existe. `
              + 'Nada no portao acusa traducao faltando — o texto vai ao ar vazio.',
          ).toBe(true);
        }
      }
    }
  });

  it('nenhuma chave de secao aponta para um namespace criado so para a home', () => {
    const proibidos = ['doors.', 'intro.', 'home.'];
    for (const entrada of navEntries) {
      const intro = introDaPagina(entrada.key);
      const caminhos = [intro.kicker, intro.title, intro.paragrafo, intro.resumo].filter(
        (c): c is string => c !== undefined,
      );
      for (const caminho of caminhos) {
        for (const p of proibidos) {
          expect(
            caminho.startsWith(p),
            `a secao de "${entrada.key}" usa "${caminho}", que e texto escrito para a home. `
              + 'A secao tem que reaproveitar o texto da propria pagina.',
          ).toBe(false);
        }
      }
    }
  });

  it('a metodologia nao tem frase de efeito', () => {
    expect(introDaPagina('methodology').resumo).toBeUndefined();
  });

  it('o manifesto usa o titulo real da pagina, nao a lista de negativas sem contexto', () => {
    // manifesto.notTitle ("O que este site NAO e") encabeca uma lista na pagina de
    // origem; sem a lista vira manchete falsa sobre um paragrafo que diz o que o site é.
    expect(introDaPagina('manifesto').title).toBe('manifesto.title');
  });
});
