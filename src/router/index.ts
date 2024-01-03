// Composables
import { createRouter, createWebHistory } from "vue-router";
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from '~pages';

generatedRoutes.push({ path: "/:catchAll(.*)", redirect: "/404" });

const router = createRouter({
  history: createWebHistory(),
  routes: setupLayouts(generatedRoutes),
});

export default router;
