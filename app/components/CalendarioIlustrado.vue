<script setup lang="ts">
const props = defineProps<{ year: number; governmentDays: number }>();
const { locale } = useI18n();
const english = computed(() => locale.value === 'en');
const labels = computed(() => english.value
  ? { government: 'Days working for the government', yours: 'Days working for yourself', title: 'Your working year' }
  : { government: 'Dias trabalhando para o governo', yours: 'Dias trabalhando para você', title: 'Seu ano de trabalho' });

const months = computed(() => {
  let ordinal = 0;
  return Array.from({ length: 12 }, (_, month) => {
    const start = new Date(Date.UTC(props.year, month, 1)).getUTCDay();
    const count = new Date(Date.UTC(props.year, month + 1, 0)).getUTCDate();
    return {
      month,
      label: new Intl.DateTimeFormat(locale.value, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(props.year, month, 1))),
      days: Array.from({ length: count }, (_, day) => {
        ordinal++;
        return {
          ordinal, date: day + 1, government: ordinal <= props.governmentDays,
          x: 12 + ((start + day) % 7) * 17,
          y: 24 + Math.floor((start + day) / 7) * 7,
        };
      }),
    };
  });
});
const description = computed(() => `${labels.value.title}, ${props.year}. ${props.governmentDays} ${labels.value.government.toLocaleLowerCase(locale.value)}.`);
</script>

<template>
  <figure class="my-5 overflow-hidden rounded-3xl border border-[var(--color-line)]">
    <div class="bg-[#151035] px-4 py-4 text-center font-display text-2xl font-bold text-white">{{ year }}</div>
    <div class="grid grid-cols-2 gap-2 bg-[#f5f1ff] p-2 sm:grid-cols-4 sm:gap-3 sm:p-4" role="img" :aria-label="description">
      <div v-for="month in months" :key="month.month" class="rounded-xl bg-white p-2 shadow-sm sm:p-3" aria-hidden="true">
        <p class="mb-2 text-sm font-bold text-[#29204b]">{{ month.label }}</p>
        <div class="grid grid-cols-7 gap-0.5">
          <span v-for="blank in new Date(Date.UTC(year, month.month, 1)).getUTCDay()" :key="`blank-${blank}`" />
          <span v-for="day in month.days" :key="day.ordinal" class="flex aspect-square items-center justify-center rounded-sm text-[10px] leading-none font-semibold text-white sm:text-xs" :class="day.government ? 'bg-[#a63d67] underline decoration-white/80' : 'bg-[#176951]'">
            {{ day.date }}<span v-if="day.government" class="sr-only">/</span>
          </span>
        </div>
      </div>
    </div>
    <figcaption class="text-ink-dim flex flex-wrap gap-x-5 gap-y-2 p-4 text-sm">
      <span class="inline-flex items-center gap-2"><span aria-hidden="true" class="inline-flex h-3 w-3 items-center justify-center rounded-sm bg-[#a63d67] text-[10px] text-white">_</span>{{ labels.government }}</span>
      <span class="inline-flex items-center gap-2"><span aria-hidden="true" class="inline-block h-3 w-3 rounded-sm bg-[#176951]" />{{ labels.yours }}</span>
    </figcaption>
  </figure>
</template>
