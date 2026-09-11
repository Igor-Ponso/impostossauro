<script setup lang="ts">
const { formatCount } = useMoeda();

withDefaults(defineProps<{
  count: number;
  label: string;
  description: string;
  source: string;
  url: string;
  artwork?: string;
  horizontal?: boolean;
  reverse?: boolean;
}>(), { artwork: 'equivalencia-dinheiro', horizontal: false, reverse: false });
</script>

<template>
  <article
    class="glass min-w-0 gap-6 rounded-3xl p-5 sm:p-8"
    :class="horizontal ? 'grid items-center md:grid-cols-2 md:gap-10' : 'flex flex-col'"
  >
    <Art :id="artwork" decorative :sizes="horizontal ? '(min-width: 1152px) 500px, (min-width: 768px) 45vw, 90vw' : '(max-width: 640px) 100vw, 360px'" class="aspect-[3/2] w-full rounded-2xl object-cover" :class="{ 'md:col-start-2 md:row-start-1': horizontal && reverse }" />
    <div class="flex min-w-0 flex-1 flex-col gap-2" :class="{ 'md:col-start-1 md:row-start-1': horizontal && reverse }">
      <p class="tabular font-display text-dino text-3xl leading-none font-bold break-words md:text-4xl">
        {{ formatCount(count) }}
      </p>
      <h3 class="text-ink mt-2 text-lg font-semibold">{{ label }}</h3>
      <p class="text-ink-dim text-base leading-relaxed">{{ description }}</p>
      <a
        :href="url"
        target="_blank"
        rel="noopener"
        class="text-ink-dim hover:text-dino mt-auto pt-3 text-base underline underline-offset-4"
      >
        {{ $t('equivalences.sourcePrefix') }}: {{ source }}
      </a>
    </div>
  </article>
</template>
