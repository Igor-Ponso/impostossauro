<script setup lang="ts">
import priceLevelPt from '~/data/price-level.json';

/**
 * `pct12` e `pct36` são as variações mensais do IPCA compostas no período, não conta sobre preço.
 * A barra nasce na largura final: largura é dado, e não passa por estado intermediário.
 */
const { t, locale } = useI18n();
const { target, inView } = useInView(0.15);

const dados = dadoNoIdioma('price-level.json', priceLevelPt, locale.value);
const num = (v: number, casas = 1) =>
  v.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

const maior = Math.max(...dados.items.map((i) => i.pct36));
const largura = (v: number) => (Math.max(v, 0) / maior) * 100;
const linhaDoGeral = (dados.generalIndex.pct36 / maior) * 100;

const emFoco = ref<(typeof dados.items)[number] | null>(null);
</script>

<template>
  <section ref="target" class="reveal" :class="{ in: inView }">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
      {{ t('priceLevel.kicker') }}
    </p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight  sm:text-4xl">
      {{ dados.title }}
    </h2>
    <p class="text-ink-dim mt-4 text-base leading-relaxed">{{ dados.intro }}</p>

    <div class="glass mt-8 rounded-3xl p-5 sm:p-7">
      <div class="border-line flex flex-wrap items-baseline gap-x-8 gap-y-2 border-b pb-4">
        <p class="text-ink-dim text-xs tracking-wider uppercase">
          {{ t('priceLevel.legend12') }} · <span class="text-ink">{{ dados.period.months12 }}</span>
        </p>
        <p class="text-ink-dim text-xs tracking-wider uppercase">
          {{ t('priceLevel.legend36') }} · <span class="text-ink">{{ dados.period.months36 }}</span>
        </p>
      </div>

      <ul class="mt-6 space-y-2.5">
        <li
          v-for="item in dados.items"
          :key="item.label"
          class="grid grid-cols-[128px_1fr_66px] items-center gap-2 sm:grid-cols-[146px_1fr_78px] sm:gap-3"
        >
          <button
            type="button"
            class="focus-visible:outline-dino truncate text-left text-xs outline-none focus-visible:outline-2 sm:text-sm"
            :class="item.vsGeneral >= 1.5 ? 'text-alert font-semibold' : 'text-ink'"
            :aria-label="t('priceLevel.barLabel', { item: item.label, p12: num(item.pct12, 2), p36: num(item.pct36) })"
            @mouseenter="emFoco = item"
            @mouseleave="emFoco = null"
            @focus="emFoco = item"
            @blur="emFoco = null"
          >
            {{ item.label }}
          </button>

          <span class="bg-line/40 relative h-5 w-full rounded-r-md">
            <span
              class="block h-full rounded-r-md"
              :class="item.vsGeneral >= 1.5 ? 'bg-alert/85' : 'bg-money/70'"
              :style="{ width: `${largura(item.pct36)}%`, opacity: emFoco && emFoco.label !== item.label ? 0.4 : 1 }"
            />
            <span
              aria-hidden="true"
              class="border-dino absolute top-[-3px] bottom-[-3px] border-l border-dashed"
              :style="{ left: `${linhaDoGeral}%` }"
            />
          </span>

          <span
            class="tabular shrink-0 text-right text-xs font-bold sm:text-sm"
            :class="item.vsGeneral >= 1.5 ? 'text-alert' : 'text-ink'"
          >
            +{{ num(item.pct36) }}%
          </span>
        </li>
      </ul>

      <div aria-live="polite" class="border-line mt-5 min-h-14 border-t pt-4 text-sm">
        <template v-if="emFoco">
          <p class="text-ink font-bold">{{ emFoco.label }}</p>
          <p class="text-ink-dim mt-1">
            {{ t('priceLevel.readout', { p12: num(emFoco.pct12, 2), p36: num(emFoco.pct36) }) }}
          </p>
        </template>
        <p v-else class="text-ink-dim text-xs">
          {{ t('priceLevel.hint', { general: num(dados.generalIndex.pct36) }) }}
        </p>
      </div>
    </div>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-5 sm:p-7">
      <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">{{ dados.punch }}</p>
      <p class="text-ink mt-4 leading-relaxed">{{ dados.question }}</p>
    </div>

    <p class="text-ink-dim mt-4 text-xs leading-relaxed">
      {{ dados.source }}
      <a :href="dados.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">
        {{ t('priceLevel.tableLink') }}
      </a>
    </p>
  </section>
</template>
