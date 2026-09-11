<script setup lang="ts">
/** O bloco ao lado de um número correto que ainda assim engana; conteúdo, não rodapé. */
interface Point {
  title: string;
  text: string;
  source?: string;
  url?: string;
}

defineProps<{
  points: Point[];
  heading?: string;
}>();

const { t } = useI18n();
</script>

<template>
  <section class="border-money/40 bg-money/[0.04] mt-8 rounded-3xl border border-dashed p-6 sm:p-8">
    <p class="text-money text-sm font-semibold tracking-[0.2em] uppercase sm:text-base">
      {{ heading ?? t('hidden.heading') }}
    </p>
    <p class="text-ink-dim mt-2 text-base leading-relaxed">{{ t('hidden.intro') }}</p>

    <ul class="mt-6 space-y-5">
      <li v-for="point in points" :key="point.title" class="border-money/30 border-l-2 pl-4">
        <p class="font-display text-ink font-bold">{{ point.title }}</p>
        <p class="text-ink-dim mt-1 leading-relaxed">{{ point.text }}</p>
        <a
          v-if="point.url"
          :href="point.url"
          target="_blank"
          rel="noopener"
          class="text-ink-dim hover:text-dino mt-2 inline-block text-base underline underline-offset-4"
        >
          {{ t('equivalences.sourcePrefix') }}: {{ point.source }}
        </a>
      </li>
    </ul>
  </section>
</template>
