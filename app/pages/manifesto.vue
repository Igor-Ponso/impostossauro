<script setup lang="ts">
import literacyPt from '~/data/literacy.json';

const { t, locale } = useI18n();

const literacy = dadoNoIdioma('literacy.json', literacyPt, locale.value);

usePaginaSeo({ titulo: t('manifesto.pageTitle'), descricao: t('manifesto.tldr'), imagem: 'og-manifesto.png' });

const rulesReveal = useInView(0.2);
const literacyReveal = useInView(0.25);
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="max-w-3xl space-y-5">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('manifesto.kicker') }}
      </p>
      <h1 class="font-display text-ink text-4xl font-bold tracking-tight  md:text-6xl">
        {{ t('manifesto.title') }}
      </h1>
      <TldrBadge :text="t('manifesto.tldr')" />
      <p class="text-ink-dim text-lg leading-relaxed">
        {{ t('manifesto.intro') }}
      </p>
    </header>

    <section class="mt-14 grid gap-8">
      <div class="glass grid items-center gap-8 rounded-3xl p-6 sm:p-8 md:grid-cols-[16rem_minmax(0,1fr)] lg:grid-cols-[24rem_minmax(0,1fr)] lg:gap-10 lg:p-10">
        <Art id="sistema-nao" sizes="(min-width: 1024px) 384px, (min-width: 768px) 256px, (min-width: 466px) 384px, calc(100vw - 82px)" class="mx-auto w-96 rounded-2xl md:w-full" />
        <div class="min-w-0">
          <h2 class="font-display text-alert text-xl font-bold sm:text-2xl lg:text-3xl">{{ t('manifesto.notTitle') }}</h2>
          <ul class="text-ink-dim mt-5 space-y-3 leading-relaxed">
            <li v-for="index in 6" :key="index" class="flex gap-2">
              <span class="text-alert shrink-0" aria-hidden="true">—</span>
              <span>{{ t(`manifesto.not${index}`) }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="glass grid items-center gap-8 rounded-3xl p-6 sm:p-8 md:grid-cols-[16rem_minmax(0,1fr)] lg:grid-cols-[24rem_minmax(0,1fr)] lg:gap-10 lg:p-10">
        <Art id="sistema-sim" sizes="(min-width: 1024px) 384px, (min-width: 768px) 256px, (min-width: 466px) 384px, calc(100vw - 82px)" class="mx-auto w-96 rounded-2xl md:w-full" />
        <div class="min-w-0">
          <h2 class="font-display text-dino text-xl font-bold sm:text-2xl lg:text-3xl">{{ t('manifesto.yesTitle') }}</h2>
          <ul class="text-ink-dim mt-5 space-y-3 leading-relaxed">
            <li v-for="index in 6" :key="index" class="flex gap-2">
              <span class="text-dino shrink-0" aria-hidden="true">—</span>
              <span>{{ t(`manifesto.yes${index}`) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('manifesto.parable.title') }}
      </h2>
      <p class="text-ink-dim mt-3 text-lg leading-relaxed">
        {{ t('manifesto.parable.intro') }}
      </p>
      <div class="mt-8">
        <AcParable />
      </div>
      <p class="font-display text-ink mt-6 text-xl leading-snug font-bold sm:text-2xl">
        {{ t('manifesto.parable.punch') }}
      </p>
    </section>

    <section :ref="literacyReveal.target" class="reveal mt-16" :class="{ in: literacyReveal.inView.value }">
      <div class="border-alert/30 bg-alert/5 rounded-3xl border p-6 sm:p-8">
        <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
          {{ t('manifesto.literacy.title') }}
        </h2>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="bg-abyss/60 border-line rounded-2xl border p-5">
            <p class="tabular font-display text-alert text-4xl font-bold sm:text-5xl">
              {{ literacy.functionalIlliteratePct }}%
            </p>
            <p class="text-ink-dim mt-2 leading-relaxed">{{ t('manifesto.literacy.stat1') }}</p>
          </div>
          <div class="bg-abyss/60 border-line rounded-2xl border p-5">
            <p class="tabular font-display text-alert text-4xl font-bold sm:text-5xl">
              {{ literacy.proficientPct }}%
            </p>
            <p class="text-ink-dim mt-2 leading-relaxed">{{ t('manifesto.literacy.stat2') }}</p>
          </div>
        </div>
        <p class="text-ink mt-6 text-lg leading-relaxed font-semibold">
          {{ t('manifesto.literacy.body') }}
        </p>
        <p class="text-ink-dim mt-3 leading-relaxed">
          {{ t('manifesto.literacy.punch') }}
        </p>
        <p class="text-ink-dim mt-4 text-xs">
          {{ t('equivalences.sourcePrefix') }}:
          <a
            :href="literacy.source.url"
            target="_blank"
            rel="noopener"
            class="text-dino underline underline-offset-4"
            >{{ literacy.source.source }}</a
          >
        </p>
      </div>
    </section>

    <section :ref="rulesReveal.target" class="mt-16">
      <h2 class="font-display text-ink text-2xl font-bold tracking-tight sm:text-4xl">
        {{ t('manifesto.rules.title') }}
      </h2>
      <ol class="mt-8 space-y-4">
        <li
          v-for="index in 4"
          :key="index"
          class="glass reveal flex items-start gap-4 rounded-2xl p-5"
          :class="{ in: rulesReveal.inView.value }"
          :style="{ transitionDelay: `${(index - 1) * 100}ms` }"
        >
          <span class="tabular font-display text-dino text-2xl font-bold">{{ index }}</span>
          <p class="text-ink leading-relaxed">{{ t(`manifesto.rules.rule${index}`) }}</p>
        </li>
      </ol>
      <p class="text-ink-dim mt-6 leading-relaxed">
        {{ t('manifesto.rules.outro') }}
        <a
          href="https://github.com/Igor-Ponso/impostossauro"
          target="_blank"
          rel="noopener"
          class="text-dino underline underline-offset-4"
          >GitHub</a
        >.
      </p>
    </section>

    <SignaturePhrase :phrase="t('signature.manifesto')" />

    <div class="mt-14 text-center">
      <NuxtLink
        :to="$localePath('/jornada')"
        class="bg-dino text-abyss inline-block rounded-full px-7 py-3.5 text-sm font-bold shadow-[0_0_40px_color-mix(in_oklab,var(--color-dino)_30%,transparent)] transition-transform hover:scale-105"
      >
        {{ t('manifesto.cta') }}
      </NuxtLink>
    </div>
  </div>
</template>
