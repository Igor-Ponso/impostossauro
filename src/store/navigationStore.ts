import { defineStore } from 'pinia';

export const useNavigationStore = defineStore('navigation', () => {
  const rail: Ref<boolean> = ref(true);
  const drawer: Ref<boolean> = ref(true);

  const changeRail = () => {
    rail.value = !rail.value;
  };

  return { rail, drawer, changeRail };
});
