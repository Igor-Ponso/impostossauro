<script setup lang="ts">
const { t } = useI18n();
const { target, inView } = useInView(0.15);

const ordemPaginas = navGroups.flatMap((g) => g.items);
const comFundo = (chave: string) => ordemPaginas.indexOf(chave) % 2 === 0;
const grupos = navGroups.map((grupo) => ({
  ...grupo,
  // Calculadora e manifesto já têm seções completas antes deste índice.
  items: grupo.items.filter((chave) => !['calculator', 'manifesto'].includes(chave)),
}));
</script>

<template>
  <section ref="target" class="py-20 sm:py-28">
    <div class="mx-auto max-w-6xl px-4">
      <p class="text-dino text-sm font-semibold tracking-[0.2em] uppercase sm:text-base">
        {{ t('doors.kicker') }}
      </p>
      <h2 class="font-display text-ink mt-3 text-3xl font-bold tracking-tight  sm:text-5xl">
        {{ t('doors.title') }}
      </h2>
      <p class="text-ink-dim mt-4 text-lg">{{ t('doors.subtitle') }}</p>
    </div>

    <div
      v-for="(grupo, indice) in grupos"
      :key="grupo.key"
      class="reveal mt-16"
      :class="{ in: inView }"
      :style="{ transitionDelay: `${indice * 80}ms` }"
    >
      <div class="mx-auto mb-6 max-w-6xl px-4">
        <h2 class="text-ink-dim border-line border-b pb-2 text-sm font-semibold tracking-[0.2em] uppercase sm:text-base">
          {{ t(`nav.groups.${grupo.key}`) }}
        </h2>
      </div>

      <template v-for="chave in grupo.items" :key="chave">
        <PageIntro :chave="chave" :fundo="comFundo(chave)" />
      </template>
    </div>
  </section>
</template>
