import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Os R$ 92,77 e os R$ 20,48 são os Exemplos 2.1 e 1.1 da própria Receita. O
 * teste refaz a conta a partir das alíquotas cruas do JSON: se divergir, ou a
 * alíquota mudou ou a peça está mentindo.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dados = JSON.parse(readFileSync(join(raiz, 'app', 'data', 'import-tariff.json'), 'utf-8')) as {
  quote: { text: string; speaker: string; date: string; source: string; url: string };
  rates: {
    usTariffPct: number;
    importDutyPct: number;
    icmsPct: number;
    baggageDutyPct: number;
    penaltyPct: number;
    remessaConformeUpToUsd50Pct: number;
  };
  receipts: Array<{ value: string; label: string; source: string; url: string }>;
  question: string;
};

/** O ICMS "por dentro": ele entra na própria base, e a base inclui o II. */
const totalSobre100 = (ii: number, icms: number) => {
  const comII = 100 * (1 + ii / 100);
  return comII / (1 - icms / 100) - 100;
};

describe('a peça da tarifa de importação', () => {
  it('reproduz o Exemplo 2.1 da Receita: R$ 92,77 sobre uma compra de R$ 100', () => {
    const { importDutyPct, icmsPct } = dados.rates;
    expect(totalSobre100(importDutyPct, icmsPct)).toBeCloseTo(92.77, 2);
  });

  it('reproduz o Exemplo 1.1: dentro do Remessa Conforme até US$ 50, só o ICMS', () => {
    const { remessaConformeUpToUsd50Pct, icmsPct } = dados.rates;
    expect(remessaConformeUpToUsd50Pct).toBe(0); // revogado em 12/05/2026
    expect(totalSobre100(remessaConformeUpToUsd50Pct, icmsPct)).toBeCloseTo(20.48, 2);
  });

  it('soma imposto e multa em 100% do excedente para quem nao declara', () => {
    expect(dados.rates.baggageDutyPct + dados.rates.penaltyPct).toBe(100);
  });

  it('cobra do brasileiro mais do que a tarifa americana cobra do exportador', () => {
    const nossa = totalSobre100(dados.rates.importDutyPct, dados.rates.icmsPct);
    expect(nossa).toBeGreaterThan(dados.rates.usTariffPct);
  });

  it('traz os tres recibos, cada um com fonte https', () => {
    expect(dados.receipts).toHaveLength(3);
    for (const r of dados.receipts) {
      expect(r.url.startsWith('https://'), `${r.value}: fonte sem https`).toBe(true);
      expect(r.source.length).toBeGreaterThan(8);
    }
    expect(dados.receipts.map((r) => r.value)).toEqual(['50%', '92,77%', '100%']);
  });

  it('cita a frase com quem disse, quando e onde conferir', () => {
    expect(dados.quote.text).toContain('guerras tarifárias');
    expect(dados.quote.speaker.length).toBeGreaterThan(4);
    expect(dados.quote.date).toContain('2025');
    expect(dados.quote.url.startsWith('https://')).toBe(true);
  });
});
