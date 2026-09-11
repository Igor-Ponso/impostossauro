import { describe, expect, it } from 'vitest';
import { QUADROS_POR_SEGUNDO, passouOIntervalo } from '../app/utils/relogio';

/**
 * Ler `new Date()` a cada quadro re-renderiza a home 120 vezes por segundo num
 * monitor de 120 Hz. O contador não precisa disso: o algarismo que gira leva
 * 0,4 s para virar, e os centavos são borrão em qualquer taxa.
 */
describe('relogio do contador — cadencia', () => {
  it('a cadencia e menor que a de um monitor comum', () => {
    expect(QUADROS_POR_SEGUNDO).toBeLessThan(60);
    expect(QUADROS_POR_SEGUNDO).toBeGreaterThanOrEqual(24);
  });

  it('segura o quadro que chega cedo demais', () => {
    const intervalo = 1000 / QUADROS_POR_SEGUNDO;
    expect(passouOIntervalo(1000, 1000 + intervalo / 2)).toBe(false);
  });

  it('libera o quadro que completou o intervalo', () => {
    const intervalo = 1000 / QUADROS_POR_SEGUNDO;
    expect(passouOIntervalo(1000, 1000 + intervalo)).toBe(true);
  });

  it('o primeiro quadro sempre passa', () => {
    expect(passouOIntervalo(null, 0)).toBe(true);
  });

  it('descarta 3 de cada 4 quadros a 120 Hz', () => {
    let ultimo: number | null = null;
    let passaram = 0;
    for (let q = 0; q < 120; q++) {
      const agora = (q * 1000) / 120;
      if (passouOIntervalo(ultimo, agora)) {
        passaram++;
        ultimo = agora;
      }
    }
    expect(passaram).toBe(QUADROS_POR_SEGUNDO);
  });
});
