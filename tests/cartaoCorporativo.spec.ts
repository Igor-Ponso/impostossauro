import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dados = JSON.parse(readFileSync(join(raiz, 'app', 'data', 'corporate-card.json'), 'utf-8')) as {
  year: number; transactions: number;
  totalMi: number; secretMi: number; cashMi: number;
  secretPct: number; cashPct: number; opaquePct: number;
  byOrg: Array<{ org: string; totalMi: number; secretMi: number; pct: number }>;
  byCash: Array<{ org: string; cashMi: number; pct: number }>;
  punch: string; honesty: { text: string }; question: string;
  url: string;
};

describe('o cartão de pagamento do governo federal', () => {
  it('refaz os percentuais a partir dos valores, sem numero digitado', () => {
    expect(dados.secretPct).toBeCloseTo((dados.secretMi / dados.totalMi) * 100, 1);
    expect(dados.cashPct).toBeCloseTo((dados.cashMi / dados.totalMi) * 100, 1);
    expect(dados.opaquePct).toBeCloseTo(dados.secretPct + dados.cashPct, 1);
  });

  it('quase metade do gasto nao tem destino identificavel', () => {
    expect(dados.opaquePct).toBeGreaterThan(45);
    expect(dados.opaquePct).toBeLessThan(55);
  });

  it('o sigilo de cada orgao fecha com o total dele', () => {
    for (const o of dados.byOrg) {
      expect(o.secretMi).toBeLessThanOrEqual(o.totalMi);
      expect(o.pct).toBeCloseTo((o.secretMi / o.totalMi) * 100, 0);
    }
  });

  it('publica os extremos que mostram que o sigilo e escolha, nao consequencia', () => {
    const pcts = dados.byOrg.map((o) => o.pct);
    expect(Math.max(...pcts)).toBeGreaterThan(90);
    expect(Math.min(...pcts)).toBeLessThan(1);
    expect(dados.punch).toContain('Defesa');
    expect(dados.punch).toContain('Presidência');
  });

  it('a denúncia aponta o destino oculto, sem atribuir crime ao sigilo', () => {
    expect(dados.honesty.text).toContain('sem dizer para onde');
    expect(dados.honesty.text).not.toMatch(/foi (roubado|desviado)|comprova corrupção/i);
  });

  it('aponta para o arquivo aberto, que abre sem token', () => {
    expect(dados.url).toContain('portaldatransparencia.gov.br');
    expect(dados.url).not.toContain('api.');
    expect(dados.transactions).toBeGreaterThan(100000);
    expect(dados.year).toBe(2025);
  });
});
