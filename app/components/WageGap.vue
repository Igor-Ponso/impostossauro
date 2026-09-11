<script setup lang="ts">
import wagesPt from '~/data/wages.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

/**
 * A peça publica o nível (um mandato em salários mínimos por mês), não a variação:
 * corrigida pela inflação, a comparação de aumentos inverte o sinal.
 */
const { t, locale } = useI18n();
const { converter, prefixo } = useMoeda();
const { target, inView } = useInView(0.3);

const wages = dadoNoIdioma('wages.json', wagesPt, locale.value);

const brl = (v: number) =>
  converter(v).toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v: number, casas = 0) =>
  v.toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });

const nivel = wages.level;
</script>

<template>
  <section id="o-aumento" ref="target" class="border-line bg-surface border-y">
    <div class="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <p class="text-alert text-sm font-semibold tracking-[0.2em] uppercase sm:text-base">
        {{ t('wageGap.kicker') }}
      </p>
      <h2 class="font-display text-ink mt-3 text-3xl font-bold tracking-tight  sm:text-5xl">
        {{ wages.title }}
      </h2>
      <p class="text-ink-dim mt-4 text-lg leading-relaxed">{{ wages.intro }}</p>

      <div class="glass reveal mt-10 rounded-3xl p-6 sm:p-9" :class="{ in: inView }">
        <p class="tabular font-display text-alert text-6xl leading-none font-bold sm:text-8xl">
          {{ num(nivel.timesTotal, 0) }}×
        </p>
        <p class="font-display text-ink mt-4 text-lg font-bold sm:text-xl">
          {{ t('wageGap.levelHeadline') }}
        </p>

        <div class="border-line mt-8 grid gap-6 border-t pt-7 sm:grid-cols-2">
          <div>
            <p class="tabular font-display text-alert text-3xl font-bold sm:text-4xl">
              {{ prefixo }}{{ brl(nivel.mandateBrl) }}
            </p>
            <p class="text-ink-dim mt-1 text-sm">{{ nivel.mandateLabel }}</p>
          </div>
          <div>
            <p class="tabular font-display text-chart-visible text-3xl font-bold sm:text-4xl">
              {{ prefixo }}{{ brl(nivel.minimumBrl) }}
            </p>
            <p class="text-ink-dim mt-1 text-sm">{{ nivel.minimumLabel }}</p>
          </div>
        </div>
        <p class="text-ink-dim mt-6 text-sm leading-relaxed">{{ nivel.note }}</p>
      </div>

      <SpotlightCard
        class="glass mt-6 !rounded-3xl !p-5 sm:!p-7"
        spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
      >
        <h3 class="font-display text-ink text-lg font-bold sm:text-xl">{{ wages.perks.title }}</h3>
        <p class="text-ink-dim mt-3 leading-relaxed">{{ wages.perks.intro }}</p>

        <ul class="mt-6 space-y-4">
          <li
            v-for="item in wages.perks.items"
            :key="item.key"
            class="border-line grid gap-1 border-t pt-4 first:border-0 first:pt-0 sm:grid-cols-[176px_1fr]"
          >
            <div>
              <p class="tabular font-display text-lg font-bold" :class="item.destino === 'bolso' ? 'text-alert' : 'text-money'">
                {{ prefixo }}{{ brl(item.brl) }}<template v-if="item.brlMax"><span class="text-ink-dim text-sm font-normal">&nbsp;a {{ prefixo }}{{ brl(item.brlMax) }}</span></template>
              </p>
              <p class="text-ink-dim mt-0.5 text-xs tracking-wider uppercase">
                {{ wages.perks.destinoLabels[item.destino as keyof typeof wages.perks.destinoLabels] }}
              </p>
            </div>
            <div>
              <p class="text-ink text-sm font-semibold">{{ item.label }}</p>
              <p class="text-ink-dim mt-1 text-sm leading-relaxed">{{ item.note }}</p>
              <a :href="item.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-1 inline-block text-xs underline underline-offset-4">
                {{ item.source }}
              </a>
            </div>
          </li>
        </ul>

        <p class="tabular font-display text-alert mt-6 text-2xl font-bold sm:text-3xl">
          {{ prefixo }}{{ brl(nivel.pocketBrl) }}
        </p>
        <p class="text-ink-dim mt-1 text-sm">{{ t('wageGap.perksPocket', { n: num(nivel.timesPocket, 0) }) }}</p>

        <div class="border-line mt-6 border-t pt-5">
          <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">{{ wages.perks.honesty.title }}</p>
          <p class="text-ink-dim mt-2 text-sm leading-relaxed">{{ wages.perks.honesty.text }}</p>
        </div>
      </SpotlightCard>

      <SpotlightCard
        class="glass mt-6 !rounded-3xl !p-5 sm:!p-7"
        spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
      >
        <h3 class="font-display text-ink text-base font-bold sm:text-lg">{{ wages.stepsTitle }}</h3>
        <ul class="mt-5 space-y-4">
          <li v-for="(degrau, i) in wages.steps" :key="i" class="border-line grid gap-1 border-t pt-4 first:border-0 first:pt-0 sm:grid-cols-[142px_1fr]">
            <p class="tabular font-display text-money text-lg font-bold">{{ prefixo }}{{ brl(degrau.brl) }}</p>
            <div>
              <p class="text-ink text-sm font-semibold">{{ degrau.act }}</p>
              <p class="text-ink-dim mt-1 text-sm leading-relaxed">{{ degrau.note }}</p>
              <a :href="degrau.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-1 inline-block text-xs underline underline-offset-4">
                {{ degrau.source }}<template v-if="degrau.verified === 'imprensa'"> · {{ t('wageGap.pressNote') }}</template>
              </a>
            </div>
          </li>
        </ul>
        <p class="text-ink-dim mt-5 text-xs leading-relaxed">{{ wages.rule }}</p>
      </SpotlightCard>

      <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-6 sm:p-7">
        <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">{{ wages.perks.question }}</p>
      </div>

      <ul class="text-ink-dim mt-8 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <li v-for="fonte in wages.sources" :key="fonte.url">
          <a :href="fonte.url" target="_blank" rel="noopener" class="hover:text-ink underline underline-offset-4">
            {{ fonte.label }}
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>
