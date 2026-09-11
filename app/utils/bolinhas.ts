/**
 * O `Ballpit` (three + gsap, 186 KB, física a cada quadro) trava em celular.
 * Entra por `defineAsyncComponent`: quem não passa aqui nem baixa o bundle.
 */
export const LARGURA_MINIMA_BOLINHAS = 1024;

export type CondicoesDoAparelho = {
  semMovimento: boolean;
  /** `(pointer: coarse)` — dedo, não cursor. As bolinhas seguem o cursor. */
  ponteiroGrosso: boolean;
  largura: number;
  temWebGL2: boolean;
};

/** Toque ou tela estreita: sem efeito que custe por quadro (bolinhas, vidro de filtro SVG). */
export function aparelhoDeToque(c: Pick<CondicoesDoAparelho, 'ponteiroGrosso' | 'largura'>): boolean {
  return c.ponteiroGrosso || c.largura < LARGURA_MINIMA_BOLINHAS;
}

export function podeMostrarBolinhas(c: CondicoesDoAparelho): boolean {
  if (c.semMovimento) return false;
  if (aparelhoDeToque(c)) return false;
  return c.temWebGL2;
}
