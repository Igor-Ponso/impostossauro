import { describe, expect, it } from 'vitest';
import cambio from '../app/data/cambio.json';
import { formatMoney, formatMoneyCompact, formatMoneyInteger, simboloDaMoeda } from '../app/utils/taxMath';

const ESCALAS_EN = { trillions: 'trillion', billions: 'billion', millions: 'million' };

describe('a mesma conta sai em real ou em dolar', () => {
  it('em dolar o simbolo muda com o idioma', () => {
    expect(formatMoney(1234.5, 'pt-BR', 'USD')).toContain('US$');
    expect(formatMoney(1234.5, 'pt-BR', 'USD')).toContain('1.234,50');
    expect(formatMoney(1234.5, 'en', 'USD')).toBe('$1,234.50');
    expect(formatMoneyInteger(1234.5, 'en', 'USD')).toBe('$1,235');
  });

  it('o compacto usa o simbolo da moeda e a escala do idioma', () => {
    expect(formatMoneyCompact(3.2e12, 'en', ESCALAS_EN, 'USD')).toBe('$ 3.2 trillion');
    expect(formatMoneyCompact(3.2e12, 'pt-BR', undefined, 'USD')).toBe('US$ 3,2 trilhões');
    expect(formatMoneyCompact(3.2e12, 'pt-BR')).toBe('R$ 3,2 trilhões');
  });

  it('o simbolo sai do Intl, nao de tabela nossa', () => {
    expect(simboloDaMoeda('pt-BR', 'BRL')).toBe('R$');
    expect(simboloDaMoeda('en', 'USD')).toBe('$');
  });
});

describe('a cotacao publicada e a PTAX do dia, com data e fonte', () => {
  it('tem taxa plausivel, data ISO e fonte nomeada', () => {
    expect(cambio.usdBrl).toBeGreaterThan(1);
    expect(cambio.usdBrl).toBeLessThan(20);
    expect(cambio.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(cambio.tipo).toBe('PTAX de venda');
    expect(cambio.source).toContain('Banco Central');
    expect(cambio.url).toMatch(/^https:\/\/www\.bcb\.gov\.br\//);
  });
});
