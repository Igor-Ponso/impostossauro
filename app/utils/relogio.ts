/**
 * O contador não precisa da taxa do monitor: a virada leva 0,4 s (`odometro.ts`)
 * e os centavos são borrão em qualquer cadência. A 120 Hz, cada quadro re-renderizava a home.
 */
export const QUADROS_POR_SEGUNDO = 30;

const INTERVALO_MS = 1000 / QUADROS_POR_SEGUNDO;

/**
 * A 120 Hz, 4 × 8,333 ms cai um fio abaixo de 33,333 em ponto flutuante; sem a
 * folga o quadro certo é recusado e o relógio marca 27 vezes por segundo.
 */
const TOLERANCIA_MS = 2;

export function passouOIntervalo(ultimo: number | null, agora: number): boolean {
  if (ultimo === null) return true;
  return agora - ultimo >= INTERVALO_MS - TOLERANCIA_MS;
}
