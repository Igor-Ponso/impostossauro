import type { RouterConfig } from '@nuxt/schema';

/**
 * O padrão do Nuxt é `savedPosition || { top: 0 }`: toda navegação que não seja
 * voltar/avançar joga o leitor para o topo. Trocar de idioma É uma navegação
 * (`/pagina` → `/en/pagina`), então quem estava lendo perdia a posição —
 * medido em navegador real: 4.007 px na /economia-101 e 1.508 px no /manifesto.
 *
 * Mesma família do bug da troca de moeda, e a regra é a mesma: nunca tirar o
 * leitor de onde ele estava por causa de uma troca que não muda o assunto.
 */

/** `prefix_except_default`: só o inglês leva prefixo na URL. */
export function idiomaDaRota(caminho: string): 'en' | 'pt-BR' {
  return /^\/en(?:\/|$)/.test(caminho) ? 'en' : 'pt-BR';
}

/** `@nuxtjs/i18n` nomeia a rota como `<pagina>___<idioma>` (routesNameSeparator). */
export function paginaDaRota(nome: unknown): string {
  return typeof nome === 'string' ? nome.replace(/___[\w-]+$/, '') : '';
}

/** Rede de segurança quando a rota não tem nome: compara o caminho sem prefixo. */
export function caminhoSemIdioma(caminho: string): string {
  return caminho.replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '') || '/';
}

/** É a mesma página, só que no outro idioma? */
export function ehTrocaDeIdioma(
  para: { path: string; name?: unknown },
  de: { path: string; name?: unknown },
): boolean {
  if (idiomaDaRota(para.path) === idiomaDaRota(de.path)) return false;
  const pagina = paginaDaRota(para.name);
  if (pagina && pagina === paginaDaRota(de.name)) return true;
  return caminhoSemIdioma(para.path) === caminhoSemIdioma(de.path);
}

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    // Âncora continua funcionando; o respiro vem do `scroll-mt-*` no CSS.
    if (to.hash) return { el: to.hash };
    if (ehTrocaDeIdioma(to, from)) return false;
    return { top: 0 };
  },
};
