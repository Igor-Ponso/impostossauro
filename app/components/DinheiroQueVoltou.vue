<script setup lang="ts">
import leniencyPt from '~/data/leniency.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

/**
 * A divergência TCU × STF sobre o desconto da repactuação é fato, não ressalva:
 * as duas fontes são oficiais e o julgamento está suspenso; publicam-se as duas.
 */
const { t, locale } = useI18n();
const { target, inView } = useInView(0.15);

const dados = dadoNoIdioma('leniency.json', leniencyPt, locale.value);
const num = (v: number, casas = 1) =>
  v.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

const pagoPct = (dados.odebrecht.paid / dados.odebrecht.debt) * 100;
</script>

<template>
  <section ref="target" class="reveal" :class="{ in: inView }">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
      {{ t('leniency.kicker') }}
    </p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight  sm:text-4xl">
      {{ dados.title }}
    </h2>
    <p class="text-ink-dim mt-4 text-base leading-relaxed">{{ dados.intro }}</p>

    <div class="glass mt-8 rounded-3xl p-6 sm:p-9">
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">{{ dados.odebrecht.title }}</h3>

      <div class="mt-6 grid gap-6 sm:grid-cols-3">
        <div>
          <p class="text-ink-dim text-xs tracking-wider uppercase">{{ t('leniency.owed') }}</p>
          <p class="tabular font-display text-ink mt-2 text-3xl leading-none font-bold sm:text-5xl">
            {{ num(dados.odebrecht.debt) }}
          </p>
          <p class="text-ink-dim mt-1 text-xs">{{ t('leniency.billions') }}</p>
        </div>
        <div>
          <p class="text-ink-dim text-xs tracking-wider uppercase">
            {{ t('leniency.paidIn', { years: dados.odebrecht.years }) }}
          </p>
          <p class="tabular font-display text-alert mt-2 text-3xl leading-none font-bold sm:text-5xl">
            {{ num(dados.odebrecht.paid, 3) }}
          </p>
          <p class="text-alert mt-1 text-xs font-semibold">
            {{ t('leniency.paidPct', { pct: num(pagoPct) }) }}
          </p>
        </div>
        <div>
          <p class="text-ink-dim text-xs tracking-wider uppercase">{{ t('leniency.became') }}</p>
          <p class="tabular font-display text-money mt-2 text-3xl leading-none font-bold sm:text-5xl">
            {{ num(dados.odebrecht.renegotiated) }}
          </p>
          <p class="text-ink-dim mt-1 text-xs">{{ t('leniency.billions') }}</p>
        </div>
      </div>

      <!-- A barra nasce na largura final: largura de barra é dado, não anima. -->
      <div class="bg-line/40 mt-7 h-5 w-full overflow-hidden rounded-r-md">
        <div class="bg-alert h-full rounded-r-md" :style="{ width: `${pagoPct}%` }" />
      </div>
      <p class="text-ink-dim mt-2 text-xs">{{ t('leniency.barLegend', { pct: num(pagoPct) }) }}</p>

      <p class="text-ink-dim mt-5 text-sm leading-relaxed">{{ dados.odebrecht.body }}</p>
      <a :href="dados.odebrecht.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
        {{ dados.odebrecht.source }}
      </a>
    </div>

    <SpotlightCard
      class="glass mt-6 !rounded-3xl !p-5 sm:!p-7"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">{{ t('leniency.sevenTitle') }}</p>
      <ul class="mt-4 flex flex-wrap gap-2">
        <li
          v-for="empresa in dados.companies"
          :key="empresa"
          class="border-line text-ink rounded-full border px-3 py-1.5 text-sm"
        >
          {{ empresa }}
        </li>
      </ul>
      <p class="text-ink-dim mt-4 text-sm">{{ dados.companiesNote }}</p>
    </SpotlightCard>

    <div class="border-money/30 bg-money/5 mt-6 rounded-3xl border p-5 sm:p-7">
      <h3 class="font-display text-money text-lg font-bold sm:text-xl">{{ dados.taxCredit.title }}</h3>
      <p class="text-ink mt-3 leading-relaxed">{{ dados.taxCredit.body }}</p>
      <a :href="dados.taxCredit.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
        {{ dados.taxCredit.source }}
      </a>
    </div>

    <div class="border-line bg-card/60 mt-6 rounded-3xl border p-5 sm:p-7">
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">{{ dados.divergence.title }}</h3>
      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <div class="border-alert/40 border-l-2 pl-4">
          <p class="text-alert text-xs font-semibold tracking-wider uppercase">TCU</p>
          <p class="text-ink mt-2 text-sm leading-relaxed">{{ dados.divergence.tcu.text }}</p>
          <a :href="dados.divergence.tcu.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
            {{ dados.divergence.tcu.source }}
          </a>
        </div>
        <div class="border-dino/40 border-l-2 pl-4">
          <p class="text-dino text-xs font-semibold tracking-wider uppercase">STF</p>
          <p class="text-ink mt-2 text-sm leading-relaxed">{{ dados.divergence.stf.text }}</p>
          <a :href="dados.divergence.stf.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
            {{ dados.divergence.stf.source }}
          </a>
        </div>
      </div>
      <p class="text-ink-dim mt-5 text-sm leading-relaxed">{{ dados.divergence.note }}</p>
    </div>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-6 sm:p-7">
      <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">{{ dados.question }}</p>
    </div>
  </section>
</template>
