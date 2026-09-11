import type { PostTranslationHandler, VueMessageType } from 'vue-i18n';
import { CHAVES_EM_REAL, naMoedaEscolhida } from '~/utils/estadoDaMoeda';

/**
 * Quantia escrita dentro da mensagem também troca de moeda. É o único ponto por
 * onde todo `t()` passa, então nada escapa por esquecimento.
 */
const trocarMoeda: PostTranslationHandler<VueMessageType> = (traduzido, chave) => (
  typeof traduzido === 'string' && !CHAVES_EM_REAL.has(chave) ? naMoedaEscolhida(traduzido) : traduzido
);

export default defineI18nConfig(() => ({ postTranslation: trocarMoeda }));
