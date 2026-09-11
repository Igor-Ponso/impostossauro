import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { formatBRL, formatBRLCompact, formatBRLInteger, formatCount } from '../app/utils/taxMath';

/**
 * O ponto é milhar em português e decimal em inglês: "R$ 31.058" é trinta e um
 * reais para o leitor de fora. A moeda continua o real; só a escrita muda, com
 * `pt-BR` de padrão. As palavras de escala são texto e vêm do i18n.
 */
const ESCALAS_EN = { trillions: 'trillion', billions: 'billion', millions: 'million' };

describe('formatadores respeitam o idioma da rota', () => {
  it('em ingles o milhar e virgula, nao ponto', () => {
    expect(formatBRLInteger(31058, 'en')).toContain('31,058');
    expect(formatBRLInteger(31058, 'en')).not.toContain('31.058');
  });

  it('em portugues nada muda', () => {
    expect(formatBRLInteger(31058, 'pt-BR')).toContain('31.058');
    expect(formatBRL(1234.5, 'pt-BR')).toContain('1.234,50');
  });

  it('o padrao continua sendo portugues', () => {
    expect(formatBRLInteger(31058)).toBe(formatBRLInteger(31058, 'pt-BR'));
    expect(formatCount(1234)).toBe(formatCount(1234, 'pt-BR'));
  });

  it('a contagem tambem troca de separador', () => {
    expect(formatCount(1234, 'en')).toBe('1,234');
    expect(formatCount(1234, 'pt-BR')).toBe('1.234');
  });

  it('a palavra de escala vem de fora, e nao fica em portugues no ingles', () => {
    const compacto = formatBRLCompact(3.2e12, 'en', ESCALAS_EN);
    expect(compacto).toContain('trillion');
    expect(compacto).not.toContain('trilhões');
    expect(compacto).toContain('3.2');
  });
});

/**
 * Chamar `formatBRLInteger(x)` sem idioma cai no padrão português e a rota em
 * inglês imprime o separador errado; `useMoeda()` é o único caminho amarrado ao idioma.
 */
describe('nenhuma tela usa o formatador sem amarrar o idioma', () => {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
  const FORMATADOR = /\bformat(Dinheiro|DinheiroInteiro|DinheiroCompacto|Count)\s*\(/;

  function arquivos(pasta: string): string[] {
    return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
      const caminho = join(pasta, entrada.name);
      if (entrada.isDirectory()) return arquivos(caminho);
      return entrada.name.endsWith('.vue') ? [caminho] : [];
    });
  }

  const telas = [join(raiz, 'app', 'pages'), join(raiz, 'app', 'components')]
    .flatMap(arquivos)
    .filter((caminho) => FORMATADOR.test(readFileSync(caminho, 'utf-8')));

  it('encontra as telas que formatam dinheiro', () => {
    expect(telas.length).toBeGreaterThan(5);
  });

  it.each(telas.map((c) => [relative(raiz, c), c]))('%s pega o formatador do useMoeda', (_nome, caminho) => {
    expect(readFileSync(caminho, 'utf-8')).toContain('useMoeda(');
  });
});
