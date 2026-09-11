<script setup lang="ts">
import journeyPt from '~/data/journey.json';

const { t, locale } = useI18n();

const journey = dadoNoIdioma('journey.json', journeyPt, locale.value);

usePaginaSeo({ titulo: t('journey.pageTitle'), descricao: t('journey.tldr'), imagem: 'og-jornada.png' });

interface Tributo {
  name: string;
  rate: string;
  url: string;
  destaque?: boolean;
}

/**
 * Cada etapa do `journey.json` marca uma alíquota com `destaque`: é o número
 * grande, com o `name` dela de legenda e a `url` de fonte. Nenhum número entra
 * digitado no template (`tests/jornadaTrilho.spec.ts` cobra isso).
 */
const etapas = journey.steps.map((step) => {
  const tributos = step.taxes as Tributo[];
  const destaque = tributos.find((tributo) => tributo.destaque);
  if (!destaque) throw new Error(`jornada: a etapa "${step.key}" nao tem aliquota em destaque`);
  return { ...step, destaque, demais: tributos.filter((tributo) => tributo !== destaque) };
});

const corDoNo = (indice: number) => {
  const t = Math.min(Math.max(indice, 0), etapas.length - 1) / (etapas.length - 1);
  return t < 0.5
    ? `color-mix(in oklab, var(--color-money) ${t * 200}%, var(--color-dino))`
    : `color-mix(in oklab, var(--color-alert) ${(t - 0.5) * 200}%, var(--color-money))`;
};

const stepReveals = etapas.map(() => useInView(0.4));
</script>

<template>
  <div>
    <section class="mesh grain relative overflow-hidden text-center">
      <div class="journey-container journey-section">
        <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
          {{ t('journey.kicker') }}
        </p>
        <h1
          class="font-display text-ink mx-auto mt-3 text-4xl font-bold tracking-tight md:text-6xl"
        >
          {{ t('journey.title') }}
        </h1>
        <p class="text-ink-dim mx-auto mt-5 text-lg leading-relaxed">
          {{ t('journey.intro') }}
        </p>
        <div class="mt-6">
          <TldrBadge :text="t('journey.tldr')" />
        </div>
        <p class="glass mx-auto mt-6 rounded-2xl px-5 py-3 text-sm">
          <span class="text-ink">{{ t('journey.taxCountLine', { count: journey.taxCount }) }}</span>
          <a
            :href="journey.taxCountSource.url"
            target="_blank"
            rel="noopener"
            class="text-ink-dim hover:text-dino ml-1 text-xs underline underline-offset-4"
            >({{ t('equivalences.sourcePrefix') }}: {{ journey.taxCountSource.source }})</a
          >
        </p>
        <p class="text-ink-dim mt-8 text-xs">{{ t('journey.scrollHint') }} ↓</p>
      </div>
    </section>

    <div class="journey-container">
      <section
        v-for="(etapa, index) in etapas"
        :key="etapa.key"
        :ref="stepReveals[index]!.target"
        class="reveal relative"
        :class="{ in: stepReveals[index]!.inView.value }"
      >
        <!--
          O trilho ocupa a altura inteira; o espaçamento fica no conteúdo
          para manter a linha contínua entre as etapas.
        -->
        <div class="journey-marker absolute inset-y-0 -left-8 flex w-4 flex-col items-end">
          <span
            aria-hidden="true"
            class="absolute inset-y-0 right-0 w-px"
            :style="{ background: `linear-gradient(${corDoNo(index)}, ${corDoNo(index + 1)})` }"
          />
          <span
            aria-hidden="true"
            class="relative h-2.5 w-2.5 translate-x-1/2 rounded-full shadow-[0_0_0_5px_var(--color-abyss)]"
            :style="{ background: corDoNo(index) }"
          />
          <p aria-hidden="true" class="font-display text-line tabular mt-3 text-sm leading-none">
            {{ String(index + 1).padStart(2, '0') }}
          </p>
        </div>

        <div class="journey-section min-w-0">
          <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
            {{ t('journey.stepLabel', { n: index + 1, total: etapas.length }) }}
          </p>

          <h2 class="font-display text-ink mt-3 text-2xl font-bold tracking-tight sm:text-4xl">
            {{ t(`journey.steps.${etapa.key}.title`) }}
          </h2>

          <Art
            :id="`jornada-${etapa.key}`"
            sizes="(min-width: 896px) 768px, (min-width: 640px) calc(100vw - 128px), calc(100vw - 80px)"
            class="mx-auto mt-6 w-[min(100%,48rem)] rounded-3xl"
          />

          <p class="tabular font-display text-money mt-7 text-4xl leading-none font-bold sm:text-6xl">
            {{ etapa.destaque.rate }}
          </p>
          <p class="text-ink-dim mt-2 text-sm">
            {{ etapa.destaque.name }} ·
            <a
              :href="etapa.destaque.url"
              target="_blank"
              rel="noopener"
              class="hover:text-dino underline underline-offset-4"
              >{{ t('equivalences.sourcePrefix') }}</a
            >
          </p>

          <p class="text-ink-dim mt-6 text-lg leading-relaxed">
            {{ t(`journey.steps.${etapa.key}.body`) }}
          </p>

          <div v-if="etapa.demais.length" class="mt-6 flex flex-wrap gap-2">
            <a
              v-for="tax in etapa.demais"
              :key="tax.name"
              :href="tax.url"
              target="_blank"
              rel="noopener"
              class="glass hover:border-alert/60 rounded-full px-3.5 py-1.5 text-sm transition-colors"
            >
              <span class="text-ink font-semibold">{{ tax.name }}</span>
              <span class="tabular text-alert ml-1.5 font-bold">{{ tax.rate }}</span>
            </a>
          </div>

          <div class="border-alert/30 bg-alert/5 mt-8 rounded-3xl border p-6 sm:p-8">
            <p class="text-alert text-lg leading-relaxed font-bold sm:text-xl">
              {{ t(`journey.steps.${etapa.key}.question`) }}
            </p>
          </div>
        </div>
      </section>
    </div>

    <section id="a-cobranca-continua" aria-labelledby="jornada-reflexao" class="border-line bg-surface border-t">
      <div class="journey-container journey-section">
        <div class="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p class="text-ink-dim text-lg leading-relaxed">
              {{ t('journey.reflection.opening') }}
            </p>
            <h2 id="jornada-reflexao" class="font-display text-ink mt-6 text-2xl leading-snug font-bold tracking-tight sm:text-3xl">
              {{ t('journey.reflection.title') }}
            </h2>
            <p class="text-ink-dim mt-6 text-lg leading-relaxed">
              {{ t('journey.reflection.circulation') }}
            </p>
          </div>
          <Art
            id="jornada-ciclo"
            sizes="(min-width: 1152px) 496px, (min-width: 1024px) calc(50vw - 80px), (min-width: 896px) 768px, (min-width: 640px) calc(100vw - 128px), calc(100vw - 80px)"
            class="mx-auto w-[min(100%,48rem)] rounded-3xl"
          />
        </div>

        <div class="mt-8 space-y-6 text-lg leading-relaxed">
          <p class="text-ink-dim">{{ t('journey.reflection.spending') }}</p>
          <p class="text-ink-dim">{{ t('journey.reflection.building') }}</p>
          <p class="text-ink text-xl font-bold sm:text-2xl">{{ t('journey.reflection.ownership') }}</p>
          <p class="text-ink-dim">{{ t('journey.reflection.annual') }}</p>
          <p class="text-ink-dim">{{ t('journey.reflection.inheritance') }}</p>
          <div class="border-alert/40 mt-10 border-l-4 pl-5 sm:pl-7">
            <p class="text-ink text-xl font-bold">{{ t('journey.reflection.effort') }}</p>
            <p class="font-display text-money mt-5 text-2xl leading-snug font-bold sm:text-3xl">
              {{ t('journey.reflection.question') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="border-line bg-surface border-t">
      <div class="journey-container journey-section text-center">
        <p class="text-alert text-xs font-semibold tracking-[0.2em] uppercase">
          {{ t('journey.verdict.kicker') }}
        </p>
        <h2 class="font-display text-ink mt-3 text-3xl font-bold tracking-tight  sm:text-5xl">
          {{ t('journey.verdict.title', { pct: journey.incomeBurdenPct.toLocaleString($i18n.locale) }) }}
        </h2>
        <p class="text-ink-dim mx-auto mt-5 text-lg leading-relaxed">
          {{ t('journey.verdict.body') }}
        </p>
        <p class="text-ink-dim mt-3 text-xs">
          {{ t('equivalences.sourcePrefix') }}:
          <a
            :href="journey.incomeBurdenSource.url"
            target="_blank"
            rel="noopener"
            class="text-dino underline underline-offset-4"
            >{{ journey.incomeBurdenSource.source }}</a
          >
          · {{ t('journey.verdict.note') }}
        </p>
        <p class="font-display text-money mx-auto mt-10 text-2xl leading-snug font-bold  sm:text-4xl">
          “{{ t('journey.finale') }}”
        </p>
        <div class="mt-8 flex justify-center">
          <ShareRow :text="t('share.journeyText')" />
        </div>
        <div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <NuxtLink
            :to="$localePath('/calculadora')"
            class="bg-dino text-abyss rounded-full px-7 py-3.5 text-sm font-bold shadow-[0_0_40px_color-mix(in_oklab,var(--color-dino)_30%,transparent)] transition-transform hover:scale-105"
          >
            {{ t('hero.cta') }}
          </NuxtLink>
          <NuxtLink
            :to="$localePath('/falacias')"
            class="botao-secundario px-7 py-3.5"
          >
            {{ t('hungerFallacy.moreFallacies') }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.journey-container {
  width: 100%;
  max-width: 72rem;
  margin-inline: auto;
  padding-inline: 2.5rem;
  --journey-section-space: 3rem;
}

.journey-section {
  padding-block: var(--journey-section-space);
}

.journey-marker {
  padding-top: var(--journey-section-space);
}

@media (min-width: 640px) {
  .journey-container {
    padding-inline: 4rem;
    --journey-section-space: 4rem;
  }
}
</style>
