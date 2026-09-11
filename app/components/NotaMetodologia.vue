<script setup lang="ts">
defineProps<{ nota: string }>();

const { t } = useI18n();
</script>

<template>
  <div class="mt-12">
    <p class="text-ink-dim text-sm leading-relaxed">{{ nota }}</p>
    <NuxtLink :to="$localePath('/metodologia')" class="botao-secundario mt-4">
      {{ t('equivalences.methodologyLink') }} <span aria-hidden="true">→</span>
    </NuxtLink>
  </div>
</template>
