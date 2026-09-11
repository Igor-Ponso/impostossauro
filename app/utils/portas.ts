import fallacies from '~/data/fallacies.json';
import promises from '~/data/promises.json';
import states from '~/data/states.json';
import taxData from '~/data/tax-data.json';

/**
 * Só os valores; as palavras vêm de `doors.numbers.*` no i18n. Cada valor é lido
 * do mesmo JSON que a página consome, nunca digitado; página sem número conferido
 * fica de fora. `tests/portasNumeros.spec.ts` confere cada um contra a origem.
 */
export function numerosDasPortas(locale: string): Record<string, Record<string, string | number>> {
  const ultimaFederal = taxData.federalRevenueSeries.at(-1)!;
  const emTrilhoes = (bilhoes: number) =>
    (bilhoes / 1000).toLocaleString(locale, { maximumFractionDigits: 2 });

  return {
    calculator: { days: taxData.workDays.days },
    inflation: { trillions: emTrilhoes(ultimaFederal.totalBillions), year: ultimaFederal.year },
    fallacies: { trillions: fallacies.fortyTrillion.totalTrillions, years: fallacies.fortyTrillion.periodYears },
    publicMachine: { years: states.fiscalYears.length, states: Object.keys(states.states).length },
    promises: { count: promises.cases.length },
  };
}

/**
 * O número leva junto a palavra seguinte: "R$ 2,86" sozinho lê como dois reais e
 * oitenta e seis centavos, e é o "tri" que dá a escala. O resto vira legenda,
 * mesmo vazia ("4 casos"). `tests/portasNumeros.spec.ts` trava os pares.
 */
export function partesDoNumero(frase: string): { numero: string; legenda: string } {
  const casaBasica = frase.match(/^[^\d]*[\d.,]+/);
  if (!casaBasica) return { numero: frase, legenda: '' };
  const resto = frase.slice(casaBasica[0].length);
  const proximaPalavra = resto.match(/^\s*[^\s,]+/);
  const numero = (proximaPalavra ? casaBasica[0] + proximaPalavra[0] : casaBasica[0]).trim();
  const legenda = (proximaPalavra ? resto.slice(proximaPalavra[0].length) : resto)
    .replace(/^[,\s]+/, '')
    .trim();
  return { numero, legenda };
}
