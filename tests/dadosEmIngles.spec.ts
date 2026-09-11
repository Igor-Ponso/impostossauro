import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ARQUIVOS_TRADUZIDOS, dadoNoIdioma } from '../app/utils/dadoNoIdioma';

/**
 * As traduções vivem em `app/data/en/<arquivo>.json`, num mapa plano de
 * caminho → texto. Um caminho que envelhece some da tela sem quebrar nada; por
 * isso `dadoNoIdioma` lança em caminho inexistente, e este arquivo exercita todos.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const pt = (arquivo: string) => JSON.parse(readFileSync(join(raiz, 'app', 'data', arquivo), 'utf-8'));

describe('dadoNoIdioma', () => {
  it('registra um arquivo para cada traducao em app/data/en', () => {
    const emDisco = readdirSync(join(raiz, 'app', 'data', 'en')).filter((n) => n.endsWith('.json'));
    expect([...ARQUIVOS_TRADUZIDOS].sort()).toEqual(emDisco.sort());
  });

  /**
   * Em português o funil não copia: devolve uma vista do próprio objeto, que a
   * troca de moeda lê no acesso. Mudança no dado atravessa a vista na hora.
   */
  it('em portugues nao copia o dado, so o enxerga', () => {
    const dado = pt('journey.json') as { updatedAt: string };
    const vista = dadoNoIdioma('journey.json', dado, 'pt-BR');
    expect(vista).toEqual(dado);
    dado.updatedAt = '1999-01-01';
    expect(vista.updatedAt).toBe('1999-01-01');
  });

  it.each(ARQUIVOS_TRADUZIDOS)('%s: todo caminho traduzido existe no dado', (arquivo) => {
    expect(() => dadoNoIdioma(arquivo, pt(arquivo), 'en')).not.toThrow();
  });

  it.each(ARQUIVOS_TRADUZIDOS)('%s: o ingles nao repete o portugues', (arquivo) => {
    const original = pt(arquivo);
    const traduzido = dadoNoIdioma(arquivo, original, 'en') as unknown;
    expect(JSON.stringify(traduzido)).not.toBe(JSON.stringify(original));
  });

  it('nao vaza a traducao para o objeto em portugues', () => {
    const original = pt('federative.json');
    const antes = JSON.stringify(original);
    dadoNoIdioma('federative.json', original, 'en');
    expect(JSON.stringify(original)).toBe(antes);
  });
});

/**
 * Prosa sem tradução publica português na rota `/en/`. Só prova (fala, texto
 * de lei) e nome próprio ficam de fora.
 */
describe('inventario do que fica em portugues', () => {
  /**
   * Palavra funcional do português. Não depende de acento: "Cigarros: 71% de
   * imposto, 4 em cada 10 ilegais" não tem nenhum.
   */
  const PALAVRA_PT = /\b(de|da|do|das|dos|em|no|na|nos|nas|para|por|com|sem|que|uma|um|ao|é|são|foi|cada|mais|entre|sobre|não|quanto|quem|onde|desde)\b/i;
  const PALAVRA_EN = /\b(the|of|and|for|with|from|that|is|are|was|were|to|in|on|by|per|each|a year)\b/i;

  // prova (fala e texto de lei), nome de documento, nome próprio, identificador
  const NAO_TRADUZ = new RegExp(
    '(^|\\.)('
    + 'quote|text|context|excuse|speaker|role|legalText|deadlineText|legalArticle|id|fullName'
    + ')(\\.|\\[|$)'
    + '|(^|\\.)('
    + 'source|url|sentSource|receivedSource|sentUrl|receivedUrl|announcedSource|announcedUrl'
    + '|noteUrl|previousYearUrl|milestoneUrl|fullSeriesSource|taxCountSource|incomeBurdenSource'
    + '|ipcaSource|announced'
    + ')(\\.|\\[|$)'
    // nomes próprios: rótulo de fonte, autor, país, estado, pessoa, unidade da federação
    + '|sources\\[\\d+\\]\\.label$|\\.autores\\[|\\.nome$|\\.government$|\\.uf$'
    + '|(^|\\.)states\\.[A-Z]{2}\\.(name|region)$|companies\\[\\d+\\]\\.name$'
    + '|cases\\[\\d+\\]\\.government\\.label$|igpSource\\.label$'
    // rota da página corrigida: é caminho do site, não prosa
    + '|correcoes\\[\\d+\\]\\.pagina$'
    // `world.json` traduz estes dois por chave irma (`rotuloCurtoEn`, `movimentoEn`), lida por `mundo.ts`
    + '|indicadores\\[\\d+\\]\\.(rotuloCurto|movimento)$',
  );

  function prosaSemTraducao(arquivo: string): string[] {
    const original = pt(arquivo);
    const traduzido = dadoNoIdioma(arquivo, original, 'en') as Record<string, unknown>;
    const pendentes: string[] = [];
    const anda = (valorPt: unknown, valorEn: unknown, caminho: string) => {
      if (Array.isArray(valorPt)) {
        valorPt.forEach((item, i) => anda(item, (valorEn as unknown[])?.[i], `${caminho}[${i}]`));
      } else if (valorPt && typeof valorPt === 'object') {
        for (const [chave, item] of Object.entries(valorPt)) {
          anda(item, (valorEn as Record<string, unknown>)?.[chave], caminho ? `${caminho}.${chave}` : chave);
        }
      } else if (typeof valorPt === 'string' && valorPt.length > 8 && !valorPt.startsWith('http')) {
        if (!PALAVRA_PT.test(valorPt) || PALAVRA_EN.test(valorPt)) return;
        if (NAO_TRADUZ.test(caminho)) return;
        if (valorPt === valorEn) pendentes.push(caminho);
      }
    };
    anda(original, traduzido, '');
    return pendentes;
  }

  it.each(ARQUIVOS_TRADUZIDOS)('%s: nenhuma prosa nossa ficou em portugues', (arquivo) => {
    const pendentes = prosaSemTraducao(arquivo);
    expect(pendentes, `sem traducao em ${arquivo}: ${pendentes.join(', ')}`).toEqual([]);
  });
});
