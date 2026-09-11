import { ref } from 'vue';
import { converterTextoMonetario, type ContextoDeMoeda } from './moedaNoTexto';

/**
 * A moeda escolhida vive no módulo, e não em `useState`, porque o funil de dados
 * é uma função pura chamada fora de componente. A geração é estática e roda uma
 * vez, sempre em real, então não há requisição concorrente para vazar estado.
 */
export const contextoDaMoeda = ref<ContextoDeMoeda>({
  moeda: 'BRL',
  taxa: 1,
  idioma: 'pt-BR',
  escalas: { trillions: 'trilhões', billions: 'bilhões', millions: 'milhões' },
});

/**
 * Quantia que é unidade de razão ("a cada R$ 100"), base didática ("uma nota de
 * R$ 100") ou objeto físico ("moedas de R$ 1") não converte: o número ali é a
 * régua, não a medida. Converter tornaria a frase falsa ou ilegível.
 */
export const CHAVES_EM_REAL = new Set([
  'journey.title',
  'share.journeyText',
  'profit.perHundred',
  'federative.ratioTitle',
  'map.legendTitle',
  'map.per100',
  'whatItBuys.tldr',
  'whatItBuys.homeNumberMoon',
  'whatItBuys.heroLead',
  'timeMachine.inflationThen',
  'purchasingPower.noteTitle',
  'purchasingPower.noteLegend',
  'inflationPage.hyper.realNote',
  'inflationPage.equivalenceLegend',
]);

/** Mesmo motivo, do lado dos dados: a régua "quanto volta a cada R$ 100". */
export const CAMINHOS_EM_REAL: Record<string, string[]> = {
  'federative.json': ['returnRatio.narrowRuler'],
};

export function ehReguaEmReal(arquivo: string, caminho: string): boolean {
  return (CAMINHOS_EM_REAL[arquivo] ?? []).some((prefixo) => caminho === prefixo || caminho.startsWith(`${prefixo}.`) || caminho.startsWith(`${prefixo}[`));
}

/**
 * Texto sem quantia sai antes de ler o contexto: assim uma frase comum não vira
 * dependência da moeda, e quem monta o próprio contexto não entra em laço.
 */
export function naMoedaEscolhida(texto: string): string {
  if (!texto.includes('R$')) return texto;
  return converterTextoMonetario(texto, contextoDaMoeda.value);
}
