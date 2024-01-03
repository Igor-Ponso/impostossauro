/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import 'vuetify/styles'

// Vuetify
import 'vuetify/styles';
import * as labs from 'vuetify/labs/components';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { pt, en } from 'vuetify/locale'
const vuetifyOptions = {
  components: {
    ...labs,
    ...components,
  },
  directives,
  locale: {
    locale: 'pt',
    fallback: 'en',
    messages: { pt, en },
  },
};

import { createVuetify } from 'vuetify'
export default createVuetify(vuetifyOptions)
