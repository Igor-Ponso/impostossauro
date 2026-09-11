<script setup lang="ts">
import fundsPt from '~/data/party-funds.json';
import taxDataPt from '~/data/tax-data.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

const { t, locale } = useI18n();
const { target, inView } = useInView(0.15);
const { formatCount } = useMoeda();

const dados = dadoNoIdioma('party-funds.json', fundsPt, locale.value);
const taxData = dadoNoIdioma('tax-data.json', taxDataPt, locale.value);
const num = (v: number, casas = 1) =>
  v.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

const somaDosFundos = dados.total.electoral + dados.total.party;
const maiorPartido = Math.max(...dados.parties.rows.map((r) => r.value));

const multiplicador = dados.raise.to / dados.raise.from;

const compraria = ['school', 'ubs', 'ambulance'].map((chave) => {
  const custo = taxData.referenceCosts[chave as keyof typeof taxData.referenceCosts];
  return { chave, quantos: Math.round((somaDosFundos * 1e9) / custo.unitCost), fonte: custo.source, url: custo.url };
});
</script>

<template>
  <section ref="target" class="reveal" :class="{ in: inView }">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">{{ t('funds.kicker') }}</p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight  sm:text-4xl">
      {{ dados.title }}
    </h2>
    <p class="text-ink-dim mt-4 text-base leading-relaxed">{{ dados.intro }}</p>

    <div class="glass mt-8 rounded-3xl p-6 sm:p-9">
      <p class="tabular font-display text-alert text-5xl leading-none font-bold sm:text-7xl">
        {{ num(somaDosFundos, 2) }}
      </p>
      <p class="text-ink-dim mt-2 text-xs tracking-wider uppercase">{{ dados.total.unit }}</p>
      <p class="font-display text-ink mt-3 text-lg font-bold sm:text-xl">{{ dados.total.label }}</p>

      <div class="border-line mt-6 grid gap-5 border-t pt-6 sm:grid-cols-2">
        <div>
          <p class="tabular font-display text-money text-2xl font-bold">{{ num(dados.total.electoral, 2) }}</p>
          <p class="text-ink-dim mt-1 text-xs">{{ t('funds.electoral') }}</p>
        </div>
        <div>
          <p class="tabular font-display text-money text-2xl font-bold">{{ num(dados.total.party, 1) }}</p>
          <p class="text-ink-dim mt-1 text-xs">{{ t('funds.party') }}</p>
        </div>
      </div>
      <p class="text-ink-dim mt-5 text-sm leading-relaxed">{{ dados.total.note }}</p>
    </div>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-5 sm:p-7">
      <h3 class="font-display text-alert text-lg font-bold sm:text-xl">{{ dados.raise.title }}</h3>
      <div class="mt-5 flex flex-wrap items-center gap-4 sm:gap-6">
        <p class="tabular font-display text-ink-dim text-3xl font-bold line-through sm:text-4xl">
          {{ num(dados.raise.from, 0) }}
        </p>
        <span aria-hidden="true" class="text-ink-dim text-2xl">→</span>
        <p class="tabular font-display text-alert text-4xl font-bold sm:text-5xl">{{ num(dados.raise.to) }}</p>
        <p class="text-alert text-sm font-semibold">{{ t('funds.times', { n: num(multiplicador, 1) }) }}</p>
      </div>
      <p class="text-ink-dim mt-1 text-xs tracking-wider uppercase">{{ dados.raise.unit }}</p>
      <p class="text-ink mt-5 leading-relaxed">{{ dados.raise.body }}</p>
      <a :href="dados.raise.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
        {{ dados.raise.source }}
      </a>
    </div>

    <SpotlightCard
      class="glass mt-6 !rounded-3xl !p-5 sm:!p-7"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">{{ dados.parties.title }}</h3>
      <p class="text-ink-dim mt-1 text-xs tracking-wider uppercase">{{ dados.parties.unit }}</p>

      <ul class="mt-5 space-y-2">
        <li
          v-for="linha in dados.parties.rows"
          :key="linha.party"
          class="grid grid-cols-[92px_1fr_56px] items-center gap-3 sm:grid-cols-[132px_1fr_66px] sm:gap-4"
        >
          <span class="text-ink truncate text-xs sm:text-sm">{{ linha.party }}</span>
          <span class="bg-line/40 block h-4 w-full rounded-r-md">
            <span class="bg-alert/80 block h-full rounded-r-md" :style="{ width: `${(linha.value / maiorPartido) * 100}%` }" />
          </span>
          <span class="tabular text-alert shrink-0 text-right text-xs font-bold sm:text-sm">
            {{ formatCount(linha.value) }}
          </span>
        </li>
      </ul>

      <p class="text-ink-dim mt-5 text-sm leading-relaxed">{{ dados.parties.note }}</p>
      <a :href="dados.parties.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
        {{ dados.parties.source }}
      </a>
    </SpotlightCard>

    <SpotlightCard
      class="glass mt-6 !rounded-3xl !p-5 sm:!p-7"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">
        {{ t('funds.buysTitle', { total: num(somaDosFundos, 2) }) }}
      </p>
      <ul class="mt-5 grid gap-5 sm:grid-cols-3">
        <li v-for="item in compraria" :key="item.chave">
          <p class="tabular font-display text-dino text-3xl leading-none font-bold sm:text-4xl">
            {{ formatCount(item.quantos) }}
          </p>
          <p class="text-ink mt-2 text-sm">{{ t(`equivalences.items.${item.chave}.label`) }}</p>
          <a :href="item.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-2 inline-block text-xs underline underline-offset-4">
            {{ item.fonte }}
          </a>
        </li>
      </ul>
    </SpotlightCard>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-6 sm:p-7">
      <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">{{ dados.question }}</p>
    </div>
  </section>
</template>
