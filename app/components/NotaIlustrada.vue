<script setup lang="ts">
const props = withDefaults(defineProps<{ remaining?: number; animate?: boolean }>(), { remaining: 100, animate: false });
const { app } = useRuntimeConfig();
const source = `${app.baseURL}art/${arteCatalogo['inflacao-nota']!.file}`;
const clipId = `nota-${useId()}`;
const edge = computed(() => Math.min(100, Math.max(0, props.remaining)) * 2);
const cut = computed(() => {
  if (edge.value >= 200) return 'M0 0H200V100H0Z';
  if (edge.value <= 0) return 'M0 0Z';
  const points = Array.from({ length: 11 }, (_, i) => `${Math.max(0, edge.value + (i % 2 ? -2 : 0))},${i * 10}`);
  return `M0 0L${points.join(' ')}L0 100Z`;
});
</script>

<template>
  <!-- ART: inflacao-nota · o recorte segue o poder de compra calculado, sem deformar a cédula -->
  <svg viewBox="0 0 200 100" aria-hidden="true" focusable="false" class="block h-auto w-full">
    <defs>
      <clipPath :id="clipId"><path :d="cut" /></clipPath>
    </defs>
    <image :href="source" width="200" height="100" :opacity="remaining < 100 ? .12 : 0" />
    <g :clip-path="`url(#${clipId})`" :class="{ 'nota-revelada': animate }">
      <image :href="source" width="200" height="100" />
    </g>
  </svg>
</template>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .nota-revelada { animation: nota-entrar .6s ease-out both; }
  @keyframes nota-entrar { from { opacity: .3; } to { opacity: 1; } }
}
</style>
