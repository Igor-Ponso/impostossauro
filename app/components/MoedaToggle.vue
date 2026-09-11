<script setup lang="ts">
import type { Moeda } from '~/utils/taxMath';

const { t, locale } = useI18n();
const { moeda, cambio } = useMoeda();
const opcoes: { valor: Moeda; rotulo: string }[] = [
  { valor: 'BRL', rotulo: 'R$' },
  { valor: 'USD', rotulo: 'US$' },
];
const titulo = computed(() => t('moeda.cotacao', {
  taxa: cambio.usdBrl.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
  data: new Date(`${cambio.data}T12:00:00Z`).toLocaleDateString(locale.value, { timeZone: 'UTC' }),
}));
</script>

<template>
  <div role="group" :aria-label="t('moeda.rotulo')" :title="titulo" class="flex items-center gap-1 text-xs">
    <template v-for="(opcao, indice) in opcoes" :key="opcao.valor">
      <span v-if="indice > 0" class="text-line hidden sm:inline">|</span>
      <!-- O alvo tem 44 px de altura; só o texto é pequeno. -->
      <button
        type="button"
        class="inline-flex min-h-11 items-center px-1 transition-colors"
        :class="opcao.valor === moeda ? 'text-dino font-bold' : 'text-ink-dim hover:text-ink'"
        :aria-pressed="opcao.valor === moeda"
        @click="moeda = opcao.valor"
      >
        {{ opcao.rotulo }}
      </button>
    </template>
  </div>
</template>
