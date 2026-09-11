import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, statSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * O consolidador exporta `numeroCsv` e é importado por teste. Com o trabalho no
 * topo do módulo, importar regravaria `states.json` e `tax-data.json` — e o
 * segundo carrega apuração editorial feita à mão.
 */
describe('importar o consolidador nao pode escrever em disco', () => {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
  const destinos = [
    join(raiz, 'app', 'data', 'states.json'),
    join(raiz, 'app', 'data', 'tax-data.json'),
  ];

  it('importa a funcao sem tocar nos arquivos de dados', () => {
    const antes = destinos.map((caminho) => statSync(caminho).mtimeMs);

    // Processo separado de propósito: dentro da suíte o módulo já está no
    // cache, e um teste que reaproveita o cache passaria mesmo sem o guarda.
    execFileSync(
      process.execPath,
      ['--input-type=module', '-e', "await import('./scripts/coleta/consolidar.mjs');"],
      { cwd: raiz, stdio: 'pipe' },
    );

    const depois = destinos.map((caminho) => statSync(caminho).mtimeMs);
    for (const [i, caminho] of destinos.entries()) {
      expect(depois[i], `${caminho} foi regravado so por ter sido importado`).toBe(antes[i]);
    }
  });

  // `data-bruto/` fica fora do repositório: sem o CSV da Receita, o consolidador
  // sai com código 1 antes de provar o link, e o runner do GitHub não o tem.
  const temDadoBruto = existsSync(join(raiz, 'data-bruto', 'receita-serie-historica.csv'));

  it.skipIf(!temDadoBruto)('ainda roda quando chamado por um link simbolico', () => {
    // `import.meta.url` chega com os links resolvidos e `process.argv[1]` não.
    // Um guarda que compara os dois crus recusa a invocação e sai calado.
    const pasta = mkdtempSync(join(tmpdir(), 'impostossauro-'));
    const link = join(pasta, 'consolidar.mjs');
    symlinkSync(join(raiz, 'scripts', 'coleta', 'consolidar.mjs'), link);

    const saida = execFileSync(process.execPath, [link], { cwd: raiz, encoding: 'utf8' });

    expect(saida, 'o guarda recusou a chamada por link e nao rodou nada').toContain('Escrito em');
  });
});
