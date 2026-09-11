<script setup lang="ts">

const { t } = useI18n();

usePaginaSeo({ titulo: t('whatItBuys.pageTitle'), descricao: t('whatItBuys.tldr') });

const propositoReveal = useInView(0.2);
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="max-w-3xl space-y-5">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('whatItBuys.kicker') }}
      </p>
      <h1 class="font-display text-ink text-4xl font-bold tracking-tight  md:text-6xl">
        {{ t('whatItBuys.title') }}
      </h1>
      <p class="text-ink-dim text-lg leading-relaxed">{{ t('whatItBuys.intro') }}</p>
    </header>

    <FechoHero />

    <div class="mt-12 sm:mt-16">
      <OQueDavaParaComprar />
    </div>

    <section
      :ref="propositoReveal.target"
      class="reveal border-line mt-20 border-t pt-14 sm:mt-28 sm:pt-20"
      :class="{ in: propositoReveal.inView.value }"
    >
      <div class="grid items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <h2 class="font-display text-ink text-2xl font-bold tracking-tight  sm:text-4xl">
            {{ t('whatItBuys.purposeTitle') }}
          </h2>
          <div class="mt-6 max-w-3xl space-y-5">
            <p v-for="indice in 3" :key="indice" class="text-ink-dim text-lg leading-relaxed">
              {{ t(`whatItBuys.purpose${indice}`) }}
            </p>
            <p class="text-ink text-lg leading-relaxed font-semibold">{{ t('whatItBuys.purpose4') }}</p>
          </div>

          <NuxtLink
            :to="$localePath('/manifesto')"
            class="bg-dino text-abyss hover:bg-dino-belly focus-visible:outline-ink mt-8 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {{ t('whatItBuys.purposeLink') }} <span aria-hidden="true">→</span>
          </NuxtLink>

          <div class="mt-10">
            <ShareRow :text="t('share.whatItBuysText')" />
          </div>
        </div>
        <Art v-if="arteCatalogo['conferencia-fontes']" id="conferencia-fontes" sizes="(min-width: 1152px) 490px, (min-width: 1024px) 42vw, 90vw" class="mx-auto w-full max-w-xl rounded-3xl" />
      </div>
    </section>

    <LazySecaoCafe hydrate-on-visible />
  </div>
</template>
