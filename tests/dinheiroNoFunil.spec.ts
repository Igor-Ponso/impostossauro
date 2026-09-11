import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ARQUIVOS_TRADUZIDOS } from '../app/utils/dadoNoIdioma';
import { CAMINHOS_EM_REAL, CHAVES_EM_REAL } from '../app/utils/estadoDaMoeda';
import { quantiasEmReal } from '../app/utils/moedaNoTexto';
import ptBR from '../i18n/locales/pt-BR.json';

/**
 * A conversão para dólar acontece em dois funis — o `postTranslation` do i18n e o
 * proxy de `dadoNoIdioma` — mais o prefixo reativo nas telas. Quem escrever "R$"
 * à mão num componente sai dos três e volta a publicar metade da tela em real.
 * Este arquivo existe para essa metade nunca mais passar.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Onde o "R$" é o assunto, não um valor a converter. */
const TELAS_EM_REAL = new Set([
  // O botão que escolhe a moeda.
  'app/components/MoedaToggle.vue',
  // Régua "quanto volta a cada R$ 100": razão, e razão não muda de moeda.
  'app/components/BrazilMap.vue',
  // A nota de R$ 100 perdendo poder de compra: base didática, não medida.
  'app/components/PoderDeCompra.vue',
  // Preço de item na moeda em que a fonte publicou (US$, €).
  'app/components/OQueDavaParaComprar.vue',
  // "R$ 1 de 1994 = X réis": equivalência histórica entre moedas.
  'app/pages/inflacao.vue',
  // "R$ 1.000 em {ano} compravam": mesma base didática do i18n.
  'app/pages/maquina-do-tempo.vue',
]);

function telas(pasta: string): string[] {
  return readdirSync(join(raiz, pasta), { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) return telas(caminho);
    return entrada.name.endsWith('.vue') ? [caminho] : [];
  });
}

/** Comentário citando "R$" explica o formato; não é valor na tela. */
function semComentarios(fonte: string): string {
  return fonte
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('nenhuma tela escreve R$ por fora do funil', () => {
  const arquivos = [...telas('app/pages'), ...telas('app/components')];

  it('encontra as telas do site', () => {
    expect(arquivos.length).toBeGreaterThan(40);
  });

  it.each(arquivos.map((c) => [c, c]))('%s', (_nome, caminho) => {
    if (TELAS_EM_REAL.has(caminho)) return;
    const fonte = semComentarios(readFileSync(join(raiz, caminho), 'utf-8'));
    expect(quantiasEmReal(fonte), `${caminho} escreve R$ à mão: use \`prefixo\` do useMoeda()`).toEqual([]);
    expect(fonte.includes('R$'), `${caminho} escreve R$ à mão: use \`prefixo\` do useMoeda()`).toBe(false);
  });

  it('a lista de exceção só tem arquivo que existe e ainda usa R$', () => {
    for (const caminho of TELAS_EM_REAL) {
      expect(arquivos, `${caminho} saiu da lista de telas`).toContain(caminho);
      expect(readFileSync(join(raiz, caminho), 'utf-8'), `${caminho} não usa mais R$`).toContain('R$');
    }
  });
});

describe('todo dado com dinheiro passa pelo funil', () => {
  const pastaDados = join(raiz, 'app', 'data');
  const arquivos = readdirSync(pastaDados).filter((nome) => nome.endsWith('.json') && nome !== 'arquivos.json');

  it('arquivo de dado com quantia em real está registrado em dadoNoIdioma', () => {
    const fora = arquivos.filter((nome) => quantiasEmReal(readFileSync(join(pastaDados, nome), 'utf8')).length
      && !ARQUIVOS_TRADUZIDOS.includes(nome));
    expect(fora, 'registre em dadoNoIdioma ou use dadoNaMoeda').toEqual(['payroll-2026.json']);
  });
});

describe('a lista de chaves que ficam em real é auditável', () => {
  it('toda chave existe no i18n e realmente tem quantia', () => {
    for (const chave of CHAVES_EM_REAL) {
      const valor = chave.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)?.[p], ptBR as unknown);
      expect(typeof valor, `${chave} não existe no pt-BR.json`).toBe('string');
      expect(quantiasEmReal(valor as string).length, `${chave} não tem quantia em real`).toBeGreaterThan(0);
    }
  });

  it('todo caminho de dado que fica em real aponta para arquivo do funil', () => {
    for (const arquivo of Object.keys(CAMINHOS_EM_REAL)) {
      expect(ARQUIVOS_TRADUZIDOS).toContain(arquivo);
    }
  });
});

/**
 * O mesmo vale para módulo TypeScript que monta texto: `secoesCompletas.ts` escapou
 * do funil por aqui, escrevendo "R$" num template literal.
 */
describe('nenhum módulo monta R$ sem passar pelo conversor', () => {
  const modulos = ['app/utils', 'app/composables'].flatMap((pasta) => readdirSync(join(raiz, pasta))
    .filter((nome) => nome.endsWith('.ts'))
    .map((nome) => join(pasta, nome)));

  /** Estes dois SÃO o conversor: falam de "R$" porque é o que eles reconhecem. */
  const DONOS_DO_ASSUNTO = new Set(['app/utils/moedaNoTexto.ts', 'app/utils/estadoDaMoeda.ts']);

  it.each(modulos.map((c) => [c, c]))('%s', (_nome, caminho) => {
    if (DONOS_DO_ASSUNTO.has(caminho)) return;
    const linhas = semComentarios(readFileSync(join(raiz, caminho), 'utf-8')).split('\n');
    const soltas = linhas.filter((linha) => linha.includes('R$') && !linha.includes('naMoedaEscolhida'));
    expect(soltas, `${caminho} monta R$ sem naMoedaEscolhida`).toEqual([]);
  });
});
