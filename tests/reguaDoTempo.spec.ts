import { describe, expect, it } from 'vitest';
import en from '../i18n/locales/en.json';
import pt from '../i18n/locales/pt-BR.json';

/**
 * Há duas réguas legítimas para o tempo trabalhado para o governo: a nacional
 * do IBPT (149 dias) e a pessoal da calculadora. A home fala do brasileiro
 * médio, a calculadora fala do leitor, e nenhuma afirma que a outra confere.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- os dois JSON tem formatos distintos, o teste so acessa chaves comuns
const locales: Record<string, any> = { 'pt-BR': pt, en };

const segundaPessoa: Record<string, RegExp> = {
  'pt-BR': /\bvoc[êe]s?\b|\bseus?\b|\bsuas?\b/i,
  en: /\byou(?:r|rs)?\b/i,
};

const alvos: Array<{ secao: string; chave: string }> = [
  { secao: 'fiveMonths', chave: 'title' },
  { secao: 'fiveMonths', chave: 'subtitle' },
  { secao: 'wageGap', chave: 'title' },
];

describe('a regua do tempo trabalhado nao pode se contradizer entre telas', () => {
  it('a home fala do brasileiro medio, nunca do leitor', () => {
    for (const [nome, l] of Object.entries(locales)) {
      for (const { secao, chave } of alvos) {
        expect(
          segundaPessoa[nome]!.test(l[secao][chave]),
          `${nome}: ${secao}.${chave} fala com o leitor, mas publica um dado `
            + 'agregado (media nacional ou salario minimo). Quem fala com o leitor '
            + 'e a calculadora. Sujeito errado = contradicao publicada.',
        ).toBe(false);
      }
    }
  });

  it('a frase-assinatura da calculadora nao crava data nenhuma', () => {
    for (const [nome, l] of Object.entries(locales)) {
      const frase: string = l.signature.calculator;
      expect(
        frase,
        `${nome}: signature.calculator precisa interpolar {date} — a data e `
          + 'calculada pela pagina a partir do salario digitado.',
      ).toContain('{date}');
      expect(
        /\d/.test(frase.replace('{date}', '')),
        `${nome}: signature.calculator tem numero cravado. Foi assim que o `
          + '"29 de maio" nacional passou a contradizer o "3 de maio" que a '
          + 'propria tela calculava tres blocos acima.',
      ).toBe(false);
    }
  });

  it('a calculadora nao afirma que a media nacional confere com a conta pessoal', () => {
    const afirmaConcordancia: Record<string, RegExp> = {
      'pt-BR': /confere|bate com/i,
      en: /matches|in line with|checks out/i,
    };
    for (const [nome, l] of Object.entries(locales)) {
      expect(
        afirmaConcordancia[nome]!.test(l.calculator.ibptLine),
        `${nome}: calculator.ibptLine afirma concordancia com o IBPT, mas sao `
          + '26 dias de diferenca (123 x 149) porque sao reguas diferentes. '
          + 'A linha precisa dizer que e OUTRA medida, e por que difere.',
      ).toBe(false);
    }
  });
});
