<script setup lang="ts">
import companiesPt from '~/data/state-companies.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

const { t, locale } = useI18n();
const { converter, prefixo } = useMoeda();
const { target, inView } = useInView(0.15);

const dados = dadoNoIdioma('state-companies.json', companiesPt, locale.value);

const num = (v: number, casas = 1) =>
  converter(v).toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });
const inteiro = (v: number) => v.toLocaleString(locale.value);

const grupos = dados.groups;
const maiorRecebedor = Math.max(...dados.topReceivers.map((e) => e.receivedBi));
const maiorPagador = Math.max(...dados.topPayers.map((e) => e.dividendsToUnionBi));

</script>

<template>
  <section ref="target" class="reveal" :class="{ in: inView }">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">{{ t('stateCos.kicker') }}</p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight  sm:text-4xl">
      {{ dados.title }}
    </h2>
    <p class="text-ink-dim mt-4 text-base leading-relaxed">{{ dados.intro }}</p>

    <SpotlightCard
      class="glass mt-8 !rounded-3xl !p-6 sm:!p-9"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <p class="text-money text-xs font-semibold tracking-[0.2em] uppercase">{{ t('stateCos.announced') }}</p>
      <blockquote class="border-money/50 text-ink mt-3 border-l-2 pl-4 text-lg leading-snug font-semibold sm:text-xl">
        “{{ dados.announced.text }}”
      </blockquote>
      <a :href="dados.announced.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
        {{ dados.announced.source }}
      </a>

      <div class="border-line mt-8 border-t pt-7">
        <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">{{ t('stateCos.returned') }}</p>
        <p class="tabular font-display text-alert mt-3 text-5xl leading-none font-bold sm:text-7xl">
          {{ prefixo }}{{ num(dados.totals.dividendsToUnionBi, 1) }} bi
        </p>
        <p class="font-display text-ink mt-3 text-base font-bold sm:text-lg">
          {{ t('stateCos.returnedLabel') }}
        </p>
      </div>
    </SpotlightCard>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <div
        v-for="grupo in grupos"
        :key="grupo.key"
        class="glass rounded-3xl p-5 sm:p-7"
        :class="grupo.key === 'dependente' ? 'border-alert/30 border' : ''"
      >
        <p class="font-display text-ink text-lg font-bold sm:text-xl">
          {{ dados.groupLabels[grupo.key as keyof typeof dados.groupLabels] }}
        </p>
        <p class="tabular text-ink-dim mt-1 text-sm">
          {{ t('stateCos.companies', { n: grupo.count }) }} ·
          {{ t('stateCos.employees', { n: inteiro(grupo.employees) }) }}
        </p>

        <dl class="border-line mt-5 space-y-3 border-t pt-5 text-sm">
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-ink-dim">{{ t('stateCos.received') }}</dt>
            <dd class="tabular font-display font-bold" :class="grupo.receivedBi > 1 ? 'text-alert' : 'text-ink-dim'">
              {{ prefixo }}{{ num(grupo.receivedBi, 2) }} bi
            </dd>
          </div>
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-ink-dim">{{ t('stateCos.dividends') }}</dt>
            <dd class="tabular font-display font-bold" :class="grupo.dividendsToUnionBi > 0 ? 'text-chart-visible' : 'text-ink-dim'">
              {{ prefixo }}{{ num(grupo.dividendsToUnionBi, 2) }} bi
            </dd>
          </div>
          <div class="flex items-baseline justify-between gap-3">
            <dt class="text-ink-dim">{{ t('stateCos.profit') }}</dt>
            <dd class="tabular font-display font-bold" :class="grupo.profitBi < 0 ? 'text-alert' : 'text-ink'">
              {{ prefixo }}{{ num(grupo.profitBi, 2) }} bi
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-5 sm:p-7">
      <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">{{ t('stateCos.hiddenLabel') }}</p>
      <h3 class="font-display text-ink mt-3 text-lg font-bold sm:text-xl">{{ dados.hidden.title }}</h3>
      <p class="text-ink mt-3 leading-relaxed">{{ dados.hidden.text }}</p>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <div class="glass rounded-3xl p-5 sm:p-7">
        <h3 class="font-display text-ink text-base font-bold sm:text-lg">{{ dados.receiversLabel }}</h3>
        <ul class="mt-5 space-y-2.5">
          <li v-for="e in dados.topReceivers" :key="e.ticker" class="grid grid-cols-[104px_1fr_54px] items-center gap-2 sm:grid-cols-[136px_1fr_60px] sm:gap-3">
            <span class="text-ink truncate text-xs sm:text-sm">{{ e.ticker }}</span>
            <span class="bg-line/40 block h-3.5 w-full rounded-r-md">
              <span class="bg-alert/80 block h-full rounded-r-md" :style="{ width: `${(e.receivedBi / maiorRecebedor) * 100}%` }" />
            </span>
            <span class="tabular text-alert shrink-0 text-right text-xs font-bold">{{ num(e.receivedBi, 1) }}</span>
          </li>
        </ul>
        <p class="text-ink-dim mt-4 text-xs">{{ t('stateCos.unit') }}</p>
      </div>

      <SpotlightCard
        class="glass !rounded-3xl !p-5 sm:!p-7"
        spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
      >
        <h3 class="font-display text-ink text-base font-bold sm:text-lg">{{ dados.payersLabel }}</h3>
        <ul class="mt-5 space-y-2.5">
          <li v-for="e in dados.topPayers" :key="e.ticker" class="grid grid-cols-[104px_1fr_54px] items-center gap-2 sm:grid-cols-[136px_1fr_60px] sm:gap-3">
            <span class="text-ink truncate text-xs sm:text-sm">{{ e.ticker }}</span>
            <span class="bg-line/40 block h-3.5 w-full rounded-r-md">
              <span class="bg-chart-visible/80 block h-full rounded-r-md" :style="{ width: `${(e.dividendsToUnionBi / maiorPagador) * 100}%` }" />
            </span>
            <span class="tabular text-chart-visible shrink-0 text-right text-xs font-bold">{{ num(e.dividendsToUnionBi, 1) }}</span>
          </li>
        </ul>
        <p class="text-ink-dim mt-4 text-xs">{{ t('stateCos.unit') }}</p>
      </SpotlightCard>
    </div>

    <p class="text-ink-dim mt-5 text-xs leading-relaxed">
      {{ dados.exceptions.text }}
      <a :href="dados.url" target="_blank" rel="noopener" class="text-dino underline underline-offset-4">{{ dados.source }}</a>
    </p>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-6 sm:p-7">
      <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">{{ dados.question }}</p>
    </div>
  </section>
</template>
