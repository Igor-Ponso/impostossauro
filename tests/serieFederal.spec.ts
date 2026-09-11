import { describe, expect, it } from 'vitest';
import dados from '../app/data/tax-data.json';

describe('serie federal', () => {
  const serie = dados.federalRevenueSeries as Array<{
    year: number;
    totalBillions: number;
    ruler: string;
  }>;
  const porAno = Object.fromEntries(serie.map((x) => [x.year, x.totalBillions]));

  it('comeca em 1994, que e onde a planilha da Receita comeca', () => {
    expect(Math.min(...serie.map((x) => x.year))).toBe(1994);
  });

  it('nao tem buraco de ano', () => {
    const anos = serie.map((x) => x.year).sort((a, b) => a - b);
    for (let i = 1; i < anos.length; i += 1) {
      expect(anos[i], `falta o ano ${anos[i - 1]! + 1}`).toBe(anos[i - 1]! + 1);
    }
  });

  it('nao tem ano zerado nem negativo', () => {
    for (const x of serie) {
      expect(x.totalBillions, `${x.year} esta zerado ou negativo`).toBeGreaterThan(0);
    }
  });

  it('publica os anos que o arquivo por estado nao sustentava', () => {
    // No CSV por estado estes anos saem ~30% menores (166,1 / 187,4 / 222,2):
    // a coluna de receita previdenciaria nao existe la antes de 2013.
    expect(porAno[2000]).toBeCloseTo(234.3, 1);
    expect(porAno[2001]).toBeCloseTo(263.3, 1);
    expect(porAno[2002]).toBeCloseTo(317.1, 1);
  });

  it('bate com a outra fonte da Receita onde as duas se sobrepoem', () => {
    // Duas medicoes independentes da Receita para a mesma grandeza: a planilha
    // nacional (a serie) e a soma do arquivo por estado (o mapa). De 2013 a
    // 2024 fecham em ate 0,1%; se se separarem, uma mudou de definicao.
    const somaDoArquivoPorEstado: Record<number, number> = {
      2013: 1138.3, 2014: 1187.9, 2015: 1221.5, 2016: 1289.8, 2017: 1342.4,
      2018: 1457.1, 2019: 1537.1, 2020: 1479.4, 2021: 1878.8, 2022: 2218.5,
      2023: 2318.1, 2024: 2651.3,
    };
    for (const [ano, porEstado] of Object.entries(somaDoArquivoPorEstado)) {
      const oficial = porAno[Number(ano)]!;
      const diferenca = Math.abs(oficial / porEstado - 1);
      expect(diferenca, `${ano}: planilha ${oficial} x por estado ${porEstado}`).toBeLessThan(0.001);
    }
  });

  it('2025 e o unico ano em que as duas fontes se afastam, e pouco', () => {
    // O arquivo por estado soma R$ 2.855,8 bi em 2025; a planilha nacional,
    // R$ 2.886,9 bi — o valor que a propria Receita anunciou.
    const diferenca = porAno[2025]! / 2855.8 - 1;
    expect(diferenca).toBeGreaterThan(0.005);
    expect(diferenca).toBeLessThan(0.02);
  });

  it('da fonte a todo ano', () => {
    for (const x of serie as Array<{ year: number; source?: string; url?: string }>) {
      expect(x.source, `${x.year} sem fonte`).toBeTruthy();
      expect(x.url, `${x.year} sem url`).toMatch(/^https:\/\//);
    }
  });

  it('nao perde a apuracao humana numa regeneracao', () => {
    // `divergence` e `corroboration` sao apuracao a mao; nao saem do CSV.
    const editoriais = (serie as Array<Record<string, unknown>>).filter(
      (x) => x.divergence || x.corroboration,
    );
    // Doze corroboracoes de materia, abertas uma a uma.
    expect(editoriais.length, 'a apuracao humana sumiu da serie').toBeGreaterThanOrEqual(12);

    for (const ano of [2013, 2014, 2020, 2024]) {
      const x = serie.find((item) => item.year === ano) as Record<string, unknown>;
      expect(x?.divergence ?? x?.corroboration, `${ano} perdeu o campo editorial`).toBeTruthy();
    }

    // 2013: a Receita anunciou "R$ 1,1 trilhao" contando so o que ela
    // administra; o total do ano foi R$ 1.138,8 bi. E recorte, nao erro.
    const d2013 = serie.find((x) => x.year === 2013) as { divergence?: { announced?: number } };
    expect(d2013?.divergence?.announced).toBe(1100);

    // 2025: os R$ 2.886 bi anunciados sao o total da propria serie.
    const d2025 = serie.find((x) => x.year === 2025) as { divergence?: unknown };
    expect(d2025?.divergence, '2025 nao tem divergencia: o anunciado bate com a serie').toBeUndefined();
  });

  /**
   * Somar sempre as mesmas colunas do CSV não garante a mesma régua: a receita
   * previdenciária só tem valor de 2013 em diante, e a de outros órgãos de
   * 2010. Antes disso o ano sai ~30% menor sem que nada acuse.
   */
  describe('a regua de cada ano', () => {
    it('declara a regua em todo ano, e so conhece duas', () => {
      for (const x of serie) {
        expect(['completa', 'nucleo'], `${x.year} com regua desconhecida`).toContain(x.ruler);
      }
    });

    it('nao troca de regua no meio de um trecho', () => {
      // O arquivo ganha colunas e não as perde: todo ano de nucleo vem antes
      // de todo ano de completa.
      const ultimoNucleo = Math.max(...serie.filter((x) => x.ruler === 'nucleo').map((x) => x.year));
      const primeiraCompleta = Math.min(
        ...serie.filter((x) => x.ruler === 'completa').map((x) => x.year),
      );
      expect(primeiraCompleta, 'as reguas se alternam dentro da serie').toBeGreaterThan(ultimoNucleo);
    });

    it('marca como nucleo so o ano em que a planilha nao tem previdenciaria', () => {
      // 1995 e o primeiro ano com receita previdenciaria na planilha; 1994
      // como completa poria no grafico um ano sem quase um terco da arrecadacao.
      for (const x of serie) {
        expect(x.ruler, `${x.year} nao pode ser ${x.ruler}`).toBe(
          x.year >= 1995 ? 'completa' : 'nucleo',
        );
      }
    });

    it('o degrau entre as duas reguas e grande o bastante para enganar', () => {
      const ultimoNucleo = serie.filter((x) => x.ruler === 'nucleo').at(-1)!;
      const primeiraCompleta = serie.filter((x) => x.ruler === 'completa')[0]!;
      const salto = primeiraCompleta.totalBillions / ultimoNucleo.totalBillions - 1;
      expect(salto, 'o degrau entre as reguas encolheu — reconferir a fonte').toBeGreaterThan(0.4);
    });
  });

  /**
   * `corroboration` é a matéria que confirma o total do ano por fora do
   * arquivo. Uma matéria de balanço fala de um ano só: a mesma URL em duas
   * entradas é a assinatura de uma corroborando o ano errado.
   */
  describe('corroboracao', () => {
    const comCorroboracao = (dados.federalRevenueSeries as Array<{
      year: number;
      corroboration?: { source: string; url: string };
    }>).filter((x) => x.corroboration);

    it('nenhuma materia corrobora dois anos', () => {
      const porUrl = new Map<string, number[]>();
      for (const x of comCorroboracao) {
        const anos = porUrl.get(x.corroboration!.url) ?? [];
        anos.push(x.year);
        porUrl.set(x.corroboration!.url, anos);
      }
      for (const [url, anos] of porUrl) {
        expect(anos, `os anos ${anos.join(' e ')} corroboram com a MESMA materia: ${url}`).toHaveLength(1);
      }
    });

    it('a URL da materia cita o ano que ela corrobora', () => {
      // O ano está no caminho da URL das matérias de balanço ("...-em-2016").
      // Não prova o conteúdo, mas pega de graça o deslocamento de um ano.
      for (const x of comCorroboracao) {
        expect(
          x.corroboration!.url.includes(String(x.year)),
          `a materia de ${x.year} nao cita ${x.year} na URL: ${x.corroboration!.url}`,
        ).toBe(true);
      }
    });
  });
});

