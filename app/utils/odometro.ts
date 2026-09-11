/**
 * O odômetro nunca escreve o número: fatia a saída do `formatDinheiro`, e o `Intl`
 * decide separador e espaço (U+00A0 em português). Toda conta passa por centavos
 * inteiros: `8.29 * 100` dá `828.999…`, e um piso ingênuo mostraria 8 onde há 9.
 */

export type Peca =
  | { tipo: 'digito'; casa: number }
  | { tipo: 'texto'; texto: string };

/** Quantas casas decimais o `formatDinheiro` sempre escreve. */
const CASAS_DECIMAIS = 2;

/**
 * Teto da fração do ciclo que a roda passa virando: nas casas rápidas a virada
 * encurta em vez de a roda deixar de girar.
 */
const MAXIMO_VIRANDO = 0.25;

/** Abaixo de dois quadros a virada é meio dígito piscando; essas casas saltam. */
const SEGUNDOS_MINIMOS_DE_VIRADA = 2 / 60;

/**
 * Tempo de relógio, não fração do ciclo: o ciclo da casa dos trilhões é de 89
 * dias, e uma fração fixa deixaria o algarismo pela metade por semanas.
 */
const SEGUNDOS_DE_VIRADA = 0.4;

const VIRADA_PARADO = 0.15;

const EH_DIGITO = /\d/;

/** A casa de cada dígito sai da posição a partir da direita, nunca do separador, que muda por idioma. */
export function pecasDoNumero(formatado: string, casasDecimais = CASAS_DECIMAIS): Peca[] {
  const caracteres = [...formatado];
  const totalDigitos = caracteres.filter((c) => EH_DIGITO.test(c)).length;

  const pecas: Peca[] = [];
  let vistos = 0;

  for (const caractere of caracteres) {
    if (EH_DIGITO.test(caractere)) {
      pecas.push({ tipo: 'digito', casa: totalDigitos - 1 - vistos - casasDecimais });
      vistos += 1;
      continue;
    }
    const ultima = pecas.at(-1);
    if (ultima?.tipo === 'texto') ultima.texto += caractere;
    else pecas.push({ tipo: 'texto', texto: caractere });
  }

  return pecas;
}

/** Em [0, 10): inteiro é o dígito, fração é o quanto já andou. Não é onde a roda fica. */
function avancoDaCasa(valor: number, casa: number): number {
  const centavos = Math.round(Math.abs(valor) * 100);
  return (centavos / 10 ** (casa + CASAS_DECIMAIS)) % 10;
}

export function fracaoDaVirada(porSegundo: number, casa: number): number {
  if (!porSegundo) return VIRADA_PARADO;
  const ciclo = 10 ** casa / Math.abs(porSegundo);
  return Math.min(MAXIMO_VIRANDO, SEGUNDOS_DE_VIRADA / ciclo);
}

function segundosDeVirada(porSegundo: number, casa: number): number {
  if (!porSegundo) return SEGUNDOS_DE_VIRADA;
  const ciclo = 10 ** casa / Math.abs(porSegundo);
  return fracaoDaVirada(porSegundo, casa) * ciclo;
}

export function posicaoDaCasa(valor: number, casa: number, porSegundo = 0): number {
  const avanco = avancoDaCasa(valor, casa);
  const digito = Math.floor(avanco);
  const fracao = avanco - digito;
  const virada = fracaoDaVirada(porSegundo, casa);
  const virando = fracao <= 1 - virada ? 0 : (fracao - (1 - virada)) / virada;
  return digito + virando;
}

export function digitoDaCasa(valor: number, casa: number): number {
  return Math.floor(avancoDaCasa(valor, casa));
}

/** `porSegundo` zero é número parado (muda quando alguém digita): aí tudo gira. */
export function casaGira(porSegundo: number, casa: number, minimo = SEGUNDOS_MINIMOS_DE_VIRADA): boolean {
  return segundosDeVirada(porSegundo, casa) >= minimo;
}
