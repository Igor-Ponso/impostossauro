import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en.json';
import pt from '../i18n/locales/pt-BR.json';
import dado from '../app/data/renda-minima.json';

/**
 * O texto das leis vive no componente, não no dado: fica em português nas duas
 * rotas e a quantia dentro dele não pode passar pelo funil de moeda.
 */
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const componente = readFileSync(join(raiz, 'app', 'components', 'RendaMinimaTributada.vue'), 'utf-8');

/**
 * A peça se apoia em dois diplomas lidos no Planalto: a lei que define o piso e
 * paga o benefício, e a que manda devolver o imposto a essas famílias. Trocar
 * um valor sem trocar o documento quebra aqui.
 */
describe('o piso definido em lei', () => {
  it('a linha de pobreza e a do art. 5º, II', () => {
    expect(dado.programa.elegibilidade.valor).toBe(218);
    expect(dado.programa.elegibilidade.article).toBe('Art. 5º, II');
    expect(componente).toContain('R$ 218,00 (duzentos e dezoito reais)');
  });

  it('os tres beneficios trazem valor e artigo', () => {
    const esperado = { cidadania: 142, piso: 600, infancia: 150 };
    for (const [chave, valor] of Object.entries(esperado)) {
      const b = dado.programa.beneficios.find((x) => x.key === chave);
      expect(b, `sem o beneficio "${chave}"`).toBeDefined();
      expect(b!.valor).toBe(valor);
      expect(b!.article).toMatch(/^Art\. 4º/);
    }
  });

  /** O piso por família não pode ser menor que o benefício por integrante. */
  it('o piso por familia e maior que o valor por integrante', () => {
    const porIntegrante = dado.programa.beneficios.find((b) => b.key === 'cidadania')!.valor;
    const piso = dado.programa.beneficios.find((b) => b.key === 'piso')!.valor;
    expect(piso).toBeGreaterThan(porIntegrante);
  });

  it('declara o objetivo do programa com o artigo', () => {
    expect(dado.programa.objetivo.article).toBe('Art. 3º, I');
    expect(componente).toContain('combater a fome, por meio da transferência direta de renda');
  });
});

describe('a lei que manda devolver', () => {
  it('cita o cashback e a cesta basica, com artigo', () => {
    expect(dado.devolucao.cashback.article).toBe('Art. 112');
    expect(componente).toContain('Serão devolvidos');
    expect(dado.devolucao.cesta.article).toBe('Art. 125');
    expect(componente).toContain('Ficam reduzidas a zero as alíquotas do IBS e da CBS');
  });

  /**
   * A ressalva não é defesa de ninguém: é o dado. Sem ela o leitor não sabe que
   * a alíquota zero existe, e o número engana — regra 11 do projeto.
   */
  it('a pagina declara a aliquota zero e a transicao', () => {
    for (const [nome, bloco] of [['pt-BR', pt], ['en', en]] as const) {
      const caveat = (bloco.econ101 as Record<string, string>).floorCaveat!;
      expect(caveat, `${nome}: ressalva sem a transicao`).toMatch(/transi[çc]|transition/i);
      expect(caveat.length).toBeGreaterThan(120);
    }
  });
});

describe('o texto de lei nao volta para o dado', () => {
  it('o JSON guarda numero e artigo, nunca a citacao', () => {
    const bruto = JSON.stringify(dado);
    expect(bruto, 'citacao legal voltou ao JSON: ela converteria de moeda').not.toContain('R$');
    expect(bruto).not.toContain('combater a fome');
  });
});

describe('as duas fontes', () => {
  for (const [nome, bloco] of [['programa', dado.programa], ['devolucao', dado.devolucao]] as const) {
    it(`${nome}: fonte e link do Planalto`, () => {
      expect(bloco.source).toContain('Planalto');
      expect(bloco.url).toMatch(/^https:\/\/www\.planalto\.gov\.br\//);
      expect(bloco.label.length).toBeGreaterThan(10);
    });
  }
});

describe('a peca fala nos dois idiomas', () => {
  const CHAVES = [
    'floorKicker', 'floorTitle', 'floorLead', 'floorLineLabel', 'floorPerPerson',
    'floorPurpose', 'floorGiveBackTitle', 'floorGiveBackLead', 'floorCaveat', 'floorQuestion',
  ] as const;

  for (const nome of CHAVES) {
    it(`econ101.${nome} existe nos dois idiomas`, () => {
      expect((pt.econ101 as Record<string, string>)[nome], `pt-BR sem ${nome}`).toBeTruthy();
      expect((en.econ101 as Record<string, string>)[nome], `en sem ${nome}`).toBeTruthy();
    });
  }

  it('cada beneficio tem rotulo nos dois idiomas', () => {
    for (const b of dado.programa.beneficios) {
      for (const [nome, bloco] of [['pt-BR', pt], ['en', en]] as const) {
        const rotulos = (bloco.econ101 as Record<string, unknown>).floorBenefits as Record<string, string>;
        expect(rotulos[b.key], `${nome} sem floorBenefits.${b.key}`).toBeTruthy();
      }
    }
  });

  it('fecha em pergunta, nos dois idiomas', () => {
    for (const bloco of [pt, en]) {
      expect((bloco.econ101 as Record<string, string>).floorQuestion!.trim()).toMatch(/\?$/);
    }
  });
});
