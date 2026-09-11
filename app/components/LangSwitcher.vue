<script setup lang="ts">
const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();
const localePath = useLocalePath();
const comparacaoSelecionada = useState<string | null>('comparacao-selecionada', () => null);
</script>

<template>
  <div class="flex items-center gap-1 text-xs">
    <template v-for="(item, index) in locales" :key="item.code">
      <span v-if="index > 0" class="text-line hidden sm:inline">|</span>
      <NuxtLink
        :to="comparacaoSelecionada ? localePath(comparacaoSelecionada, item.code) : switchLocalePath(item.code).split(/[?#]/)[0]"
        class="inline-flex min-h-11 items-center px-1 transition-colors"
        :class="item.code === locale ? 'text-dino font-bold' : 'text-ink-dim hover:text-ink'"
      >
        {{ item.code === 'pt-BR' ? 'PT' : 'EN' }}
      </NuxtLink>
    </template>
  </div>
</template>
