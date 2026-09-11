import type { Ref } from 'vue';
import cambio from '~/data/cambio.json';
import {
  formatCount as formatCountCru,
  formatMoney,
  formatMoneyCompact,
  formatMoneyInteger,
  prefixoDaMoeda,
  type Moeda,
} from '~/utils/taxMath';

export const CHAVE_MOEDA = 'impostossauro-moeda';

/**
 * Os formatadores de `taxMath.ts` amarrados ao idioma da rota e à moeda escolhida.
 * Tela chama estes, nunca o cru: `tests/formatacaoPorIdioma.spec.ts` cobra. Em dólar
 * todo valor, histórico inclusive, sai pela PTAX de `cambio.json`; a tela avisa a data.
 */
export function useMoeda() {
  const { locale, t } = useI18n();
  const moeda = useState<Moeda>('moeda', () => 'BRL');

  const escalas = computed(() => ({
    trillions: t('units.trillions'),
    billions: t('units.billions'),
    millions: t('units.millions'),
  }));

  const converter = (valor: number) => (moeda.value === 'USD' ? valor / cambio.usdBrl : valor);

  /** Para a tela que escreve o número com formatação própria e só precisa do símbolo. */
  const prefixo = computed(() => prefixoDaMoeda(locale.value, moeda.value));

  /**
   * Campo que o leitor digita: a tela mostra a moeda escolhida e o cálculo segue
   * em real. O valor guardado nunca é reconvertido, então trocar de moeda não
   * arrasta o número.
   */
  const campoNaMoeda = (emReal: Ref<number>) => computed({
    get: () => Math.round(converter(emReal.value)),
    set: (digitado: number) => {
      emReal.value = moeda.value === 'USD' ? digitado * cambio.usdBrl : digitado;
    },
  });

  /** Limite de campo (mínimo, máximo, passo) na moeda da tela. */
  const limiteNaMoeda = (emReal: number) => Math.max(1, Math.round(converter(emReal)));

  return {
    moeda,
    cambio,
    converter,
    prefixo,
    campoNaMoeda,
    limiteNaMoeda,
    formatDinheiro: (valor: number) => formatMoney(converter(valor), locale.value, moeda.value),
    formatDinheiroInteiro: (valor: number) => formatMoneyInteger(converter(valor), locale.value, moeda.value),
    formatDinheiroCompacto: (valor: number) => formatMoneyCompact(converter(valor), locale.value, escalas.value, moeda.value),
    formatCount: (valor: number) => formatCountCru(valor, locale.value),
  };
}
