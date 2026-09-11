<script setup lang="ts">
/**
 * Casas rápidas saltam em vez de girar: a R$ 130 mil/s a roda dos centavos
 * daria milhões de voltas por segundo e mostraria meio dígito cortado.
 * As rodas são `aria-hidden` (cada tira tem os dez algarismos); o leitor de
 * tela recebe o número no `sr-only`.
 */
import { casaGira, digitoDaCasa, pecasDoNumero, posicaoDaCasa } from '~/utils/odometro';

const props = withDefaults(
  defineProps<{
    valor: number;
    /** Decide quais rodas giram; com zero (número parado) todas giram. */
    porSegundo?: number;
  }>(),
  { porSegundo: 0 },
);

const { formatDinheiro, converter } = useMoeda();

/** O zero repetido no fim fecha a volta sem salto. */
const TIRA = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

const formatado = computed(() => formatDinheiro(props.valor));
/** As rodas giram sobre o valor já na moeda da tela, o mesmo que o texto mostra. */
const valor = computed(() => converter(props.valor));
const porSegundo = computed(() => converter(props.porSegundo));

/**
 * Molde com os dígitos zerados: a string só muda quando a estrutura muda;
 * senão o Vue remontaria as colunas a cada quadro.
 */
const pecas = computed(() => pecasDoNumero(formatado.value.replace(/\d/g, '0')));

const semMovimento = ref(false);
onMounted(() => {
  semMovimento.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
});

/** Em alturas de linha; o CSS de `.od-tira` faz a conta. */
function giro(casa: number): number {
  if (semMovimento.value || !casaGira(porSegundo.value, casa)) {
    return digitoDaCasa(valor.value, casa);
  }
  return posicaoDaCasa(valor.value, casa, porSegundo.value);
}
</script>

<template>
  <span class="od">
    <span class="sr-only">{{ formatado }}</span>
    <span aria-hidden="true" class="od-linha">
      <template v-for="(peca, indice) in pecas" :key="indice">
        <span v-if="peca.tipo === 'texto'" class="od-fixo">{{ peca.texto }}</span>
        <span v-else class="od-roda">
          <span class="od-tira" :style="{ '--od-giro': giro(peca.casa) }">
            <span v-for="(algarismo, linha) in TIRA" :key="linha">{{ algarismo }}</span>
          </span>
        </span>
      </template>
    </span>
  </span>
</template>
