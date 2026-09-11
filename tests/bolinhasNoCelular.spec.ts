import { describe, expect, it } from 'vitest';
import { LARGURA_MINIMA_BOLINHAS, aparelhoDeToque, podeMostrarBolinhas } from '../app/utils/bolinhas';

/**
 * 100 esferas com física em WebGL travam celular de topo de linha. A regra vive
 * numa função pura porque o navegador de teste não tem WebGL2: o `Ballpit` nunca
 * monta, e uma verificação em tela não distinguiria guarda de falta de GPU.
 */
const ok = {
  semMovimento: false,
  ponteiroGrosso: false,
  largura: 1440,
  temWebGL2: true,
};

describe('bolinhas do café — quem entra e quem fica de fora', () => {
  it('desktop com GPU e ponteiro fino: entra', () => {
    expect(podeMostrarBolinhas(ok)).toBe(true);
  });

  it('celular pela LARGURA: não entra', () => {
    expect(podeMostrarBolinhas({ ...ok, largura: 390 })).toBe(false);
    expect(podeMostrarBolinhas({ ...ok, largura: LARGURA_MINIMA_BOLINHAS - 1 })).toBe(false);
    expect(podeMostrarBolinhas({ ...ok, largura: LARGURA_MINIMA_BOLINHAS })).toBe(true);
  });

  /** Tablet em paisagem passa na largura e é pego aqui. */
  it('aparelho de toque, mesmo largo: não entra', () => {
    expect(podeMostrarBolinhas({ ...ok, ponteiroGrosso: true })).toBe(false);
    expect(podeMostrarBolinhas({ ...ok, ponteiroGrosso: true, largura: 1440 })).toBe(false);
  });

  it('movimento reduzido: não entra', () => {
    expect(podeMostrarBolinhas({ ...ok, semMovimento: true })).toBe(false);
  });

  it('sem WebGL2: não entra', () => {
    expect(podeMostrarBolinhas({ ...ok, temWebGL2: false })).toBe(false);
  });

  it('o corte é de tablet para cima, nao de celular grande', () => {
    expect(LARGURA_MINIMA_BOLINHAS).toBeGreaterThanOrEqual(1024);
  });
});

/** A mesma guarda serve às bolinhas e ao vidro de filtro SVG: no toque, os dois saem. */
describe('aparelho de toque — sem vidro de filtro SVG', () => {
  it('dedo, em qualquer largura: é toque', () => {
    expect(aparelhoDeToque({ ponteiroGrosso: true, largura: 390 })).toBe(true);
    expect(aparelhoDeToque({ ponteiroGrosso: true, largura: 1440 })).toBe(true);
  });

  it('tela estreita, mesmo com cursor: conta como toque', () => {
    expect(aparelhoDeToque({ ponteiroGrosso: false, largura: 390 })).toBe(true);
    expect(aparelhoDeToque({ ponteiroGrosso: false, largura: LARGURA_MINIMA_BOLINHAS - 1 })).toBe(true);
  });

  it('desktop com cursor: não é toque', () => {
    expect(aparelhoDeToque({ ponteiroGrosso: false, largura: LARGURA_MINIMA_BOLINHAS })).toBe(false);
    expect(aparelhoDeToque({ ponteiroGrosso: false, largura: 1440 })).toBe(false);
  });
});
