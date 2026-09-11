import { describe, expect, it } from 'vitest';
import { converterTextoMonetario, quantiasEmReal } from '../app/utils/moedaNoTexto';

const PT = {
  moeda: 'USD' as const,
  taxa: 5,
  idioma: 'pt-BR',
  escalas: { trillions: 'trilhões', billions: 'bilhões', millions: 'milhões' },
};
const EN = { ...PT, idioma: 'en', escalas: { trillions: 'trillion', billions: 'billion', millions: 'million' } };
const REAL = { ...PT, moeda: 'BRL' as const };
/** O `Intl` separa símbolo e número com espaço não separável em português. */
const US$ = 'US$ ';

describe('a quantia dentro da frase troca de moeda', () => {
  it('em real o texto sai idêntico', () => {
    const frase = 'A folha saiu de R$ 217 bilhões para R$ 421 bilhões.';
    expect(converterTextoMonetario(frase, REAL)).toBe(frase);
  });

  it('converte valor simples e mantém o resto da frase', () => {
    expect(converterTextoMonetario('A família sai quando a renda passa de R$ 218 por pessoa.', PT))
      .toBe(`A família sai quando a renda passa de ${US$}44 por pessoa.`);
  });

  it('preserva o ponto final da frase', () => {
    expect(converterTextoMonetario('O teto é R$ 5.000.', PT)).toBe(`O teto é ${US$}1.000.`);
  });

  it('mantém os centavos quando a frase os tinha', () => {
    expect(converterTextoMonetario('Custa R$ 1.234,50 hoje.', PT)).toBe(`Custa ${US$}246,90 hoje.`);
  });

  it('converte as duas pontas de um intervalo', () => {
    expect(converterTextoMonetario('de R$ 700 milhões para R$ 1,2 bilhão', PT))
      .toBe(`de ${US$}140 milhões para ${US$}240 milhões`);
  });

  it('mantém a palavra de escala do autor quando a grandeza não muda', () => {
    expect(converterTextoMonetario('R$ 2.886,9 bi em 2025', PT)).toBe(`${US$}577,4 bi em 2025`);
    expect(converterTextoMonetario('R$ 8,3 bilhões sonegados', PT)).toBe(`${US$}1,7 bilhões sonegados`);
  });

  it('desce de escala quando o valor não preenche mais a grandeza', () => {
    expect(converterTextoMonetario('R$ 1,2 bilhão', PT)).toBe(`${US$}240 milhões`);
  });

  it('em inglês lê a régua inglesa e usa o símbolo inglês', () => {
    expect(converterTextoMonetario('A company that owed R$ 3.9 billion', EN)).toBe('A company that owed $780 million');
    expect(converterTextoMonetario('reached R$ 1,621 per person', EN)).toBe('reached $324 per person');
  });

  it('não toca em valor que já está em dólar', () => {
    const frase = 'compras de até US$ 50 pagavam 44,6%';
    expect(converterTextoMonetario(frase, PT)).toBe(frase);
  });

  it('não toca em número sem moeda', () => {
    const frase = 'A carga chegou a 32,40% do PIB em 2025, com 160.800 transações.';
    expect(converterTextoMonetario(frase, PT)).toBe(frase);
  });

  it('taxa ausente ou zero devolve o texto original', () => {
    const frase = 'R$ 10 bilhões';
    expect(converterTextoMonetario(frase, { ...PT, taxa: 0 })).toBe(frase);
  });
});

describe('quantiasEmReal encontra o que precisa converter', () => {
  it('acha cada quantia da frase', () => {
    expect(quantiasEmReal('de R$ 700 milhões para R$ 1,2 bilhão')).toHaveLength(2);
    expect(quantiasEmReal('nenhum dinheiro aqui')).toHaveLength(0);
    expect(quantiasEmReal('US$ 50 apenas')).toHaveLength(0);
  });
});
