<script setup lang="ts">
import publicityPt from '~/data/publicity.json';
import taxDataPt from '~/data/tax-data.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

/**
 * Duas réguas oficiais que medem coisas diferentes: governo + estatais (Poder360,
 * corrigido pela inflação) e o orçamento de publicidade sozinho, ano a ano.
 */
const { t, locale } = useI18n();
const { target, inView } = useInView(0.15);
const { formatCount } = useMoeda();

const dados = dadoNoIdioma('publicity.json', publicityPt, locale.value);
const taxData = dadoNoIdioma('tax-data.json', taxDataPt, locale.value);
const num = (v: number, casas = 1) =>
  v.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

const anos = dados.rulers.narrow.years;
const maiorAno = Math.max(...anos.map((a) => a.value));
const maiorPorAno = Math.max(...dados.rulers.broad.rows.map((r) => r.perYear));

const gastoAnual = dados.rulers.broad.rows[0]!.perYear * 1e9;
const compraria = ['school', 'ubs', 'ambulance'].map((chave) => {
  const custo = taxData.referenceCosts[chave as keyof typeof taxData.referenceCosts];
  return { chave, quantos: Math.round(gastoAnual / custo.unitCost), fonte: custo.source, url: custo.url };
});
</script>

<template>
  <section ref="target" class="reveal" :class="{ in: inView }">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">{{ t('publicity.kicker') }}</p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight  sm:text-4xl">
      {{ dados.title }}
    </h2>
    <p class="text-ink-dim mt-4 text-base leading-relaxed">{{ dados.intro }}</p>

    <div class="mt-8 grid gap-4 lg:grid-cols-2">
      <SpotlightCard
        class="glass !rounded-3xl !p-5 sm:!p-7"
        spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
      >
        <p class="font-display text-ink text-lg font-bold">{{ dados.rulers.broad.label }}</p>
        <p class="text-ink-dim mt-2 text-sm leading-relaxed">{{ dados.rulers.broad.explain }}</p>

        <ul class="mt-6 space-y-5">
          <li v-for="linha in dados.rulers.broad.rows" :key="linha.who">
            <div class="flex items-baseline justify-between gap-3">
              <span class="text-ink text-sm font-semibold">{{ linha.who }}</span>
              <span class="tabular font-display text-money text-2xl font-bold sm:text-3xl">
                {{ num(linha.perYear) }}
              </span>
            </div>
            <span class="bg-line/40 mt-2 block h-3 w-full rounded-r-md">
              <span class="bg-money/80 block h-full rounded-r-md" :style="{ width: `${(linha.perYear / maiorPorAno) * 100}%` }" />
            </span>
            <p class="text-ink-dim mt-2 text-xs">{{ linha.note }}</p>
          </li>
        </ul>
        <p class="text-ink-dim mt-2 text-xs tracking-wider uppercase">{{ dados.rulers.broad.unit }}</p>

        <p class="text-ink mt-5 text-sm leading-relaxed">{{ dados.rulers.broad.finding }}</p>
        <a :href="dados.rulers.broad.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4">
          {{ dados.rulers.broad.source }}
        </a>
      </SpotlightCard>

      <div class="glass rounded-3xl p-5 sm:p-7">
        <p class="font-display text-ink text-lg font-bold">{{ dados.rulers.narrow.label }}</p>
        <p class="text-ink-dim mt-2 text-sm leading-relaxed">{{ dados.rulers.narrow.explain }}</p>

        <ul class="mt-6 space-y-3">
          <li
            v-for="ano in anos"
            :key="ano.year"
            class="grid grid-cols-[46px_1fr_66px] items-center gap-3"
          >
            <span
              class="tabular text-xs sm:text-sm"
              :class="naPandemia(ano.year) ? 'text-alert font-semibold' : 'text-ink-dim'"
            >{{ ano.year }}</span>
            <span class="bg-line/40 block h-4 w-full rounded-r-md">
              <span
                class="block h-full rounded-r-md"
                :class="naPandemia(ano.year) ? 'bg-alert/80' : 'bg-money/70'"
                :style="{ width: `${(ano.value / maiorAno) * 100}%` }"
              />
            </span>
            <span class="tabular text-ink shrink-0 text-right text-xs font-bold sm:text-sm">
              {{ formatCount(ano.value) }}
            </span>
          </li>
        </ul>
        <p class="text-ink-dim mt-2 text-xs tracking-wider uppercase">{{ dados.rulers.narrow.unit }}</p>

        <ul class="mt-4 space-y-1">
          <li v-for="ano in anos.filter((a) => a.note)" :key="ano.year" class="text-ink-dim text-xs leading-relaxed">
            <b class="text-ink">{{ ano.year }}</b> — {{ ano.note }}
          </li>
        </ul>
        <a :href="dados.rulers.narrow.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-4 inline-block text-xs underline underline-offset-4">
          {{ dados.rulers.narrow.source }}
        </a>
      </div>
    </div>

    <SpotlightCard
      class="glass mt-6 !rounded-3xl !p-5 sm:!p-7"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">{{ t('publicity.buysTitle') }}</p>
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
      <p class="text-ink-dim mt-4 text-xs">{{ t('publicity.buysNote') }}</p>
    </SpotlightCard>

    <div class="border-money/40 bg-money/5 mt-6 rounded-3xl border p-6 sm:p-9">
      <h3 class="font-display text-money text-xl font-bold sm:text-3xl">{{ dados.transparency.title }}</h3>

      <div class="mt-7 grid gap-7 sm:grid-cols-2 sm:gap-10">
        <div>
          <p class="tabular font-display text-money text-4xl leading-none font-bold sm:text-6xl">
            {{ num(dados.transparency.cost) }}
          </p>
          <p class="text-ink-dim mt-2 text-xs tracking-wider uppercase">{{ dados.transparency.costUnit }}</p>
          <p class="text-ink mt-3 text-sm leading-relaxed">{{ dados.transparency.costLabel }}</p>
        </div>
        <div class="border-line sm:border-l sm:pl-10">
          <p class="tabular font-display text-alert text-4xl leading-none font-bold sm:text-6xl">
            {{ num(dados.transparency.watched) }}
          </p>
          <p class="text-ink-dim mt-2 text-xs tracking-wider uppercase">{{ dados.transparency.watchedUnit }}</p>
          <p class="text-ink mt-3 text-sm leading-relaxed">{{ dados.transparency.watchedLabel }}</p>
        </div>
      </div>

      <ol class="mt-8">
        <li
          v-for="(passo, indice) in dados.transparency.timeline"
          :key="passo.when"
          class="grid grid-cols-[18px_1fr] gap-4 sm:grid-cols-[22px_1fr] sm:gap-5"
        >
          <div class="relative flex flex-col items-center pt-1">
            <span
              v-if="indice < dados.transparency.timeline.length - 1"
              aria-hidden="true"
              class="bg-line absolute top-3 bottom-0 left-1/2 w-px -translate-x-1/2"
            />
            <span
              aria-hidden="true"
              class="relative h-2.5 w-2.5 shrink-0 rounded-full"
              :style="{ background: indice === dados.transparency.timeline.length - 1 ? 'var(--color-alert)' : 'var(--color-ink-dim)' }"
            />
          </div>
          <div :class="indice === dados.transparency.timeline.length - 1 ? 'pb-0' : 'pb-6'">
            <p class="tabular text-ink text-xs font-bold tracking-wider uppercase">{{ passo.when }}</p>
            <p class="text-ink-dim mt-1 text-sm leading-relaxed">{{ passo.what }}</p>
          </div>
        </li>
      </ol>

      <p class="border-money/30 text-money mt-7 border-t pt-5 text-lg leading-relaxed font-bold sm:text-2xl">
        {{ dados.transparency.punch }}
      </p>

      <a :href="dados.transparency.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-4 inline-block text-xs underline underline-offset-4">
        {{ dados.transparency.source }}
      </a>
    </div>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-6 sm:p-7">
      <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">{{ dados.question }}</p>
    </div>
  </section>
</template>
