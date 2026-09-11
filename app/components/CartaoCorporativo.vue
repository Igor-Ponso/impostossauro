<script setup lang="ts">
import cardPt from '~/data/corporate-card.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

/**
 * Fonte: os arquivos abertos do Portal da Transparência (a API exige chave).
 * Agregado por órgão, nunca por portador: o arquivo traz nome de pessoa.
 */
const { t, locale } = useI18n();
const { converter, prefixo } = useMoeda();
const { target, inView } = useInView(0.15);

const dados = dadoNoIdioma('corporate-card.json', cardPt, locale.value);

const num = (v: number, casas = 1) =>
  converter(v).toLocaleString(locale.value, { minimumFractionDigits: casas, maximumFractionDigits: casas });
const inteiro = (v: number) => v.toLocaleString(locale.value);

const maiorTotal = Math.max(...dados.byOrg.map((o) => o.totalMi));

/** Split, nunca `v-html`: o texto vem de JSON de dado. */
const pedacos = computed(() => {
  const { text, highlight } = dados.mirror;
  const corte = text.indexOf(highlight);
  if (corte < 0) return [{ texto: text, marcado: false }];
  return [
    { texto: text.slice(0, corte), marcado: false },
    { texto: highlight, marcado: true },
    { texto: text.slice(corte + highlight.length), marcado: false },
  ].filter((p) => p.texto.length > 0);
});
</script>

<template>
  <section ref="target" class="reveal" :class="{ in: inView }">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">{{ t('card.kicker') }}</p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight  sm:text-4xl">
      {{ dados.title }}
    </h2>
    <p class="text-ink-dim mt-4 text-base leading-relaxed">{{ dados.intro }}</p>

    <div class="border-alert/30 bg-alert/5 mt-8 rounded-3xl border p-6 sm:p-9">
      <p class="tabular font-display text-alert text-6xl leading-none font-bold sm:text-8xl">
        {{ num(dados.opaquePct, 0) }}%
      </p>
      <p class="font-display text-ink mt-4 text-lg font-bold sm:text-xl">
        {{ t('card.opaqueHeadline', { year: dados.year, total: num(dados.totalMi, 1), n: inteiro(dados.transactions) }) }}
      </p>

      <div class="border-line mt-8 grid gap-6 border-t pt-7 sm:grid-cols-2">
        <div>
          <p class="tabular font-display text-alert text-3xl font-bold sm:text-4xl">
            {{ prefixo }}{{ num(dados.secretMi, 1) }} mi
          </p>
          <p class="text-ink-dim mt-1 text-sm leading-relaxed">{{ dados.secretLabel }}</p>
        </div>
        <div>
          <p class="tabular font-display text-money text-3xl font-bold sm:text-4xl">
            {{ prefixo }}{{ num(dados.cashMi, 1) }} mi
          </p>
          <p class="text-ink-dim mt-1 text-sm leading-relaxed">{{ dados.cashLabel }}</p>
        </div>
      </div>
    </div>

    <SpotlightCard
      class="glass mt-6 !rounded-3xl !p-6 sm:!p-9"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <p class="font-display text-ink text-xl leading-relaxed font-bold sm:text-2xl">
        <template v-for="(pedaco, i) in pedacos" :key="i"><span
          v-if="pedaco.marcado"
          class="marca-texto text-alert -mx-0.5 px-1"
        >{{ pedaco.texto }}</span><template v-else>{{ pedaco.texto }}</template></template>
      </p>
      <a :href="dados.mirror.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-4 inline-block text-xs underline underline-offset-4">
        {{ dados.mirror.source }}
      </a>
    </SpotlightCard>

    <div class="glass mt-6 rounded-3xl p-5 sm:p-7">
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">{{ dados.byOrgTitle }}</h3>

      <ul class="mt-6 space-y-3">
        <li
          v-for="o in dados.byOrg"
          :key="o.org"
          class="grid grid-cols-[1fr_58px] items-center gap-3 sm:grid-cols-[268px_1fr_64px] sm:gap-4"
        >
          <span class="text-ink truncate text-xs sm:text-sm">{{ o.org }}</span>
          <span class="bg-line/40 hidden h-4 w-full rounded-r-md sm:block">
            <span class="bg-line block h-full rounded-r-md" :style="{ width: `${(o.totalMi / maiorTotal) * 100}%` }">
              <span class="bg-alert/85 block h-full rounded-r-md" :style="{ width: `${o.pct}%` }" />
            </span>
          </span>
          <span class="tabular text-alert shrink-0 text-right text-xs font-bold sm:text-sm">
            {{ num(o.pct, 1) }}%
          </span>
        </li>
      </ul>
      <p class="text-ink-dim mt-4 text-xs">{{ t('card.barLegend') }}</p>

      <p class="font-display text-ink mt-6 text-lg leading-relaxed font-bold sm:text-xl">
        {{ dados.punch }}
      </p>
    </div>

    <SpotlightCard
      class="glass mt-6 !rounded-3xl !p-5 sm:!p-7"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <h3 class="font-display text-ink text-base font-bold sm:text-lg">{{ dados.cashTitle }}</h3>
      <ul class="mt-5 space-y-2.5">
        <li
          v-for="o in dados.byCash"
          :key="o.org"
          class="grid grid-cols-[1fr_130px] items-baseline gap-3 sm:grid-cols-[1fr_150px]"
        >
          <span class="text-ink-dim truncate text-xs sm:text-sm">{{ o.org }}</span>
          <span class="tabular text-money text-right text-xs font-bold sm:text-sm">
            {{ prefixo }}{{ num(o.cashMi, 2) }} mi · {{ num(o.pct, 1) }}%
          </span>
        </li>
      </ul>
    </SpotlightCard>

    <div class="glass mt-6 rounded-3xl p-5 sm:p-7">
      <p class="text-ink-dim text-xs font-semibold tracking-[0.18em] uppercase">{{ dados.honesty.title }}</p>
      <p class="text-ink-dim mt-3 text-sm leading-relaxed sm:text-base">{{ dados.honesty.text }}</p>
      <a :href="dados.url" target="_blank" rel="noopener" class="text-ink-dim hover:text-dino mt-4 inline-block text-xs underline underline-offset-4">
        {{ dados.source }}
      </a>
    </div>

    <div class="border-alert/30 bg-alert/5 mt-6 rounded-3xl border p-6 sm:p-7">
      <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">{{ dados.question }}</p>
    </div>
  </section>
</template>
