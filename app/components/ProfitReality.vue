<script setup lang="ts">
import companiesPt from '~/data/companies.json';

const { t, locale } = useI18n();

const companies = dadoNoIdioma('companies.json', companiesPt, locale.value);

interface Company {
  key: string;
  name: string;
  sector: string;
  year: string;
  revenueLabel: string;
  profitLabel: string;
  netMarginPct: number;
  note?: string;
  source: string;
  url: string;
}

const list = (companies.companies as Company[]).slice().sort((a, b) => a.netMarginPct - b.netMarginPct);

const { target, inView } = useInView(0.15);

const perHundred = (pct: number) => (pct).toLocaleString(locale.value, { maximumFractionDigits: 2 });

/** Mínimo visível: abaixo de 1,2% a fatia do lucro some da barra. */
const profitWidth = (pct: number) => Math.max(1.2, pct);
</script>

<template>
  <div v-if="list.length" ref="target" class="space-y-4">
    <article
      v-for="(company, index) in list"
      :key="company.key"
      class="glass reveal rounded-3xl p-5 sm:p-6"
      :class="{ in: inView }"
      :style="{ transitionDelay: `${index * 80}ms` }"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 class="font-display text-ink text-lg font-bold sm:text-xl">
          {{ company.name }}
        </h3>
        <p class="text-ink-dim text-xs">{{ company.sector }} · {{ company.year }}</p>
      </div>

      <div class="tabular mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <span class="text-ink-dim text-sm">
          {{ t('profit.revenue') }}
          <b class="text-ink ml-1 text-lg">{{ company.revenueLabel }}</b>
        </span>
        <span class="text-ink-dim text-sm">
          {{ t('profit.profit') }}
          <b class="text-money ml-1 text-lg">{{ company.profitLabel }}</b>
        </span>
      </div>

      <div class="border-line mt-4 flex h-9 w-full overflow-hidden rounded-xl border">
        <div
          class="bg-alert/25 flex items-center px-3 text-xs font-semibold"
          :style="{ width: `${100 - profitWidth(company.netMarginPct)}%` }"
        >
          <span class="text-ink truncate">{{ t('profit.costs') }}</span>
        </div>
        <div
          class="bg-money flex items-center justify-center"
          :style="{ width: `${profitWidth(company.netMarginPct)}%` }"
          :title="t('profit.profit')"
        />
      </div>

      <p class="text-ink mt-3 leading-relaxed">
        {{ t('profit.perHundred', { value: perHundred(company.netMarginPct) }) }}
      </p>
      <p v-if="company.note" class="text-ink-dim mt-2 text-sm leading-relaxed">
        {{ company.note }}
      </p>
      <a
        :href="company.url"
        target="_blank"
        rel="noopener"
        class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4"
      >
        {{ t('equivalences.sourcePrefix') }}: {{ company.source }}
      </a>
    </article>
  </div>
</template>
