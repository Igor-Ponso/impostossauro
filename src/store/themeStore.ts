import { Ref } from 'vue';
import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', () => {
  const theme: Ref<string> = ref('dark');

  const changeTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  };

  return { theme, changeTheme };
});
