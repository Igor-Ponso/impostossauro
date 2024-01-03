<script setup lang="ts">
  /**
   * Help Layout.
   * @name 'LayoutDefault'
   * @version 1.0.0
   * @note
   * Please be aware this is a
   * template proposal for the
   * default layout
   */

  import AppBar from '@/components/AppBar/AppBar.vue';
  import NavigationMobile from '@/components/NavigationMobile/NavigationMobile.vue';
  import useMedia from '@/composables/useMedia';

  // TODO see if is useful to use theme here
  //  import { useThemeStore } from '@/store/themeStore';
  // import { storeToRefs } from 'pinia';
  // const themeStore = useThemeStore();
  const screen = useMedia();
</script>

<template>
  <v-app theme="dark">
    <AppBar />
    <v-main>
      <router-view />
    </v-main>
    <NavigationMobile v-if="!screen.md" />
  </v-app>
</template>
