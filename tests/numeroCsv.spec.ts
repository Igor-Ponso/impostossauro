import { describe, expect, it } from 'vitest';
// @ts-expect-error modulo ESM sem tipos
import { numeroCsv } from '../scripts/coleta/consolidar.mjs';

describe('numeroCsv', () => {
  it('entende virgula como separador de milhar, que e como 2001 e 2002 vem', () => {
    expect(numeroCsv('47,953,915')).toBe(47953915);
    expect(numeroCsv('1,294,086')).toBe(1294086);
  });

  it('entende ponto como separador de milhar, que e como 2008 em diante vem', () => {
    expect(numeroCsv('91.155.798')).toBe(91155798);
    expect(numeroCsv('309.910.266')).toBe(309910266);
  });

  it('entende inteiro puro, que e como 2000 e 2003 a 2007 vem', () => {
    expect(numeroCsv('292096')).toBe(292096);
    expect(numeroCsv('231')).toBe(231);
  });

  it('entende decimal por virgula', () => {
    expect(numeroCsv('285,25')).toBeCloseTo(285.25, 2);
    expect(numeroCsv('1.234,56')).toBeCloseTo(1234.56, 2);
  });

  it('trata vazio e traco como zero', () => {
    expect(numeroCsv('')).toBe(0);
    expect(numeroCsv('   ')).toBe(0);
    expect(numeroCsv('-')).toBe(0);
  });

  it('LANCA em vez de devolver zero quando nao entende', () => {
    // Zero para entrada invalida some na soma e zera o ano inteiro sem aviso.
    expect(() => numeroCsv('abc')).toThrow();
    expect(() => numeroCsv('12,34,56')).toThrow();
  });
});
