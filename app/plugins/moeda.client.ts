import cambio from '~/data/cambio.json';
import { contextoDaMoeda } from '~/utils/estadoDaMoeda';
import type { Moeda } from '~/utils/taxMath';

/**
 * Mantém o contexto que o funil de dados e o `postTranslation` leem. `useState`
 * direto, e não `useMoeda()`: o composable pede `useI18n()`, que plugin não tem.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const moeda = useState<Moeda>('moeda', () => 'BRL');
  const i18n = nuxtApp.$i18n as { locale: { value: string }; t: (chave: string) => string };

  watch([moeda, () => i18n.locale.value], ([atual, idioma]) => {
    contextoDaMoeda.value = {
      moeda: atual,
      taxa: cambio.usdBrl,
      idioma,
      escalas: {
        trillions: i18n.t('units.trillions'),
        billions: i18n.t('units.billions'),
        millions: i18n.t('units.millions'),
      },
    };
  }, { immediate: true });

  nuxtApp.hook('app:mounted', () => {
    try {
      if (localStorage.getItem(CHAVE_MOEDA) === 'USD') moeda.value = 'USD';
    } catch { /* sem armazenamento a moeda vale só nesta navegação */ }
  });
  watch(moeda, (valor) => {
    try {
      localStorage.setItem(CHAVE_MOEDA, valor);
    } catch { /* idem */ }
  });
});
