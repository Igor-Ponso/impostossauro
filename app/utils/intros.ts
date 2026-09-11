/**
 * O texto de cada secao da home vem do bloco de i18n da propria pagina; a home
 * nao redige apresentacao nenhuma, para nao haver duas versoes a sincronizar.
 */
export interface IntroDaPagina {
  kicker: string;
  title: string;
  paragrafo: string;
  resumo?: string;
}

const BLOCO: Record<string, string> = {
  journey: 'journey',
  calculator: 'calculator',
  timeMachine: 'timeMachine',
  inflation: 'inflationPage',
  fallacies: 'fallacies',
  economics: 'econ101',
  business: 'business',
  publicMachine: 'federative',
  spending: 'spending',
  manifesto: 'manifesto',
  methodology: 'methodology',
  promises: 'promises',
  world: 'world',
  whatItBuys: 'whatItBuys',
};

export function introDaPagina(chave: string): IntroDaPagina {
  const bloco = BLOCO[chave];
  if (!bloco) throw new Error(`intros.ts nao conhece a pagina "${chave}"`);
  // A Metodologia nao tem kicker nem tldr proprios.
  if (chave === 'methodology') {
    return {
      kicker: `nav.hints.${chave}`,
      title: `${bloco}.title`,
      paragrafo: `${bloco}.intro`,
    };
  }
  return {
    kicker: `${bloco}.kicker`,
    title: `${bloco}.title`,
    paragrafo: `${bloco}.intro`,
    resumo: `${bloco}.tldr`,
  };
}
