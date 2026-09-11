import { describe, expect, it } from 'vitest';
import { formatBRL } from '../app/utils/taxMath';
import { casaGira, digitoDaCasa, fracaoDaVirada, pecasDoNumero, posicaoDaCasa } from '../app/utils/odometro';

/**
 * O odômetro fatia a saída do `formatBRL` em vez de montar o número do float:
 * separadores e o espaço não-separável (U+00A0) depois do `R$` ficam por conta
 * do `Intl`, nos dois idiomas.
 */
describe('as pecas: dígito vira roda, o resto vira texto parado', () => {
  it('o formatador em português usa espaço NÃO-SEPARÁVEL, e é isso que se fatia', () => {
    // Espaço comum e U+00A0 são idênticos na tela e diferentes na máquina.
    expect(formatBRL(1234.5, 'pt-BR')).toBe('R$\u00A01.234,50');
  });

  it('acha a casa decimal de cada dígito em português', () => {
    expect(pecasDoNumero(formatBRL(1234.5, 'pt-BR'))).toEqual([
      { tipo: 'texto', texto: 'R$\u00A0' },
      { tipo: 'digito', casa: 3 },
      { tipo: 'texto', texto: '.' },
      { tipo: 'digito', casa: 2 },
      { tipo: 'digito', casa: 1 },
      { tipo: 'digito', casa: 0 },
      { tipo: 'texto', texto: ',' },
      { tipo: 'digito', casa: -1 },
      { tipo: 'digito', casa: -2 },
    ]);
  });

  it('acha as mesmas casas em inglês, onde nem espaço existe', () => {
    const pecas = pecasDoNumero(formatBRL(1234.5, 'en'));
    expect(pecas[0]).toEqual({ tipo: 'texto', texto: 'R$' });
    expect(pecas.filter((p) => p.tipo === 'digito').map((p) => p.casa)).toEqual([3, 2, 1, 0, -1, -2]);
  });

  it('junta o texto seguido numa peça só, para não virar um span por caractere', () => {
    expect(pecasDoNumero(formatBRL(1, 'pt-BR')).filter((p) => p.tipo === 'texto')).toEqual([
      { tipo: 'texto', texto: 'R$\u00A0' },
      { tipo: 'texto', texto: ',' },
    ]);
  });
});

describe('remontar as pecas devolve o que o formatador escreveu', () => {
  const valores = [0, 0.07, 8.29, 1234.5, 130105.28, 2845123456.78, 4103e9];

  for (const idioma of ['pt-BR', 'en']) {
    it(`fecha em ${idioma}`, () => {
      for (const valor of valores) {
        const escrito = formatBRL(valor, idioma);
        const remontado = pecasDoNumero(escrito)
          .map((p) => (p.tipo === 'texto' ? p.texto : String(digitoDaCasa(valor, p.casa))))
          .join('');
        expect(remontado, `${valor} em ${idioma}`).toBe(escrito);
      }
    });
  }
});

describe('a posicao da roda', () => {
  it('fica PARADA no dígito no meio do ciclo — não em cima do avanço contínuo', () => {
    // O avanço contínuo da casa dos milhares em 1234,50 é 1,2345; uma roda
    // parada aí mostraria 77% do "1" e 23% do "2" para sempre.
    expect(posicaoDaCasa(1234.5, 3)).toBe(1);
    expect(posicaoDaCasa(1234.5, 0)).toBe(4);
  });

  it('vira só no fim do ciclo, que é o que o olho reconhece como odômetro', () => {
    // Avanço da unidade em 1234,93 é 4,93 — dentro dos últimos 15%, meio
    // caminho da virada.
    expect(posicaoDaCasa(1234.93, 0)).toBeCloseTo(4.533, 2);
  });

  it('não erra o centavo por causa de ponto flutuante', () => {
    // 8.29 * 100 dá 828.9999... em float; sem arredondar, o centavo sairia 8.
    expect(digitoDaCasa(8.29, -2)).toBe(9);
    expect(digitoDaCasa(0.07, -2)).toBe(7);
  });

  it('nunca sai fora de uma volta', () => {
    for (const casa of [-2, 0, 3, 9]) {
      const p = posicaoDaCasa(2845123456.78, casa);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(10);
    }
  });
});

/**
 * A R$ 130.105,28 por segundo, as casas de baixo dão mais de uma volta por
 * quadro: girar ali vira chiado, não movimento. Essas saltam; as de cima giram.
 */
describe('quem gira e quem salta', () => {
  const POR_SEGUNDO = 130105.28;

  it('as casas rápidas saltam', () => {
    expect(casaGira(POR_SEGUNDO, -2)).toBe(false);
    expect(casaGira(POR_SEGUNDO, 0)).toBe(false);
    expect(casaGira(POR_SEGUNDO, 3)).toBe(false);
  });

  it('a casa dos cem mil GIRA — é a mais rápida que o olho ainda acompanha', () => {
    // Ciclo de 0,77 s. Com a virada limitada a um quarto do ciclo ela vira em
    // 0,19 s — onze quadros — e fica parada os outros três quartos.
    expect(casaGira(POR_SEGUNDO, 5)).toBe(true);
    expect(fracaoDaVirada(POR_SEGUNDO, 5)).toBeCloseTo(0.25, 3);
  });

  it('as casas rápidas demais continuam saltando', () => {
    // A casa 4 troca de dígito a cada 77 ms: um quarto disso são 19 ms, menos
    // de dois quadros.
    expect(casaGira(POR_SEGUNDO, 4)).toBe(false);
    expect(casaGira(POR_SEGUNDO, 0)).toBe(false);
  });

  it('as casas lentas giram no tempo de relógio, não numa fração do ciclo', () => {
    expect(casaGira(POR_SEGUNDO, 6)).toBe(true);
    expect(casaGira(POR_SEGUNDO, 12)).toBe(true);
  });

  it('nenhuma roda que gira passa mais de um quarto da vida virando', () => {
    for (const casa of [5, 6, 7, 8, 9, 10, 12]) {
      if (!casaGira(POR_SEGUNDO, casa)) continue;
      expect(fracaoDaVirada(POR_SEGUNDO, casa), `casa ${casa}`).toBeLessThanOrEqual(0.25);
    }
  });

  it('número parado gira inteiro — é o caso de quem não é contador vivo', () => {
    expect(casaGira(0, -2)).toBe(true);
    expect(casaGira(0, 9)).toBe(true);
  });
});

/**
 * Virada como fração fixa do ciclo escala com a casa: a dos trilhões, com ciclo
 * de 89 dias, ficaria 13 dias num meio-dígito. A virada dura tempo fixo, e a
 * fração do ciclo é derivada do ritmo.
 */
describe('a virada dura o mesmo tempo em qualquer casa', () => {
  const POR_SEGUNDO = 130105.28;
  const segundosDeVirada = (casa: number) =>
    fracaoDaVirada(POR_SEGUNDO, casa) * (10 ** casa / POR_SEGUNDO);

  it('a casa dos trilhões não fica DIAS mostrando meio dígito', () => {
    expect(segundosDeVirada(12)).toBeLessThan(1);
  });

  it('nenhuma casa vira devagar demais', () => {
    for (const casa of [4, 5, 6, 8, 10, 12]) {
      expect(segundosDeVirada(casa), `casa ${casa}`).toBeLessThanOrEqual(0.6);
    }
  });

  it('as casas lentas ficam paradas no dígito quase o tempo todo', () => {
    // 99% do caminho entre 2 e 3 trilhões: ainda tem de mostrar o 2 inteiro.
    const quaseTres = 2.99e12;
    expect(posicaoDaCasa(quaseTres, 12, POR_SEGUNDO)).toBe(2);
  });

  it('número parado continua girando com folga — não é contador vivo', () => {
    expect(fracaoDaVirada(0, 3)).toBeGreaterThan(0.1);
  });
});
