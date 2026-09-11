<script setup lang="ts">
withDefaults(
  defineProps<{ amount: number; perSecond?: number; nota?: boolean }>(),
  { perSecond: 0, nota: false },
);
</script>

<template>
  <p
    class="tabular font-display text-money px-2 font-bold tracking-tight text-[clamp(1.5rem,5.4vw,4.6rem)] leading-none drop-shadow-[0_0_45px_color-mix(in_oklab,var(--color-money)_30%,transparent)]"
  >
    <ContadorOdometro :valor="amount" :por-segundo="perSecond" />
    <a
      v-if="nota"
      href="#nota-estimativa"
      class="text-alert hover:text-alert/80 focus-visible:outline-ink ml-1 align-super text-[0.32em] font-bold no-underline outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-describedby="nota-estimativa"
      >*</a
    >
  </p>
</template>
