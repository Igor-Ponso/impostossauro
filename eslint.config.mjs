// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  /** `app/components/vb/` é código do vue-bits: corrigir aviso ali bifurcaria do upstream. */
  ignores: ['app/components/vb/**'],
});
