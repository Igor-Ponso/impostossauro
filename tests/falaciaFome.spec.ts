import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en.json';
import pt from '../i18n/locales/pt-BR.json';
import fallacies from '../app/data/fallacies.json';
import taxData from '../app/data/tax-data.json';

/**
 * A razão sai do total anual, não do contador acumulado (diferem por ~50%). E
 * `wfpBrlBillions` é real de out/2022: a arrecadação entra deflacionada pelo IPCA
 * desde out/2022, nov e dez incluídos — que um filtro `year > 2022` deixa de fora.
 */
const anoBaseCambio = 2022;
const ipcaNovDez2022 = taxData.ipcaMonthsAfterOct2022.reduce((fator, mes) => fator * (1 + mes.pct / 100), 1);
const ipcaAcumulado = taxData.ipcaSeries
  .filter((item) => item.year > anoBaseCambio && item.year <= taxData.revenueSeries.at(-1)!.year)
  .reduce((fator, item) => fator * (1 + item.pct / 100), ipcaNovDez2022);

const receitaAnual = taxData.revenueSeries.at(-1)!.totalBillions;
const fome = fallacies.hunger44;
const razao = Math.round(receitaAnual / (fome.wfpBrlBillions * ipcaAcumulado));
const dias = Math.max(1, Math.round(((fome.wfpBrlBillions * ipcaAcumulado) / receitaAnual) * 365));

// Lê `falacias.vue` como texto: só assim um literal no lugar da fórmula é pego.
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const falaciasSrc = readFileSync(join(raiz, 'app', 'pages', 'falacias.vue'), 'utf-8');
const razaoFomeExpr = falaciasSrc.match(/const razaoFome = ([^;]+);/)?.[1] ?? '';
const diasFomeExpr = falaciasSrc.match(/const diasFome = ([^;]+);/)?.[1] ?? '';

describe('falacia do US$ 44 bi — a razao e derivada, nunca digitada', () => {
  it('usa o total anual, nao o acumulado do contador', () => {
    expect(
      receitaAnual,
      'revenueSeries.at(-1) precisa ser o total do ano fechado. Se cair abaixo '
        + 'de R$ 3 tri, provavelmente virou acumulado parcial e a razao mente.',
    ).toBeGreaterThan(3000);
    expect(razao).toBeGreaterThan(100);
  });

  it('a razao e os dias contam a mesma historia', () => {
    expect(Math.abs(Math.round(365 / razao) - dias)).toBeLessThanOrEqual(1);
  });

  it('trava o valor publicado (nao so a formula) — a mesma regua do IPCA que o site usa', () => {
    // Trocar a base do deflator (out/2022 → dez/2022, ou tirar nov/dez) muda o
    // numero sem literal nenhum no codigo — por isso o valor fica travado, nao so a formula.
    expect(razao, 'razaoFome publicado e 101x — se mudou, confira a regua do IPCA antes de atualizar este numero.').toBe(101);
    expect(dias, 'diasFome publicado e 4 — se mudou, confira a regua do IPCA antes de atualizar este numero.').toBe(4);
  });

  it('nenhum idioma crava a razao dentro da string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- os dois JSON tem formatos distintos, o teste so acessa chaves comuns
    for (const [nome, l] of Object.entries({ 'pt-BR': pt, en } as Record<string, any>)) {
      const punch: string = l.fallacies.hunger44.punch;
      expect(punch, `${nome}: fallacies.hunger44.punch precisa interpolar {times}`).toContain('{times}');
      expect(
        /\b\d{2,}\b/.test(punch.replace('{times}', '')),
        `${nome}: ha numero de dois digitos ou mais cravado na string. Toda razao `
          + 'deste site e calculada a partir do JSON — foi um numero digitado que '
          + 'colocou "81 vezes" na spec.',
      ).toBe(false);
    }
  });

  it('a fonte do dado da ONU e do cambio continua junto', () => {
    expect(fome.sources.length).toBeGreaterThanOrEqual(2);
    for (const fonte of fome.sources) expect(fonte.url).toMatch(/^https?:\/\//);
  });

  it('razaoFome e diasFome, no falacias.vue, leem as duas series e o IPCA — nao uma constante', () => {
    for (const [nome, expressao] of [['razaoFome', razaoFomeExpr], ['diasFome', diasFomeExpr]] as const) {
      expect(expressao, `${nome}: declaracao "const ${nome} = ..." nao encontrada em app/pages/falacias.vue`).not.toBe('');
      expect(
        expressao.includes('totalBillions') && expressao.includes('wfpBrlBillions') && expressao.includes('/'),
        `${nome} = ${expressao.trim()} precisa dividir revenue2025.totalBillions por fome.wfpBrlBillions. `
          + 'A razao de 117 ja saiu publicada errada como 81 numa spec desta fase, por divisao pela '
          + 'grandeza errada — travar a formula no codigo-fonte e a unica forma de garantir que ela '
          + 'nunca volte a virar constante.',
      ).toBe(true);
      expect(
        expressao.includes('ipcaAcumulado'),
        `${nome} = ${expressao.trim()} precisa multiplicar/dividir por ipcaAcumulado. Sem a correcao do `
          + 'IPCA, a razao mistura reais de out/2022 com arrecadacao do ano corrente e sai inflada '
          + '(117x em vez de 101x) — foi exatamente esse defeito que a revisao final encontrou no ar.',
      ).toBe(true);
    }
  });

  it('nenhum literal numerico substitui a formula de razaoFome ou diasFome', () => {
    for (const nome of ['razaoFome', 'diasFome'] as const) {
      const atribuicaoLiteral = new RegExp(`const ${nome}\\s*=\\s*\\d`).test(falaciasSrc);
      expect(
        atribuicaoLiteral,
        `${nome} nao pode ser um numero cravado (ex.: "const ${nome} = 117;"). A razao de 117 ja `
          + 'saiu publicada errada como 81 numa spec desta fase, por divisao pela grandeza errada — '
          + 'e por isso ela nunca vive como literal, so como formula.',
      ).toBe(false);
    }
  });
});

const secoesCompletasSrc = readFileSync(join(raiz, 'app', 'utils', 'secoesCompletas.ts'), 'utf-8');
const twittersPerYearExpr = secoesCompletasSrc.match(/const twittersPerYear = ([^;]+);/)?.[1] ?? '';
const daysPerTwitterExpr = secoesCompletasSrc.match(/const daysPerTwitter = ([^;]+);/)?.[1] ?? '';

const twittersPerYear = receitaAnual / (fome.twitterBrlBillions * ipcaAcumulado);
const daysPerTwitter = Math.round(365 / twittersPerYear);

describe('a mesma falacia, na home — secoesCompletas.ts (montarFallacies) tambem nao pode virar literal', () => {
  it('twittersPerYear e daysPerTwitter leem as series, nao uma constante', () => {
    for (const [nome, expressao] of [
      ['twittersPerYear', twittersPerYearExpr],
      ['daysPerTwitter', daysPerTwitterExpr],
    ] as const) {
      expect(
        expressao,
        `${nome}: declaracao "const ${nome} = ..." nao encontrada em app/utils/secoesCompletas.ts`,
      ).not.toBe('');
    }
    expect(
      twittersPerYearExpr.includes('totalBillions') && twittersPerYearExpr.includes('twitterBrlBillions') && twittersPerYearExpr.includes('/'),
      `twittersPerYear = ${twittersPerYearExpr.trim()} precisa dividir revenue2025.totalBillions por `
        + 'fome.twitterBrlBillions.',
    ).toBe(true);
    expect(
      twittersPerYearExpr.includes('ipcaAcumulado'),
      `twittersPerYear = ${twittersPerYearExpr.trim()} precisa multiplicar por ipcaAcumulado — sem a `
        + 'correcao do IPCA a razao mistura reais de out/2022 com arrecadacao do ano corrente.',
    ).toBe(true);
    expect(
      daysPerTwitterExpr.includes('twittersPerYear'),
      `daysPerTwitter = ${daysPerTwitterExpr.trim()} precisa derivar de twittersPerYear, nao de um numero cravado.`,
    ).toBe(true);
  });

  it('trava o valor publicado (nao so a formula) — a mesma regua do IPCA que o site usa', () => {
    expect(
      Number(twittersPerYear.toFixed(1)),
      'twittersPerYear publicado e 14,9x — se mudou, confira a regua do IPCA antes de atualizar este numero.',
    ).toBe(14.9);
    expect(daysPerTwitter, 'daysPerTwitter publicado e 24 — se mudou, confira a regua do IPCA antes de atualizar este numero.').toBe(24);
  });

  it('nenhum literal numerico substitui a formula de twittersPerYear ou daysPerTwitter', () => {
    for (const nome of ['twittersPerYear', 'daysPerTwitter'] as const) {
      const atribuicaoLiteral = new RegExp(`const ${nome}\\s*=\\s*\\d`).test(secoesCompletasSrc);
      expect(
        atribuicaoLiteral,
        `${nome} nao pode ser um numero cravado (ex.: "const ${nome} = 17.2;"). Trocar a formula por `
          + 'um literal e a forma mais comoda do defeito voltar, e e exatamente o que este teste tranca.',
      ).toBe(false);
    }
  });
});
