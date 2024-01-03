/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify'
import pinia from '../store'
import router from '../router'
import i18n from './i18n'
import { createHead } from '@vueuse/head';

import VueAxios from 'vue-axios';
import axios from 'axios';

// Types
import type { App } from 'vue'

export function registerPlugins (app: App) {
  app
    .use(vuetify)
    .use(router)
    .use(VueAxios, axios)
    .use(createHead())
    .use(i18n)
    .use(pinia)
}
