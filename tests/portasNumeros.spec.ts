import { describe, expect, it } from 'vitest';
import fallacies from '../app/data/fallacies.json';
import promises from '../app/data/promises.json';
import states from '../app/data/states.json';
import taxData from '../app/data/tax-data.json';
import { navEntries } from '../app/utils/navegacao';
import { numerosDasPortas, partesDoNumero } from '../app/utils/portas';
import en from '../i18n/locales/en.json';
import ptBR from '../i18n/locales/pt-BR.json';

/**
 * Nenhum número nem palavra da home nasce nela: `numerosDasPortas` devolve só
 * valores, que `doors.numbers.*` interpola no idioma da rota, e cada valor sai
 * do JSON que a página correspondente consome.
 */
const portas = numerosDasPortas('pt-BR');

describe('portas — nenhum numero nasce na home', () => {
  it('cada valor vem do JSON da propria pagina', () => {
    expect(portas.calculator.days).toBe(taxData.workDays.days);
    expect(portas.fallacies.trillions).toBe(fallacies.fortyTrillion.totalTrillions);
    expect(portas.fallacies.years).toBe(fallacies.fortyTrillion.periodYears);
    expect(portas.publicMachine.years).toBe(states.fiscalYears.length);
    expect(portas.publicMachine.states).toBe(Object.keys(states.states).length);
    expect(portas.promises.count).toBe(promises.cases.length);
    expect(portas.inflation.year).toBe(taxData.federalRevenueSeries.at(-1)!.year);
  });

  it('o valor em trilhoes da inflacao vem do total em bilhoes do ultimo ano, dividido por mil', () => {
    const ultimaFederal = taxData.federalRevenueSeries.at(-1)!;
    const trilhoesEsperado = Number((ultimaFederal.totalBillions / 1000).toFixed(2));
    const trilhoesRecebido = Number(String(portas.inflation.trillions).replace(',', '.'));
    expect(trilhoesRecebido).toBeCloseTo(trilhoesEsperado, 2);
  });

  it('nenhuma porta aponta para pagina inexistente', () => {
    const existentes = navEntries.map((e) => e.key);
    for (const chave of Object.keys(portas)) {
      expect(existentes, `a porta "${chave}" nao corresponde a pagina nenhuma`).toContain(chave);
    }
  });

  it('porta sem numero conferido fica sem numero, e isso e permitido', () => {
    const semNumero = navEntries.filter((e) => !(e.key in portas));
    expect(
      semNumero.length,
      'se toda pagina ganhou numero, confira se algum foi inventado para a ocasiao',
    ).toBeGreaterThan(0);
  });

  it('toda chave usada em doors.numbers existe nos dois idiomas', () => {
    for (const chave of Object.keys(portas)) {
      expect(ptBR.doors.numbers, `falta doors.numbers.${chave} em pt-BR`).toHaveProperty(chave);
      expect(en.doors.numbers, `falta doors.numbers.${chave} em en`).toHaveProperty(chave);
    }
  });
});

function interpolar(modelo: string, valores: Record<string, string | number>): string {
  return modelo.replace(/\{(\w+)\}/g, (_, chave) => String(valores[chave]));
}

type Chave = 'calculator' | 'inflation' | 'publicMachine' | 'promises';
const paginasComMonumento: Chave[] = ['calculator', 'inflation', 'publicMachine', 'promises'];

/**
 * O trilhao vem de `numerosDasPortas`, nao de literal: ele muda a cada
 * atualizacao da fonte, e o que se confere aqui e o corte, nao o valor.
 */
const trilhoesPt = numerosDasPortas('pt-BR').inflation.trillions;
const trilhoesEn = numerosDasPortas('en').inflation.trillions;

const esperadoPt: Record<Chave, { numero: string; legenda: string }> = {
  calculator: { numero: '149 dias', legenda: 'por ano, na média nacional' },
  inflation: { numero: `R$ ${trilhoesPt} tri`, legenda: 'de arrecadação federal em 2025' },
  publicMachine: { numero: '8 anos', legenda: '27 estados' },
  promises: { numero: '4 casos', legenda: '' },
};

const esperadoEn: Record<Chave, { numero: string; legenda: string }> = {
  calculator: { numero: '149 days', legenda: 'a year, national average' },
  inflation: { numero: `R$ ${trilhoesEn} trillion`, legenda: 'in federal revenue in 2025' },
  publicMachine: { numero: '8 years', legenda: '27 states' },
  promises: { numero: '4 cases', legenda: '' },
};

describe('partesDoNumero — o monumento nao pode virar numero falso nem numero vazio', () => {
  it('pt-BR: a palavra que desambigua a escala entra no monumento junto com o numero', () => {
    const valores = numerosDasPortas('pt-BR');
    for (const chave of paginasComMonumento) {
      const frase = interpolar(ptBR.doors.numbers[chave], valores[chave]);
      expect(partesDoNumero(frase), `chave "${chave}", frase "${frase}"`).toEqual(esperadoPt[chave]);
    }
  });

  it('en: o mesmo corte nao quebra na rota em ingles', () => {
    const valores = numerosDasPortas('en');
    for (const chave of paginasComMonumento) {
      const frase = interpolar(en.doors.numbers[chave], valores[chave]);
      expect(partesDoNumero(frase), `chave "${chave}", frase "${frase}"`).toEqual(esperadoEn[chave]);
    }
  });
});
