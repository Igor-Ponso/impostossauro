<script setup lang="ts">
defineOptions({ name: 'SiteArt' });
const props = withDefaults(defineProps<{
  id: string;
  decorative?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
}>(), { decorative: false, loading: 'lazy', sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1100px' });

const { locale } = useI18n();
const { app } = useRuntimeConfig();
const piece = computed(() => {
  const entry = arteCatalogo[props.id];
  if (!entry) throw new Error(`Arte não catalogada: ${props.id}`);
  return entry;
});
const description = computed(() => props.decorative ? '' : piece.value.alt[locale.value === 'en' ? 'en' : 'pt-BR']);
const srcset = computed(() => {
  if (piece.value.sources?.length) {
    return piece.value.sources.map(source => `${app.baseURL}art/${source.file} ${source.width}w`).join(', ');
  }
  return piece.value.file.endsWith('.webp') && piece.value.width > 640
    ? `${app.baseURL}art/${props.id}-640.webp 640w, ${app.baseURL}art/${piece.value.file} ${piece.value.width}w`
    : undefined;
});
</script>

<template>
  <img
    :src="`${app.baseURL}art/${piece.file}`"
    :srcset="srcset"
    :sizes="sizes"
    :width="piece.width"
    :height="piece.height"
    :alt="description"
    :aria-hidden="decorative ? true : undefined"
    :loading="loading"
    decoding="async"
    class="block h-auto max-w-full select-none"
  >
</template>
