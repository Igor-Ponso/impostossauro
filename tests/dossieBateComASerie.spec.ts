import { describe, expect, it } from 'vitest';
import governments from '../app/data/governments.json';
import taxData from '../app/data/tax-data.json';

/**
 * A /inflacao e a /maquina-do-tempo têm de mostrar a mesma arrecadação, e ela
 * tem de sair da série — nunca de um literal digitado no JSON do dossiê. Se a
 * série for atualizada e o dossiê ficar para trás, o teste quebra.
 */
const ultimoAnoFederal = taxData.federalRevenueSeries.at(-1)!;
const lula3 = governments.governments.find((g) => g.key === 'lula3')!;
const arrecadacao = lula3.outcomes.find((o) => o.label === 'Arrecadação federal')!;

const comoEscrito = ultimoAnoFederal.totalBillions.toLocaleString('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

describe('dossie do lula3 — a mesma arrecadacao das outras telas', () => {
  it('publica o numero do arquivo aberto, nao o anunciado', () => {
    expect(
      arrecadacao.value,
      `o dossie precisa trazer R$ ${comoEscrito} bi, o mesmo que /inflacao publica`,
    ).toContain(comoEscrito);
  });

  it('nao ha divergencia para declarar em 2025', () => {
    expect(
      ultimoAnoFederal.divergence,
      'voltou a existir divergencia em 2025: o dossie precisa declara-la',
    ).toBeUndefined();
  });

  it('explica de que soma o numero sai, e aponta para o anuncio', () => {
    expect(arrecadacao, 'o dossie precisa dizer o que o numero inclui').toHaveProperty('note');
    expect(arrecadacao.note).toMatch(/previdenci/i);
    expect(arrecadacao.noteUrl).toMatch(/^https:\/\/www\.gov\.br\/receitafederal\//);
  });

  it('a fonte do dossie e a mesma da serie', () => {
    expect(arrecadacao.url).toBe(ultimoAnoFederal.url);
  });
});
