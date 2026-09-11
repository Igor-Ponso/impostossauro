import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Emoji não entra no site como recurso visual. A varredura cobre `app/` e
 * `i18n/` inteiros; um emoji novo em qualquer arquivo quebra a suíte.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASTAS = ['app', 'i18n'];
const EXTENSOES = /\.(vue|ts|json|css)$/;
const EMOJI = /\p{Extended_Pictographic}/u;

function arquivos(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) return arquivos(caminho);
    return EXTENSOES.test(entrada.name) ? [caminho] : [];
  });
}

const todos = PASTAS.flatMap((pasta) => arquivos(join(raiz, pasta)));

describe('regra 6 — nenhum emoji no site', () => {
  it('encontra arquivos para varrer', () => {
    expect(todos.length).toBeGreaterThan(30);
  });

  it.each(todos.map((caminho) => [relative(raiz, caminho), caminho]))('%s', (_nome, caminho) => {
    const texto = readFileSync(caminho, 'utf-8');
    const achados = [...texto].filter((c) => EMOJI.test(c));
    expect(
      [...new Set(achados)].join(' '),
      `emoji encontrado: ${[...new Set(achados)].join(' ')}`,
    ).toBe('');
  });
});
