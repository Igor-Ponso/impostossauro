import { createI18n } from 'vue-i18n';
import ptBR from '@/locales/pt_br.json';

const i18n = createI18n({
  locale: 'pt-br',
  fallbackLocale: 'pt-br',
  messages: {
    'pt-br': ptBR,
  },
});

export default i18n;