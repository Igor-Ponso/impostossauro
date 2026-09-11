import { prefixoDaMoeda, type EscalasDeGrandeza, type Moeda } from './taxMath';

/**
 * Boa parte do dinheiro do site é texto pronto no JSON ("R$ 8,3 bilhões"), não
 * número. Converter só o que passa pelos formatadores deixaria metade da tela em
 * real. Este módulo reescreve a quantia dentro da frase, preservando a escala de
 * grandeza do texto original.
 */
export interface ContextoDeMoeda {
  moeda: Moeda;
  /** Reais por dólar. */
  taxa: number;
  idioma: string;
  escalas: EscalasDeGrandeza;
}

interface Escala {
  fator: number;
  chave: keyof EscalasDeGrandeza;
  casas: number;
}

const ESCALAS: Escala[] = [
  { fator: 1e12, chave: 'trillions', casas: 2 },
  { fator: 1e9, chave: 'billions', casas: 1 },
  { fator: 1e6, chave: 'millions', casas: 1 },
];

/** Da forma mais longa para a mais curta: `milhões` tem de casar antes de `mi`. */
const TOKENS: { termo: string; fator: number }[] = [
  { termo: 'trilhões', fator: 1e12 }, { termo: 'trilhão', fator: 1e12 }, { termo: 'trillion', fator: 1e12 },
  { termo: 'bilhões', fator: 1e9 }, { termo: 'bilhão', fator: 1e9 }, { termo: 'billion', fator: 1e9 },
  { termo: 'milhões', fator: 1e6 }, { termo: 'milhão', fator: 1e6 }, { termo: 'million', fator: 1e6 },
  { termo: 'mil', fator: 1e3 }, { termo: 'thousand', fator: 1e3 },
  { termo: 'tri', fator: 1e12 }, { termo: 'bi', fator: 1e9 }, { termo: 'bn', fator: 1e9 },
  { termo: 'mi', fator: 1e6 }, { termo: 'mn', fator: 1e6 },
];

const ALTERNATIVAS = TOKENS.map((t) => t.termo).join('|');
const QUANTIA = new RegExp(`R\\$\\s?(\\d[\\d.,]*\\d|\\d)(\\s*(?:${ALTERNATIVAS})\\b\\.?)?`, 'gi');

/** Ponto separa milhar em português e decimal em inglês; a régua vem do idioma. */
function lerNumero(bruto: string, idioma: string): number {
  const limpo = idioma.startsWith('en')
    ? bruto.replace(/,/g, '')
    : bruto.replace(/\./g, '').replace(',', '.');
  return Number(limpo);
}

function fatorDoToken(token: string | undefined): number {
  if (!token) return 1;
  const alvo = token.trim().replace(/\.$/, '').toLowerCase();
  return TOKENS.find((t) => t.termo === alvo)?.fator ?? 1;
}

export function converterTextoMonetario(texto: string, ctx: ContextoDeMoeda): string {
  if (ctx.moeda === 'BRL' || !(ctx.taxa > 0) || !texto.includes('R$')) return texto;
  const prefixo = prefixoDaMoeda(ctx.idioma, ctx.moeda);

  return texto.replace(QUANTIA, (inteiro, numero: string, token: string | undefined) => {
    const lido = lerNumero(numero, ctx.idioma);
    if (!Number.isFinite(lido)) return inteiro;

    const fator = fatorDoToken(token);
    const valor = (lido * fator) / ctx.taxa;
    const escala = token ? ESCALAS.find((e) => Math.abs(valor) >= e.fator) : undefined;

    if (!escala) {
      // Sem escala: mantém a presença de decimais que a frase original tinha.
      const casas = /[.,]\d{1,2}$/.test(numero) ? 2 : 0;
      return prefixo + valor.toLocaleString(ctx.idioma, { minimumFractionDigits: casas, maximumFractionDigits: casas });
    }

    const numeroEscalado = (valor / escala.fator).toLocaleString(ctx.idioma, { maximumFractionDigits: escala.casas });
    // Se a grandeza não mudou, a palavra do autor volta como estava ("bi" segue "bi").
    const palavra = fator === escala.fator ? token!.trim() : ctx.escalas[escala.chave];
    return `${prefixo}${numeroEscalado} ${palavra}`;
  });
}

/** Quantas quantias em real existem no texto; usado por teste e por diagnóstico. */
export function quantiasEmReal(texto: string): string[] {
  return texto.match(QUANTIA) ?? [];
}
