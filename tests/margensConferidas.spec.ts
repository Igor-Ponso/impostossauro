import { describe, expect, it } from 'vitest';
import companies from '../app/data/companies.json';

/**
 * Faturamento bruto ao lado de margem calculada sobre a receita líquida engana:
 * quem divide os dois números da tela chega a outra margem, e compara empresas
 * por denominadores diferentes. O teste refaz a divisão que o leitor faria.
 */
type Empresa = { key: string; revenueLabel: string; profitLabel: string; netMarginPct: number };

function emBilhoes(rotulo: string): number {
  const numero = Number(rotulo.replace(/[^\d,]/g, '').replace(',', '.'));
  return /\bmi\b/.test(rotulo) ? numero / 1000 : numero;
}

describe('margem de cada empresa fecha com os numeros do proprio cartao', () => {
  it.each((companies.companies as Empresa[]).map((e) => [e.key, e]))('%s', (_chave, empresa) => {
    const calculada = (emBilhoes(empresa.profitLabel) / emBilhoes(empresa.revenueLabel)) * 100;
    expect(
      calculada,
      `${empresa.profitLabel} ÷ ${empresa.revenueLabel} = ${calculada.toFixed(2)}%, `
      + `mas o cartao publica ${empresa.netMarginPct}%`,
    ).toBeCloseTo(empresa.netMarginPct, 1);
  });

  it('as tres usam a mesma regua, e o arquivo diz qual e', () => {
    expect(companies.disclaimer).toMatch(/receita líquida/i);
    expect(companies.verifiedAt, 'a data da conferencia sumiu').toBeTruthy();
  });
});
