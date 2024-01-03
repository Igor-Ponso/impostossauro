//TODO make this a widget
<script lang="ts" setup>
  /**
   * A Bottom Navigation  Widget
   * @name 'NavigationMobile'
   * @version 1.0.0
   */

  import { useNavigationStore } from '@/store/navigationStore';
  import { storeToRefs } from 'pinia';
  const navigationStore = useNavigationStore();
  const { rail, drawer } = storeToRefs(navigationStore);

  rail.value = false;
  drawer.value = false;
</script>
<template>
  <v-bottom-navigation mode="shift">
    <v-btn value="recent">
      <v-icon>mdi-history</v-icon>
      Recent
    </v-btn>
    <v-btn value="favorites">
      <v-icon>mdi-heart</v-icon>
      Favorites
    </v-btn>
    <v-btn value="nearby" @click.stop="drawer = !drawer">
      <v-icon>mdi-map-marker</v-icon>
      Nearby
    </v-btn>
  </v-bottom-navigation>
</template>
