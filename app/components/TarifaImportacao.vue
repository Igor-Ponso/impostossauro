<script setup lang="ts">
import tariffPt from '~/data/import-tariff.json';
const SpotlightCard = defineAsyncComponent(
  () => import('~/components/vb/SpotlightCard/SpotlightCard.vue'),
);

/**
 * Os 92,77% são o Exemplo 2.1 da própria Receita, não cálculo do site;
 * `tests/tarifaImportacao.spec.ts` refaz a aritmética a partir das alíquotas.
 */
const { t, locale } = useI18n();
const { target, inView } = useInView(0.15);

const dados = dadoNoIdioma('import-tariff.json', tariffPt, locale.value);
</script>

<template>
  <section ref="target" class="reveal" :class="{ in: inView }">
    <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
      {{ t('importTariff.kicker') }}
    </p>
    <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight  sm:text-4xl">
      {{ dados.title }}
    </h2>
    <p class="text-ink-dim mt-4 text-base leading-relaxed">{{ dados.intro }}</p>

    <QuoteContrast
      class="mt-8"
      :quote="dados.quote"
      :receipts="dados.receipts.map((r) => ({ ...r, direction: r.direction === 'up' ? 'up' : r.direction === 'down' ? 'down' : 'flat' }))"
      :question="dados.question"
    />

    <SpotlightCard
      class="glass mt-6 !rounded-3xl !p-5 sm:!p-7"
      spotlight-color="color-mix(in oklab, var(--color-money) 20%, transparent)"
    >
      <h3 class="font-display text-ink text-lg font-bold sm:text-xl">{{ dados.phones.title }}</h3>
      <blockquote class="border-money/50 text-ink-dim mt-4 border-l-2 pl-4 text-sm leading-relaxed italic">
        “{{ dados.phones.legalText }}”
      </blockquote>
      <p class="text-ink-dim mt-4 text-sm leading-relaxed sm:text-base">{{ dados.phones.body }}</p>
      <a
        :href="dados.phones.url"
        target="_blank"
        rel="noopener"
        class="text-ink-dim hover:text-dino mt-3 inline-block text-xs underline underline-offset-4"
      >{{ dados.phones.source }}</a>
    </SpotlightCard>
  </section>
</template>
