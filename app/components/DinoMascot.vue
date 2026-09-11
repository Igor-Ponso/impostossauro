<script setup lang="ts">
const props = withDefaults(defineProps<{
  mood?: 'happy' | 'hungry' | 'greedy';
  compact?: boolean;
}>(), { mood: 'happy', compact: false });

const { app } = useRuntimeConfig();
const clipId = `dino-${useId()}`;
const source = computed(() => {
  const id = props.compact ? 'dino-cabecalho' : `dino-mascote-${props.mood}`;
  return `${app.baseURL}art/${arteCatalogo[id]!.file}`;
});
</script>

<template>
  <!-- Invólucro SVG permite usar a mesma imagem também dentro do gráfico de Laffer. -->
  <svg
    viewBox="0 0 400 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    class="dino-mascote overflow-hidden"
    :class="compact ? 'rounded-full' : 'rounded-2xl'"
  >
    <defs><clipPath :id="clipId"><rect width="400" height="400" :rx="compact ? 200 : 32" /></clipPath></defs>
    <image :href="source" width="400" height="400" :clip-path="`url(#${clipId})`" />
  </svg>
</template>
