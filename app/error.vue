<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const { t } = useI18n();
const localePath = useLocalePath();
const naoExiste = computed(() => props.error.statusCode === 404);

useHead({ title: () => naoExiste.value ? t('erro.notFoundTitle') : t('erro.brokeTitle') });
useSeoMeta({ robots: 'noindex, nofollow' });

function voltar() {
  clearError({ redirect: localePath('/') });
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteHeader />
    <main class="mesh flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <DinoMascot mood="hungry" class="w-28 sm:w-36" />
      <p class="text-dino mt-8 text-sm font-semibold tracking-[0.2em] uppercase">
        {{ naoExiste ? t('erro.notFoundKicker') : t('erro.brokeKicker', { code: error.statusCode }) }}
      </p>
      <h1 class="font-display text-ink mt-3 text-4xl font-bold tracking-tight  sm:text-6xl">
        {{ naoExiste ? t('erro.notFoundTitle') : t('erro.brokeTitle') }}
      </h1>
      <p class="text-ink-dim mt-5 text-lg leading-relaxed">
        {{ naoExiste ? t('erro.notFoundBody') : t('erro.brokeBody') }}
      </p>
      <button
        type="button"
        class="bg-dino text-abyss hover:bg-dino-belly mt-8 rounded-full px-7 py-3.5 text-sm font-bold transition-colors"
        @click="voltar"
      >
        {{ t('erro.cta') }}
      </button>
      <a
        href="https://github.com/Igor-Ponso/impostossauro/issues/new"
        target="_blank"
        rel="noopener"
        class="text-ink-dim hover:text-ink mt-4 text-sm underline underline-offset-4"
      >
        {{ t('erro.report') }}
      </a>
    </main>
  </div>
</template>
