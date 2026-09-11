import { describe, expect, it } from 'vitest';
import taxData from '../app/data/tax-data.json';

/**
 * O contador do ano corrente é estimativa por natureza; o que não pode é a base
 * nascer de número que ninguém publicou. A conta sai do fechamento do ano
 * anterior e do ritmo que a ACSP mede, e este arquivo a refaz.
 */
const atual = taxData.currentYear;

describe('base do contador — sai da extrapolacao, entra o ritmo publicado', () => {
  it('declara os dois numeros publicados de onde a conta sai', () => {
    expect(atual.pace, 'a base precisa expor os insumos, nao so o resultado').toBeDefined();
    expect(atual.pace!.previousYearBillions).toBeGreaterThan(0);
    expect(atual.pace!.growthPctVsPreviousYear).toBeGreaterThan(0);
    expect(atual.pace!.milestoneBillions).toBeGreaterThan(0);
    expect(atual.pace!.milestoneDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('o total e o fechamento do ano anterior corrigido pelo ritmo medido', () => {
    const { previousYearBillions, growthPctVsPreviousYear } = atual.pace!;
    const esperado = Math.round(previousYearBillions * (1 + growthPctVsPreviousYear / 100));
    expect(atual.totalBillions, 'a conta da base nao fecha com os insumos declarados').toBe(esperado);
  });

  it('o fechamento do ano anterior e o ultimo ano da propria serie', () => {
    const ultimoFechado = taxData.revenueSeries.at(-1)!;
    expect(atual.pace!.previousYearBillions).toBe(ultimoFechado.totalBillions);
    expect(atual.year).toBe(ultimoFechado.year + 1);
  });

  it('a marca publicada e coerente com o ritmo do ano', () => {
    // A marca de R$ 2 tri é de fim de junho: longe da metade do total, marca e
    // total vieram de anos diferentes.
    const fracao = atual.pace!.milestoneBillions / atual.totalBillions;
    expect(fracao).toBeGreaterThan(0.4);
    expect(fracao).toBeLessThan(0.6);
  });

  it('a base nao se anuncia mais como extrapolacao', () => {
    expect(atual.basis.toLowerCase()).not.toContain('extrapolação');
  });
});
