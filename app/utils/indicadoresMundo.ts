import world from '~/data/world.json';
import type { IndicadorMundo } from '~/utils/mundo';

/** JSON infere array aberto; a escala do gráfico exige exatamente dois extremos. */
export const indicadoresMundo: IndicadorMundo[] = world.indicadores.map((indicador) => {
  if (indicador.escala.length !== 2 || !indicador.escala.every(Number.isFinite)) {
    throw new Error(`Escala inválida: ${indicador.id}`);
  }
  return {
    ...indicador,
    escala: [indicador.escala[0]!, indicador.escala[1]!] as [number, number],
    movimento: indicador.movimento ?? '',
  } as IndicadorMundo;
});
