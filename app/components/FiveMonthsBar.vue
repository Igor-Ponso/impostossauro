<script setup lang="ts">
import taxData from '~/data/tax-data.json';

const { t } = useI18n();

const days = taxData.workDays.days;
const taxedFraction = days / 365;

const monthKeys = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
] as const;

</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <p class="tabular font-display text-alert text-6xl leading-none font-bold sm:text-7xl">
        {{ days }}
      </p>
      <p class="text-ink-dim text-base">{{ t('fiveMonths.daysSuffix') }}</p>
      <p class="text-ink text-base font-semibold">{{ t('fiveMonths.freedomDay') }}</p>
    </div>

    <div class="space-y-2">
      <div class="border-line relative h-14 overflow-hidden rounded-2xl border sm:h-16">
        <div class="bg-card absolute inset-0" />
        <div
          class="absolute inset-y-0 left-0 bg-dino"
          :style="{ width: `${taxedFraction * 100}%` }"
        />
        <div class="absolute inset-0 grid grid-cols-12">
          <div
            v-for="(month, index) in monthKeys"
            :key="month"
            class="border-abyss/60 flex items-end justify-start border-l pb-1 pl-1 first:border-l-0"
          >
            <span
              class="text-[10px] font-semibold uppercase sm:text-xs"
              :class="index < 5 ? 'text-abyss' : 'text-ink-dim'"
            >
              {{ t(`fiveMonths.months.${month}`) }}
            </span>
          </div>
        </div>
        <div
          class="absolute inset-y-0 w-px bg-ink"
          :style="{ left: `${taxedFraction * 100}%` }"
          aria-hidden="true"
        />
      </div>
      <div class="text-ink-dim flex justify-between text-base">
        <span class="text-dino font-semibold">{{ t('fiveMonths.forThem') }}</span>
        <span>{{ t('fiveMonths.forYou') }}</span>
      </div>
    </div>

    <p class="text-ink-dim text-base leading-relaxed">
      {{ t('fiveMonths.source', { pct: taxData.workDays.incomeSharePct.toLocaleString($i18n.locale), year: taxData.workDays.referenceYear }) }}
      <a
        :href="taxData.workDays.url"
        target="_blank"
        rel="noopener"
        class="text-dino underline underline-offset-4"
        >IBPT</a
      >.
    </p>

    <p class="text-ink-dim text-base">
      <a href="#sua-conta" class="text-dino underline underline-offset-4">{{ t('fiveMonths.yours') }}</a>
    </p>
  </div>
</template>
