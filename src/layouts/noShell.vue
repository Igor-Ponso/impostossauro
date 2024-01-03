<script lang="ts" setup>
  /**
   * @name 'LayoutNoShell'
   * @version 1.0.0
   * @note
   * Layout template for pages
   * without header, navbar
   * botton-navigation and footer
   */

  import { useThemeStore } from '@/store/themeStore';
  import { storeToRefs } from 'pinia';
  const themeStore = useThemeStore();
  const { theme } = storeToRefs(themeStore);
</script>
<template>
  <v-app :theme="theme">
    <v-main>
      <v-container :class="['fill-height']">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
<style lang="stylus"></style>
