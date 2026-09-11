<script setup lang="ts">
import businessPt from '~/data/business-closures.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

const { t, locale } = useI18n();
const { target, inView } = useInView(0.15);

const dados = dadoNoIdioma('business-closures.json', businessPt, locale.value);
const { formatCount } = useMoeda();
const num = (v: number, casas = 1) =>
  v.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

const altaAnual = ((dados.closures.value - dados.closures.previous) / dados.closures.previous) * 100;
</script>

<template>
  <section ref="target" class="reveal" :class="{ in: inView }">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
      {{ t('closures.kicker') }}
    </p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight  sm:text-4xl">
      {{ dados.title }}
    </h2>
    <p class="text-ink-dim mt-4 text-base leading-relaxed">{{ dados.intro }}</p>

    <div class="glass mt-8 rounded-3xl p-6 sm:p-9">
      <p class="tabular font-display text-alert text-5xl leading-none font-bold sm:text-7xl">
        {{ formatCount(dados.closures.value) }}
      </p>
      <p class="font-display text-ink mt-3 text-lg font-bold sm:text-2xl">{{ dados.closures.label }}</p>
      <p class="text-ink-dim mt-1 text-sm">{{ dados.closures.period }}</p>

      <div class="border-line mt-6 grid gap-5 border-t pt-6 sm:grid-cols-3">
        <div>
          <p class="tabular font-display text-ink text-2xl font-bold">+{{ num(altaAnual) }}%</p>
          <p class="text-ink-dim mt-1 text-xs">{{ t('closures.vsYear') }}</p>
        </div>
        <div>
          <p class="tabular font-display text-ink text-2xl font-bold">+{{ num(dados.closures.quarterGrowthPct) }}%</p>
          <p class="text-ink-dim mt-1 text-xs">{{ t('closures.vsQuarter') }}</p>
        </div>
        <div>
          <p class="tabular font-display text-ink text-2xl font-bold">{{ formatCount(dados.closures.previous) }}</p>
          <p class="text-ink-dim mt-1 text-xs">{{ dados.closures.previousLabel }}</p>
        </div>
      </div>

      <p class="text-ink-dim mt-5 text-sm leading-relaxed">{{ dados.closures.note }}</p>
      <a :href="dados.closures.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
        {{ dados.closures.source }}
      </a>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <div class="glass rounded-3xl p-5 sm:p-6">
        <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">{{ t('closures.whoTitle') }}</p>
        <ul class="mt-4 space-y-4">
          <li v-for="linha in dados.breakdown" :key="linha.label">
            <div class="flex items-baseline justify-between gap-3">
              <span class="text-ink text-sm font-semibold">{{ linha.label }}</span>
              <span class="tabular text-alert text-lg font-bold">{{ num(linha.pct) }}%</span>
            </div>
            <span class="bg-line/40 mt-2 block h-2 w-full rounded-r-md">
              <span class="bg-alert/80 block h-full rounded-r-md" :style="{ width: `${linha.pct}%` }" />
            </span>
            <p class="text-ink-dim mt-2 text-xs leading-relaxed">{{ linha.note }}</p>
          </li>
        </ul>
      </div>

      <SpotlightCard
        class="glass !rounded-3xl !p-5 sm:!p-6"
        spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
      >
        <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">{{ t('closures.whereTitle') }}</p>
        <ul class="mt-4 space-y-4">
          <li v-for="setor in dados.sectors" :key="setor.label">
            <div class="flex items-baseline justify-between gap-3">
              <span class="text-ink text-sm font-semibold">{{ setor.label }}</span>
              <span class="tabular text-ink text-lg font-bold">{{ formatCount(setor.value) }}</span>
            </div>
            <span class="bg-line/40 mt-2 block h-2 w-full rounded-r-md">
              <span class="bg-money/70 block h-full rounded-r-md" :style="{ width: `${setor.pct}%` }" />
            </span>
            <p class="text-ink-dim mt-2 text-xs">{{ num(setor.pct) }}% {{ t('closures.ofTotal') }}</p>
          </li>
        </ul>
        <div class="border-line mt-5 border-t pt-4">
          <p class="tabular font-display text-alert text-2xl font-bold">
            {{ formatCount(dados.default.value) }}
          </p>
          <p class="text-ink-dim mt-2 text-xs leading-relaxed">{{ dados.default.label }}</p>
          <a :href="dados.default.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
            {{ dados.default.source }}
          </a>
        </div>
      </SpotlightCard>
    </div>

    <div class="border-money/30 bg-money/5 mt-6 rounded-3xl border p-5 sm:p-7">
      <h3 class="font-display text-money text-lg font-bold sm:text-xl">{{ dados.banks.title }}</h3>
      <div class="mt-5 flex flex-wrap items-end gap-8 sm:gap-14">
        <div>
          <p class="tabular font-display text-money text-3xl leading-none font-bold sm:text-5xl">
            {{ num(dados.banks.fourBanks) }}
          </p>
          <p class="text-ink-dim mt-2 text-xs">{{ t('closures.fourBanks') }}</p>
        </div>
        <div>
          <p class="tabular font-display text-money text-3xl leading-none font-bold sm:text-5xl">
            {{ num(dados.banks.privateThree, 2) }}
          </p>
          <p class="text-ink-dim mt-2 text-xs">{{ t('closures.privateThree') }}</p>
        </div>
        <div>
          <p class="tabular font-display text-money text-3xl leading-none font-bold sm:text-5xl">
            {{ num(dados.banks.itau) }}
          </p>
          <p class="text-ink-dim mt-2 text-xs">{{ t('closures.itau') }}</p>
        </div>
      </div>
      <p class="text-ink mt-5 text-sm leading-relaxed">{{ dados.banks.body }}</p>
      <a :href="dados.banks.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
        {{ dados.banks.source }}
      </a>
    </div>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-6 sm:p-7">
      <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">{{ dados.question }}</p>
    </div>
  </section>
</template>
