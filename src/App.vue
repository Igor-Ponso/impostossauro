<script setup lang="ts">
  /**
   * App vue component to render the system.
   * @name 'App'
   * @version 1.0.0
   */
  import { useHead } from '@vueuse/head';

  useHead({
    title: 'Impostossauro',
    meta: [
      {
        name: 'description',
        content:
          'Acompanhe quanto de imposto você paga por ano, mês, dia, hora, minuto e segundo. E veja o que poderia ser feito com esse dinheiro. É assustador! Mas é a realidade.',
      },
      {
        name: 'keywords',
        content:
          'imposto, imposto estadual, imposto federal, imposto municipal, imposto de renda, imposto de renda pessoa física, imposto de renda pessoa jurídica, imposto de renda pessoa física 2021, imposto de renda pessoa jurídica 2021, imposto de renda pessoa física 2022, imposto de renda pessoa jurídica 2022, imposto de renda pessoa física 2023, imposto de renda pessoa jurídica 2023, imposto de renda pessoa física 2024, imposto de renda pessoa jurídica 2024, imposto de renda pessoa física 2025, imposto de renda pessoa jurídica 2025, imposto de renda pessoa física 2026, imposto de renda pessoa jurídica 2026, imposto de renda pessoa física 2027, imposto de renda pessoa jurídica 2027, imposto de renda pessoa física 2028, imposto de renda pessoa jurídica 2028, imposto de renda pessoa física 2029, imposto de renda pessoa jurídica 2029, imposto de renda pessoa física 2030, imposto de renda pessoa jurídica 2030, imposto de renda pessoa física 2031, imposto de renda pessoa jurídica 2031',
      },
      {
        name: 'author',
        content: 'Igor Ponso',
      },
    ],
    link: [
      {
        rel: 'stylesheet',
        href: 'https://cdn.jsdelivr.net/npm/@mdi/font@6.x/css/materialdesignicons.min.css',
      },
    ],
  });
</script>

<template>
  <router-view />
</template>

<route lang="yaml">
meta:
  layout: default
</route>
