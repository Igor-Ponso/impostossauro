import { describe, expect, it } from 'vitest';
import {
  caminhoSemIdioma, ehTrocaDeIdioma, idiomaDaRota, paginaDaRota,
} from '../app/router.options';

/**
 * Trocar de idioma é navegação, e o padrão do Nuxt manda ao topo. A regra aqui
 * é estreita de propósito: só mantém a posição quando é a MESMA página no outro
 * idioma. Qualquer outra navegação continua subindo, como o leitor espera.
 */
describe('idiomaDaRota', () => {
  it('so o ingles leva prefixo', () => {
    expect(idiomaDaRota('/en/economia-101')).toBe('en');
    expect(idiomaDaRota('/en')).toBe('en');
    expect(idiomaDaRota('/economia-101')).toBe('pt-BR');
    expect(idiomaDaRota('/')).toBe('pt-BR');
  });

  /** `/enxoval` começa com "en" e NÃO é inglês: o limite é a barra. */
  it('nao confunde caminho que so comeca com as letras "en"', () => {
    expect(idiomaDaRota('/eles-gastaram')).toBe('pt-BR');
    expect(idiomaDaRota('/energia')).toBe('pt-BR');
  });
});

describe('paginaDaRota', () => {
  it('tira o sufixo de idioma do nome da rota', () => {
    expect(paginaDaRota('economia-101___en')).toBe('economia-101');
    expect(paginaDaRota('economia-101___pt-BR')).toBe('economia-101');
    expect(paginaDaRota('comparacao-global-pais___en')).toBe('comparacao-global-pais');
  });

  it('devolve vazio quando nao ha nome', () => {
    expect(paginaDaRota(undefined)).toBe('');
    expect(paginaDaRota(null)).toBe('');
    expect(paginaDaRota(Symbol('x'))).toBe('');
  });
});

describe('caminhoSemIdioma', () => {
  it('normaliza prefixo e barra final', () => {
    expect(caminhoSemIdioma('/en/manifesto')).toBe('/manifesto');
    expect(caminhoSemIdioma('/manifesto/')).toBe('/manifesto');
    expect(caminhoSemIdioma('/en')).toBe('/');
    expect(caminhoSemIdioma('/')).toBe('/');
  });
});

describe('ehTrocaDeIdioma', () => {
  it('reconhece a mesma pagina no outro idioma, pelo nome da rota', () => {
    expect(ehTrocaDeIdioma(
      { path: '/en/economia-101', name: 'economia-101___en' },
      { path: '/economia-101', name: 'economia-101___pt-BR' },
    )).toBe(true);
  });

  /** A página de país tem slug traduzido: o nome da rota é o que salva. */
  it('funciona com rota dinamica de slug diferente', () => {
    expect(ehTrocaDeIdioma(
      { path: '/en/comparacao-global/switzerland', name: 'comparacao-global-pais___en' },
      { path: '/comparacao-global/suica', name: 'comparacao-global-pais___pt-BR' },
    )).toBe(true);
  });

  it('funciona sem nome de rota, pelo caminho', () => {
    expect(ehTrocaDeIdioma({ path: '/en/manifesto' }, { path: '/manifesto/' })).toBe(true);
  });

  it('navegar entre paginas diferentes NAO e troca de idioma', () => {
    expect(ehTrocaDeIdioma(
      { path: '/en/manifesto', name: 'manifesto___en' },
      { path: '/economia-101', name: 'economia-101___pt-BR' },
    )).toBe(false);
  });

  it('trocar de pagina no MESMO idioma continua subindo ao topo', () => {
    expect(ehTrocaDeIdioma(
      { path: '/manifesto', name: 'manifesto___pt-BR' },
      { path: '/economia-101', name: 'economia-101___pt-BR' },
    )).toBe(false);
  });

  it('a home das duas rotas conta como a mesma pagina', () => {
    expect(ehTrocaDeIdioma(
      { path: '/en', name: 'index___en' },
      { path: '/', name: 'index___pt-BR' },
    )).toBe(true);
  });
});
