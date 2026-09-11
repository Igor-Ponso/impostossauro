<script setup lang="ts">
import justificationsPt from '~/data/justifications.json';
import promisesPt from '~/data/promises.json';
import type { PromiseCase } from '~/utils/promises';

const { t, locale } = useI18n();

const promises = dadoNoIdioma('promises.json', promisesPt, locale.value);
const justifications = dadoNoIdioma('justifications.json', justificationsPt, locale.value);

usePaginaSeo({ titulo: t('promises.pageTitle'), descricao: t('promises.tldr') });

const casos = casosPublicaveis(promises.cases as PromiseCase[]);

/** Caso ainda sem documento primário fica em `pending` no JSON e não chega à tela. */
const justificados = computed(() =>
  justifications.cases.filter((caso) => caso.verified === 'primaria'),
);
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="max-w-3xl space-y-4">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('promises.kicker') }}
      </p>
      <h1 class="font-display text-ink text-4xl font-bold tracking-tight  md:text-6xl">
        {{ t('promises.title') }}
      </h1>
      <p class="text-ink-dim text-lg leading-relaxed">
        {{ t('promises.intro') }}
      </p>
      <TldrBadge :text="t('promises.tldr')" />
    </header>

    <section class="mt-14 space-y-8">
      <PromiseContrast v-for="caso in casos" :key="caso.id" :caso="caso" />
    </section>

    <section v-if="justificados.length" class="mt-20">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">
        {{ t('justifications.sectionKicker') }}
      </p>
      <h2 class="font-display text-ink mt-3 text-3xl font-bold tracking-tight  sm:text-5xl">
        {{ t('justifications.sectionTitle') }}
      </h2>
      <p class="text-ink-dim mt-4 text-lg leading-relaxed">
        {{ t('justifications.sectionIntro') }}
      </p>

      <div class="mt-10 space-y-8">
        <JustificationContrast v-for="caso in justificados" :key="caso.key" :caso="caso" />

        <DinheiroQueVoltou class="mt-16" />
      </div>

      <p class="text-ink-dim mt-6 text-xs leading-relaxed">
        {{ t('justifications.pendingNote') }}
      </p>
    </section>

    <SignaturePhrase :phrase="t('signature.promises')" />

    <NotaMetodologia :nota="t('promises.methodNote')" />
  </div>
</template>
