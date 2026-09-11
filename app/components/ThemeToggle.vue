<script setup lang="ts">
const { theme, toggle } = useTheme();
const { t } = useI18n();
</script>

<template>
  <button
    type="button"
    class="border-control text-ink-dim hover:text-ink flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
    :aria-label="theme === 'dark' ? t('theme.toLight') : t('theme.toDark')"
    :aria-pressed="theme === 'light'"
    @click="toggle($event.currentTarget as HTMLElement)"
  >
    <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
      <template v-if="theme === 'dark'">
        <circle cx="12" cy="12" r="4.5" />
        <path
          d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"
          stroke-linecap="round"
        />
      </template>
      <path v-else d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" stroke-linejoin="round" />
    </svg>
  </button>
</template>
