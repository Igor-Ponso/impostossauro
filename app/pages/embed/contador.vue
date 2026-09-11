<script setup lang="ts">
const { formatDinheiro, formatDinheiroInteiro, prefixo } = useMoeda();

/** Uso: <iframe src=".../embed/contador" width="640" height="220" /> */
const { t } = useI18n();
const { amount, perSecond, year } = useTaxClock();
const { siteUrl } = useRuntimeConfig().public;

useHead({ title: t('embed.pageTitle') });
useSeoMeta({ robots: 'noindex, follow' });
</script>

<template>
  <div class="flex min-h-[200px] flex-col items-center justify-center gap-2 px-4 py-6 text-center">
    <p class="text-ink-dim text-[11px] font-semibold tracking-[0.18em] uppercase">
      {{ t('hero.kicker', { year }) }}
    </p>
    <ClientOnly>
      <p class="tabular font-display text-money text-[clamp(1.3rem,5vw,2.6rem)] font-bold">
        {{ formatDinheiro(amount) }}
      </p>
      <template #fallback>
        <p class="tabular font-display text-money text-2xl font-bold">{{ prefixo }}…</p>
      </template>
    </ClientOnly>
    <p class="text-ink-dim text-xs">{{ t('hero.perSecond', { value: formatDinheiroInteiro(perSecond) }) }}</p>
    <a :href="siteUrl" target="_blank" rel="noopener" class="text-dino mt-1 text-xs font-bold underline underline-offset-4">
      impostossauro · {{ t('embed.credit') }}
    </a>
  </div>
</template>
