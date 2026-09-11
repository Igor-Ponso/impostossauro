import { describe, expect, it } from 'vitest';
import { resolveTheme, revealRadius, THEME_STORAGE_KEY } from '~/utils/theme';

describe('resolveTheme', () => {
  it('cai no escuro quando nada foi salvo', () => {
    expect(resolveTheme(null)).toBe('dark');
  });

  it('respeita a escolha pelo claro', () => {
    expect(resolveTheme('light')).toBe('light');
  });

  it('respeita a escolha pelo escuro', () => {
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('ignora valor invalido e volta ao escuro', () => {
    expect(resolveTheme('roxo')).toBe('dark');
    expect(resolveTheme('')).toBe('dark');
  });

  it('expoe a chave de armazenamento usada pelo script do head', () => {
    expect(THEME_STORAGE_KEY).toBe('impostossauro-tema');
  });
});

describe('revealRadius', () => {
  it('cobre a tela quando o clique esta no canto superior esquerdo', () => {
    // diagonal completa de 800x600 = 1000
    expect(revealRadius(0, 0, 800, 600)).toBe(1000);
  });

  it('cobre a tela quando o clique esta no canto inferior direito', () => {
    expect(revealRadius(800, 600, 800, 600)).toBe(1000);
  });

  it('usa o canto mais distante quando o clique esta no meio', () => {
    // do centro ate qualquer canto: 400x300 -> 500
    expect(revealRadius(400, 300, 800, 600)).toBe(500);
  });

  it('cobre a tela a partir do canto onde o botao realmente fica', () => {
    // o botao vive no alto a direita; o canto mais distante e o de baixo a esquerda
    expect(revealRadius(780, 20, 800, 600)).toBeCloseTo(
      Math.hypot(780, 580),
      5,
    );
  });
});
