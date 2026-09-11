<script setup lang="ts">
import {
  brasilVence, fracaoNaEscala, rotuloNoIdioma,
  type IndicadorMundo, type PaisMundo,
} from '~/utils/mundo';

const props = defineProps<{
  indicador: IndicadorMundo;
  oponente: PaisMundo;
  desloc: string;
}>();

const { t, locale } = useI18n();

const rotulo = computed(() => rotuloNoIdioma(props.indicador, locale.value));

const valorBr = computed(() => props.indicador.valores.BRA);
const valorOp = computed(() => props.indicador.valores[props.oponente.iso]);
const temOsDois = computed(
  () => typeof valorBr.value === 'number' && typeof valorOp.value === 'number',
);
const venceu = computed(() => brasilVence(props.indicador, props.oponente));

/** Os paises nao medem no mesmo ano (ensino medio vai de 2020 a 2024): o ano vai ao lado do valor. */
const anoBr = computed(() => props.indicador.anos.BRA);
const anoOp = computed(() => props.indicador.anos[props.oponente.iso]);

const fmt = (v: number) => v.toLocaleString(locale.value, {
  minimumFractionDigits: 1, maximumFractionDigits: 1,
});
</script>

<template>
  <div class="duel-lin" :style="{ '--d': desloc }">
    <p v-if="!temOsDois" class="duel-rot duel-rot-vazia">
      {{ rotulo }} &mdash;
      {{ t('duel.noData', { pais: typeof valorBr === 'number' ? oponente.nome : 'o Brasil' }) }}
    </p>

    <template v-else>
      <p class="duel-rot">{{ rotulo }}</p>
      <div class="duel-par">
        <div class="duel-trilho">
          <span
            class="duel-fill duel-fill-br"
            :class="{ venceu }"
            :style="{ width: fracaoNaEscala(valorBr!, indicador) + '%' }"
          />
        </div>
        <div class="duel-trilho">
          <span
            class="duel-fill duel-fill-op"
            :class="{ perdeu: venceu }"
            :style="{ width: fracaoNaEscala(valorOp!, indicador) + '%' }"
          />
        </div>
      </div>
      <p class="duel-num tabular">
        <span :class="venceu ? 'text-[#a8f5c2]' : 'text-[#ffd76a]'">
          {{ fmt(valorBr!) }}<span class="duel-ano">{{ anoBr }}</span>
        </span>
        <span :class="venceu ? 'text-[#ffd76a]' : 'text-[#a8f5c2]'">
          {{ fmt(valorOp!) }}<span class="duel-ano">{{ anoOp }}</span>
        </span>
      </p>
    </template>
  </div>
</template>

<style scoped>
.duel-lin { --d: 0px; }
/* Rótulo e vão seguem a lâmina (--d) nesta altura; centrados no meio geométrico
   ficariam desencontrados da diagonal. */
.duel-rot {
  font-family: var(--fonte-pixel); font-size: 9px; letter-spacing: .05em;
  color: #ffffffb5; margin: 0 auto 3px; width: fit-content;
  transform: translateX(var(--d)); position: relative; z-index: 6;
  background: #05080ad9; padding: 3px 7px; border-radius: 3px;
  transition: transform .7s cubic-bezier(.35,.85,.3,1);
}
.duel-rot-vazia { font-size: 8px; opacity: .62; margin-bottom: 0; }
.duel-par {
  display: grid; gap: 22px; align-items: center;
  grid-template-columns: calc(50% + var(--d) - 11px) 1fr;
  transition: grid-template-columns .7s cubic-bezier(.35,.85,.3,1);
}
.duel-trilho {
  height: 13px; background: #ffffff17; border-radius: 3px;
  overflow: hidden; position: relative;
}
.duel-fill {
  position: absolute; top: 0; height: 100%; border-radius: 3px;
  transition: width .95s cubic-bezier(.25,.9,.35,1);
}
.duel-fill-br { left: 0; background: linear-gradient(90deg,#f0a04a,#ffd76a); }
.duel-fill-op { right: 0; background: linear-gradient(270deg,#4fd07f,#a8f5c2); }
.duel-fill-br.venceu { background: linear-gradient(90deg,#4fd07f,#a8f5c2); }
.duel-fill-op.perdeu { background: linear-gradient(270deg,#f0a04a,#ffd76a); }
.duel-num {
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: var(--font-display); font-size: 16px; margin-top: 4px;
}
.duel-ano {
  font-family: var(--fonte-pixel); font-size: 8px;
  color: #ffffff8c; margin-left: 6px; vertical-align: 1px;
}
@media (prefers-reduced-motion: reduce) {
  .duel-fill, .duel-rot, .duel-par { transition: none; }
}
</style>
