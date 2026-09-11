import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { navEntries, navGroups, paginasLegais } from '../app/utils/navegacao';
import en from '../i18n/locales/en.json';
import pt from '../i18n/locales/pt-BR.json';

/**
 * `navGroups` é a tabela única dos grupos, para o header e para a home:
 * duplicá-la é como o site passa a se contradizer.
 */
describe('navegacao — os grupos cobrem o site exatamente uma vez', () => {
  const nosGrupos = navGroups.flatMap((g) => g.items);

  it('toda pagina aparece em algum grupo', () => {
    for (const entrada of navEntries) {
      expect(nosGrupos, `a pagina "${entrada.key}" nao esta em grupo nenhum`).toContain(entrada.key);
    }
  });

  it('nenhuma pagina aparece duas vezes', () => {
    expect(nosGrupos.length).toBe(new Set(nosGrupos).size);
    expect(nosGrupos.length).toBe(navEntries.length);
  });

  it('nenhum grupo aponta para pagina que nao existe', () => {
    const existentes = new Set(navEntries.map((e) => e.key));
    for (const chave of nosGrupos) {
      expect(existentes, `o grupo aponta para "${chave}", que nao esta em navEntries`).toContain(chave);
    }
  });
});

/** Privacidade e termos ficam fora dos grupos (não são denúncia), mas o painel e o rodapé listam as duas. */
describe('navegacao — paginas legais', () => {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

  it('cada pagina legal existe em app/pages e tem rotulo nos dois idiomas', () => {
    expect(paginasLegais.length).toBeGreaterThanOrEqual(2);
    for (const pagina of paginasLegais) {
      expect(existsSync(join(raiz, 'app', 'pages', `${pagina.path.slice(1)}.vue`)), `falta a pagina ${pagina.path}`).toBe(true);
      expect((pt.footer as Record<string, string>)[pagina.key], `falta footer.${pagina.key} em pt-BR`).toBeTruthy();
      expect((en.footer as Record<string, string>)[pagina.key], `falta footer.${pagina.key} em en`).toBeTruthy();
    }
  });

  it('nenhuma pagina legal entra nos grupos nem nas secoes da home', () => {
    const chaves = new Set(navEntries.map((e) => e.key));
    for (const pagina of paginasLegais) expect(chaves).not.toContain(pagina.key);
  });
});
