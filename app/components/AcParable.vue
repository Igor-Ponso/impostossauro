<script setup lang="ts">
const { target, inView } = useInView(0.25);
const colors = ['text-dino', 'text-alert', 'text-money'];
</script>

<template>
  <div ref="target" class="grid gap-8 sm:gap-12">
    <figure
      v-for="step in 3"
      :key="step"
      class="glass reveal overflow-hidden rounded-3xl"
      :class="{ in: inView }"
      :style="{ transitionDelay: `${(step - 1) * 150}ms` }"
    >
      <!-- ART: parabola-ac-1 / parabola-ac-2 / parabola-ac-3 · 4:3 -->
      <Art :id="`parabola-ac-${step}`" sizes="(max-width: 1024px) 100vw, 1000px" class="w-full" />
      <figcaption class="flex items-start gap-5 p-6 sm:gap-8 sm:p-8">
        <p class="font-display text-4xl font-bold sm:text-5xl" :class="colors[step - 1]">{{ String(step).padStart(2, '0') }}</p>
        <p class="text-ink max-w-3xl text-base leading-relaxed sm:text-xl">{{ $t(`manifesto.parable.p${step}`) }}</p>
      </figcaption>
    </figure>
  </div>
</template>
