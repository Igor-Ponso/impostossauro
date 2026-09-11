<script setup lang="ts">
const props = defineProps<{ phrase: string }>();

const shareText = computed(() => `“${props.phrase}”`);
</script>

<template>
  <div
    class="border-money/30 bg-money/5 relative mt-14 overflow-hidden rounded-3xl border p-6 text-center sm:p-10"
  >
    <div
      aria-hidden="true"
      class="float-glow bg-money/10 pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 rounded-full blur-3xl sm:h-80 sm:w-80"
    />
    <p class="font-display text-money relative mx-auto text-2xl leading-snug font-bold  sm:text-3xl">
      “{{ phrase }}”
    </p>
    <div class="relative mt-6 flex justify-center">
      <ShareRow :text="shareText" />
    </div>
  </div>
</template>
