import { describe, expect, it } from 'vitest';
import { comparaveis, posicaoNoRanking, type Indicador } from '~/utils/mundo';
import world from '../app/data/world.json';

/**
 * `world.json` é gerado por `scripts/coleta/mundo.mjs`, que vai à API do Banco
 * Mundial. Estes testes existem porque a página afirma números na tela: se uma
 * recoleta trouxer valor diferente, o teste tem de quebrar e obrigar alguém a
 * reler o texto — em vez de o site continuar dizendo "76 anos" enquanto o dado
 * embaixo virou outra coisa.
 */
describe('world.json — integridade dos dados publicados', () => {
  const isos = world.paises.map((p) => p.iso);

  it('traz os 30 paises do estudo, sem repetir nenhum', () => {
    expect(world.paises).toHaveLength(30);
    expect(new Set(isos).size).toBe(30);
    for (const p of world.paises) expect(p.iso).toMatch(/^[A-Z]{3}$/);
  });

  it('poe o Brasil no grupo, e em ultimo no ranking do IRBES', () => {
    const br = world.paises.find((p) => p.iso === 'BRA');
    expect(br, 'o Brasil precisa estar no grupo que a pagina compara').toBeDefined();
    expect(br!.posicao).toBe(30);
  });

  it('nao deixa valor nao finito passar para a tela', () => {
    // NaN e Infinity sao do tipo number e sobreviveriam a uma checagem de tipo;
    // chegariam à página escritos como "NaN".
    for (const ind of world.indicadores) {
      for (const [iso, valor] of Object.entries(ind.valores)) {
        expect(Number.isFinite(valor), `${ind.id}/${iso} nao e numero finito: ${valor}`).toBe(true);
      }
    }
  });

  it('declara o ano de cada valor, porque os anos nao sao os mesmos', () => {
    for (const ind of world.indicadores) {
      for (const iso of Object.keys(ind.valores)) {
        const ano = (ind.anos as Record<string, number>)[iso];
        expect(ano, `${ind.id}/${iso} sem ano`).toBeGreaterThan(2000);
      }
    }
  });

  it('mantem paisesComparados coerente com o que faltou', () => {
    for (const ind of world.indicadores) {
      expect(new Set(ind.paisesComparados)).toEqual(new Set(Object.keys(ind.valores)));
      expect(ind.paisesComparados.length + ind.faltando.length).toBe(30);
      for (const ausente of ind.faltando) {
        expect(ind.valores).not.toHaveProperty(ausente);
      }
    }
  });

  it('classifica todo indicador como resultado, insumo ou contexto', () => {
    // A pagina trata os tres de forma diferente: so `resultado` tem placar.
    // Um indicador sem tipo cairia num limbo e apareceria onde nao devia.
    for (const ind of world.indicadores) {
      expect(['resultado', 'insumo', 'contexto'], `${ind.id} com tipo estranho`).toContain(ind.tipo);
    }
  });

  it('mantem todo valor dentro da escala declarada do indicador', () => {
    // A barra e desenhada contra a escala, nao contra o grupo. Valor fora dela
    // seria grampeado no 0% ou no 100% e a barra passaria a mentir em silencio.
    // Se este teste quebrar, quem esta errada e a escala, nao o dado.
    for (const ind of world.indicadores) {
      const [min, max] = ind.escala as [number, number];
      expect(max, `${ind.id} com escala invertida`).toBeGreaterThan(min);
      for (const iso of ind.paisesComparados) {
        const v = (ind.valores as Record<string, number>)[iso]!;
        expect(v, `${ind.id}/${iso} = ${v} estoura a escala ${min}-${max}`).toBeGreaterThanOrEqual(min);
        expect(v, `${ind.id}/${iso} = ${v} estoura a escala ${min}-${max}`).toBeLessThanOrEqual(max);
      }
    }
  });

  it('da rotulo curto a todo indicador, sem maiuscula acentuada quebrada', () => {
    // A cena do duelo usa a fonte pixel Press Start 2P, que tem maiuscula
    // acentuada so para alguns caracteres: C-cedilha e A-til saem certos, mas
    // E, I e U acentuados sao desenhados na altura de minuscula, e "HOMICIDIOS"
    // aparecia como "HOMICiDIOS". Caixa de sentenca evita o problema inteiro.
    const quebrados = /[ÉÊÍÓÔÚÀÁÂ]/;
    for (const ind of world.indicadores) {
      expect(ind.rotuloCurto, `${ind.id} sem rotulo curto`).toBeTruthy();
      expect(
        quebrados.test(ind.rotuloCurto),
        `${ind.id}: "${ind.rotuloCurto}" tem maiuscula acentuada que a fonte pixel nao desenha`,
      ).toBe(false);
    }

    // O movimento vai em caixa ALTA na caixa de batalha, entao ele cai na mesma
    // limitacao. "PRIMEIRA INFANCIA" aparecia sem o circunflexo, virando erro
    // de portugues na tela. C-cedilha e A-til sobrevivem em caixa alta.
    for (const ind of world.indicadores.filter((i) => i.movimento)) {
      expect(
        quebrados.test(ind.movimento),
        `${ind.id}: o movimento "${ind.movimento}" tem acento que a fonte pixel perde em caixa alta`,
      ).toBe(false);
    }
  });

  it('traduz rotulo e movimento, porque a cena tambem roda em ingles', () => {
    // Sem isto a pagina /en/ mostrava "Esperanca de vida" e "SEGURANCA". O
    // padrao e o mesmo do nomesEn, que ja guarda o nome dos paises nos dois.
    for (const ind of world.indicadores) {
      expect(ind.rotuloCurtoEn, `${ind.id} sem rotulo em ingles`).toBeTruthy();
      expect(ind.rotuloCurtoEn).not.toBe(ind.rotuloCurto);
    }
    for (const ind of world.indicadores.filter((i) => i.movimento)) {
      expect(ind.movimentoEn, `${ind.id} sem movimento em ingles`).toBeTruthy();
    }
  });

  it('da a todo indicador de resultado um nome de movimento', () => {
    // O anuncio da batalha ("X USOU tal movimento") sai deste campo. Sem ele, o
    // indicador com o maior abismo nao teria como ser anunciado.
    for (const ind of world.indicadores.filter((i) => i.tipo === 'resultado')) {
      expect(ind.movimento, `${ind.id} sem movimento`).toBeTruthy();
    }
  });

  it('da fonte e link para todo indicador', () => {
    for (const ind of world.indicadores) {
      expect(ind.fonte, `${ind.id} sem fonte`).toBeTruthy();
      expect(ind.url, `${ind.id} sem url`).toMatch(/^https:\/\//);
    }
  });

  it('passa no proprio filtro de reguas quando comparado com quem tem o dado', () => {
    for (const ind of world.indicadores) {
      const passou = comparaveis([ind as unknown as Indicador], ind.paisesComparados);
      expect(passou, `${ind.id} foi recusado pelo filtro`).toHaveLength(1);
    }
  });
});

/**
 * Os números que a página afirma. Conferidos na coleta de 16/08/2026.
 *
 * Se um destes quebrar, a fonte revisou o dado. O certo NÃO é afrouxar a
 * tolerância: é reler o texto da página, confirmar o número novo e atualizar os
 * dois juntos.
 */
describe('world.json — os numeros que a pagina afirma', () => {
  const esperado: Record<string, { brasil: number; posicao: number; de: number }> = {
    vida: { brasil: 76.0, posicao: 30, de: 30 },
    homicidios: { brasil: 19.3, posicao: 30, de: 30 },
    saneamento: { brasil: 55.0, posicao: 27, de: 27 },
    educacaoGasto: { brasil: 5.6, posicao: 8, de: 30 },
    saudeGasto: { brasil: 9.7, posicao: 16, de: 30 },
  };

  for (const [id, alvo] of Object.entries(esperado)) {
    it(`${id}: Brasil em ${alvo.brasil} e ${alvo.posicao}o de ${alvo.de}`, () => {
      const ind = world.indicadores.find((i) => i.id === id);
      expect(ind, `indicador ${id} sumiu de world.json`).toBeDefined();

      const valores = ind!.paisesComparados.map((iso) => (ind!.valores as Record<string, number>)[iso]);
      expect(valores).toHaveLength(alvo.de);
      expect((ind!.valores as Record<string, number>).BRA).toBeCloseTo(alvo.brasil, 1);
      expect(
        posicaoNoRanking((ind!.valores as Record<string, number>).BRA, valores, ind!.ordem as 'maiorMelhor' | 'menorMelhor'),
      ).toBe(alvo.posicao);
    });
  }

  it('mantem a ressalva da carga: o Brasil nao e quem mais tributa do grupo', () => {
    const br = world.paises.find((p) => p.iso === 'BRA')!;
    const tributamMais = world.paises.filter((p) => p.carga > br.carga);
    expect(tributamMais.length).toBeGreaterThanOrEqual(15);
  });

  // A pagina diz as duas coisas lado a lado: "20o de 30" e "19 cobram mais".
  // Uma so pode sair da outra, e um empate na carga quebraria a igualdade —
  // o site afirmaria duas contas diferentes na mesma frase.
  it('faz a posicao da carga e a contagem de quem cobra mais baterem', () => {
    const br = world.paises.find((p) => p.iso === 'BRA')!;
    const posicao = posicaoNoRanking(
      br.carga,
      world.paises.map((p) => p.carga),
      'maiorMelhor',
    );
    const tributamMais = world.paises.filter((p) => p.carga > br.carga).length;
    expect(posicao).toBe(20);
    expect(tributamMais).toBe(posicao - 1);
  });
});
