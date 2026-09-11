<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<template>
  <p class="glass inline-flex items-start gap-2.5 rounded-2xl px-4 py-3 text-left">
    <span>
      <span class="text-dino block text-[10px] font-bold tracking-[0.18em] uppercase">
        {{ $t('tldr.label') }}
      </span>
      <span class="text-ink text-sm font-semibold sm:text-base">{{ text }}</span>
    </span>
  </p>
</template>
