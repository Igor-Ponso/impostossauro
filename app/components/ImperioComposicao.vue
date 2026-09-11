<script setup lang="ts">
import historicalPt from '~/data/historical.json';

/**
 * Não existe carga em % do PIB para o século XIX; a régua é a composição da
 * receita (tabela 1.2 de Abreu e Corrêa do Lago, TD 584), cujas colunas somam
 * 100. Sem `reveal`: ele deixa a seção invisível no HTML estático.
 */
const { t, locale } = useI18n();

const historical = dadoNoIdioma('historical.json', historicalPt, locale.value);
const imperio = historical.empire;

const num = (valor: number, casas = 1) =>
  valor.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

const FATIAS = [
  { chave: 'imports' as const, cor: 'var(--color-money)' },
  { chave: 'exports' as const, cor: 'var(--color-dino)' },
  { chave: 'others' as const, cor: 'var(--color-ink-dim)' },
];

const marcos = computed(() =>
  imperio.milestones.map((marco) => ({
    ...marco,
    comercioExterior: marco.imports + marco.exports,
  })),
);

const pico = computed(() => [...marcos.value].sort((a, b) => b.comercioExterior - a.comercioExterior)[0]!);

const emFoco = ref<{ label: string; fatia: string; pct: number } | null>(null);
</script>

<template>
  <section>
    <p class="text-money text-xs font-semibold tracking-[0.18em] uppercase">
      {{ t('empire.kicker') }}
    </p>
    <h3 class="font-display text-ink mt-3 text-xl font-bold sm:text-2xl">{{ t('empire.title') }}</h3>

    <p class="text-ink-dim mt-4 text-sm leading-relaxed sm:text-base">{{ imperio.ruler }}</p>

    <ul class="mt-6 flex flex-wrap gap-x-6 gap-y-2">
      <li v-for="fatia in FATIAS" :key="fatia.chave" class="flex items-center gap-2">
        <span aria-hidden="true" class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ background: fatia.cor }" />
        <span class="text-ink-dim text-xs sm:text-sm">{{ t(`empire.slices.${fatia.chave}`) }}</span>
      </li>
    </ul>

    <ul class="mt-6 space-y-3">
      <li
        v-for="marco in marcos"
        :key="marco.label"
        class="grid grid-cols-[62px_1fr] items-center gap-3 sm:grid-cols-[76px_1fr] sm:gap-4"
      >
        <span class="tabular text-ink-dim text-xs sm:text-sm">{{ marco.label }}</span>
        <div class="flex h-7 w-full overflow-hidden rounded-md">
          <div
            v-for="fatia in FATIAS"
            :key="fatia.chave"
            tabindex="0"
            role="button"
            class="fatia focus-visible:outline-abyss h-full outline-none focus-visible:outline-2 focus-visible:-outline-offset-2"
            :style="{
              width: `${marco[fatia.chave]}%`,
              background: fatia.cor,
              opacity: emFoco && !(emFoco.label === marco.label && emFoco.fatia === fatia.chave) ? 0.45 : 1,
            }"
            :aria-label="
              t('empire.sliceLabel', {
                year: marco.label,
                slice: t(`empire.slices.${fatia.chave}`),
                pct: num(marco[fatia.chave]),
              })
            "
            @mouseenter="emFoco = { label: marco.label, fatia: fatia.chave, pct: marco[fatia.chave] }"
            @mouseleave="emFoco = null"
            @focus="emFoco = { label: marco.label, fatia: fatia.chave, pct: marco[fatia.chave] }"
            @blur="emFoco = null"
          />
        </div>
      </li>
    </ul>

    <div aria-live="polite" class="mt-4 min-h-6 text-sm">
      <template v-if="emFoco">
        <span class="tabular text-ink font-bold">{{ emFoco.label }}</span>
        <span class="text-ink-dim ml-3">
          {{ t(`empire.slices.${emFoco.fatia}`) }}: <b class="tabular text-ink">{{ num(emFoco.pct) }}%</b>
        </span>
      </template>
      <span v-else class="text-ink-dim text-xs">{{ t('empire.hint') }}</span>
    </div>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-5 sm:p-6">
      <p class="text-alert text-base leading-relaxed font-bold sm:text-lg">
        {{ t('empire.punch', { pct: num(pico.comercioExterior), year: pico.label }) }}
      </p>
    </div>

    <p class="text-ink-dim mt-5 text-sm leading-relaxed">{{ imperio.tariff }}</p>

    <div class="border-line bg-card/60 mt-5 rounded-3xl border p-5">
      <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">
        {{ t('empire.caveatKicker') }}
      </p>
      <p class="text-ink-dim mt-2 text-sm leading-relaxed">{{ imperio.denominatorCaveat }}</p>
    </div>

    <a
      :href="imperio.table.url"
      target="_blank"
      rel="noopener"
      class="text-ink-dim hover:text-dino mt-4 inline-block text-xs underline underline-offset-4"
    >
      {{ imperio.table.source }}
    </a>
  </section>
</template>

<style scoped>
/* Sem animação de entrada: escalar a fatia num flex de larguras em % a desloca
   no caminho, e a largura é o dado. */
.fatia {
  transition: opacity 0.3s;
}
</style>
