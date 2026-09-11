export interface Indicador {
  id: string;
  fonte: string;
  valores: Record<string, number>;
  /** País cuja fonte difere de `fonte`; presente, torna o indicador incomparável. */
  fontePorPais?: Record<string, string>;
}

export interface IndicadorMundo extends Indicador {
  codigo: string;
  rotulo: string;
  unidade: string;
  ordem: 'maiorMelhor' | 'menorMelhor';
  url: string;
  /** Nem todos os países medem no mesmo ano. */
  anos: Record<string, number>;
  /** Países sem o dado na fonte; declarados na tela, nunca omitidos. */
  faltando: string[];
  paisesComparados: string[];
  escala: [number, number];
  /** 'resultado' tem placar; 'insumo' e 'contexto' nunca. */
  tipo: 'resultado' | 'insumo' | 'contexto';
  rotuloCurto: string;
  /** Só os de resultado têm. */
  movimento: string;
  rotuloCurtoEn: string;
  movimentoEn?: string;
}

/** A partir de 1; 0 quando não há posição (lista vazia ou valor ausente). */
export function posicaoNoRanking(
  valor: number,
  valores: number[],
  ordem: 'maiorMelhor' | 'menorMelhor',
): number {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => (ordem === 'maiorMelhor' ? b - a : a - b));
  return ordenados.indexOf(valor) + 1;
}

/**
 * Fonte mista compara coisas diferentes: a carga do Banco Mundial para o Brasil
 * dá 15,4% do PIB (sem estados e municípios), a do Tesouro dá 32,3%. E
 * `Number.isFinite`, não `typeof`: o Banco Mundial devolve `null` no ano sem dado.
 */
export function comparaveis(indicadores: Indicador[], paises: string[]): Indicador[] {
  return indicadores.filter((ind) => {
    const cobreTodos = paises.every((p) => Number.isFinite(ind.valores[p]));
    const fonteUnica = !ind.fontePorPais || Object.keys(ind.fontePorPais).length === 0;
    return cobreTodos && fonteUnica;
  });
}

export interface PaisMundo {
  iso: string;
  nome: string;
  carga: number;
  idh: number;
  irbes: number;
  posicao: number;
}

export interface Movimento {
  id: string;
  movimento: string;
  /** Quantas vezes o adversário é melhor neste índice. */
  razao: number;
}

/** Um só slug para os dois idiomas, do nome em português: link compartilhado não quebra. */
export function slugDoPais(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}

export function paisPorSlug(slug: string, paises: PaisMundo[]): PaisMundo | null {
  return paises.find((p) => slugDoPais(p.nome) === slug) ?? null;
}

export function brasilVence(ind: IndicadorMundo, oponente: PaisMundo): boolean | null {
  const a = ind.valores.BRA;
  const b = ind.valores[oponente.iso];
  if (typeof a !== 'number' || typeof b !== 'number') return null;
  return ind.ordem === 'maiorMelhor' ? a > b : a < b;
}

/**
 * Escala declarada no dado, não o mín/máx do grupo: normalizar pelo grupo daria
 * barra zero ao Brasil na esperança de vida, onde ele é o mínimo.
 */
export function fracaoNaEscala(valor: number, ind: IndicadorMundo): number {
  const [min, max] = ind.escala;
  const bruta = (valor - min) / (max - min);
  const fracao = ind.ordem === 'maiorMelhor' ? bruta : 1 - bruta;
  return Math.max(0, Math.min(100, fracao * 100));
}

export function movimentoDe(oponente: PaisMundo, indicadores: IndicadorMundo[]): Movimento | null {
  let melhor: Movimento | null = null;
  for (const ind of indicadores) {
    const a = ind.valores.BRA;
    const b = ind.valores[oponente.iso];
    if (typeof a !== 'number' || typeof b !== 'number') continue;
    if (brasilVence(ind, oponente)) continue;
    const razao = ind.ordem === 'maiorMelhor' ? b / a : a / b;
    if (!Number.isFinite(razao)) continue;
    if (!melhor || razao > melhor.razao) {
      melhor = { id: ind.id, movimento: ind.movimento, razao };
    }
  }
  return melhor;
}

/** Sem texto: a redação fica no i18n. */
export function vereditoDe(brasil: PaisMundo, oponente: PaisMundo, vida: IndicadorMundo) {
  const difCarga = +(oponente.carga - brasil.carga).toFixed(2);
  const a = vida.valores.BRA;
  const b = vida.valores[oponente.iso];
  return {
    difCarga,
    cobraMenos: difCarga < 0,
    anosAMais: typeof a === 'number' && typeof b === 'number' ? +(b - a).toFixed(1) : null,
  };
}

export function rotuloNoIdioma(ind: IndicadorMundo, locale: string): string {
  return locale.startsWith('en') ? ind.rotuloCurtoEn : ind.rotuloCurto;
}

export function movimentoNoIdioma(ind: IndicadorMundo, locale: string): string {
  return locale.startsWith('en') && ind.movimentoEn ? ind.movimentoEn : ind.movimento;
}
