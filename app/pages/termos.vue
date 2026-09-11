<script setup lang="ts">
const { t } = useI18n();

usePaginaSeo({ titulo: t('terms.pageTitle'), descricao: t('terms.title') });

const SECOES = ['nature', 'notAdvice', 'sources', 'content', 'links', 'law'] as const;
const ISSUES = 'https://github.com/Igor-Ponso/impostossauro/issues/new';
const LICENCA = 'https://github.com/Igor-Ponso/impostossauro/blob/dev/LICENSE';
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <header class="space-y-5">
      <p class="text-dino text-xs font-semibold tracking-[0.2em] uppercase">{{ t('terms.kicker') }}</p>
      <h1 class="font-display text-ink text-4xl font-bold tracking-tight  md:text-6xl">
        {{ t('terms.title') }}
      </h1>
      <p class="text-ink-dim text-lg leading-relaxed">{{ t('terms.intro') }}</p>
      <p class="text-ink-dim text-sm">{{ t('terms.updated') }}</p>
    </header>

    <div class="mt-12 space-y-6">
      <section v-for="secao in SECOES" :key="secao" class="glass rounded-3xl p-6 sm:p-8">
        <h2 class="font-display text-ink text-xl font-bold sm:text-2xl">{{ t(`terms.${secao}.title`) }}</h2>
        <p class="text-ink-dim mt-3 leading-relaxed">{{ t(`terms.${secao}.p1`) }}</p>
        <p v-if="secao === 'sources'" class="text-ink-dim mt-3 leading-relaxed">{{ t('terms.sources.p2') }}</p>
        <ul v-if="secao === 'content' || secao === 'law'" class="text-ink-dim mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <li v-if="secao === 'content'">
            <a :href="LICENCA" target="_blank" rel="noopener" class="hover:text-dino underline underline-offset-4">MIT</a>
          </li>
          <li v-else>
            <a :href="ISSUES" target="_blank" rel="noopener" class="hover:text-dino underline underline-offset-4">GitHub</a>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
