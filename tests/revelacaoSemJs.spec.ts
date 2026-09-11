import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * O `.reveal` só pode esconder conteúdo dentro de `html.js`: com `opacity: 0`
 * no padrão, o HTML estático nasce invisível para quem chega sem JavaScript,
 * com JS lento ou como buscador.
 */
const css = readFileSync('app/assets/css/main.css', 'utf-8');
const config = readFileSync('nuxt.config.ts', 'utf-8');

describe('revelacao nao esconde conteudo de quem esta sem JavaScript', () => {
  it('o padrao do .reveal e visivel', () => {
    const bloco = css.slice(css.indexOf('\n.reveal {'), css.indexOf('html.js .reveal {'));
    expect(bloco).toContain('opacity: 1');
    expect(bloco).not.toContain('opacity: 0');
  });

  it('quem esconde e a regra dentro de html.js', () => {
    expect(css).toContain('html.js .reveal {');
    const comJs = css.slice(css.indexOf('html.js .reveal {'), css.indexOf('html.js .reveal.in'));
    expect(comJs).toContain('opacity: 0');
  });

  it('a classe js e posta antes da primeira pintura', () => {
    expect(config).toContain("document.documentElement.classList.add('js')");
    expect(config).toContain("tagPosition: 'head'");
  });

  /** Sem isto, a regra de dentro de `html.js` venceria a de movimento reduzido. */
  it('movimento reduzido continua vencendo', () => {
    const reduzido = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduzido).toContain('html.js .reveal');
  });
});
