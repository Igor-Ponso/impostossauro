import { aparelhoDeToque } from '~/utils/bolinhas';

/** Conservador até montar; acompanha redimensionamento e mudança do ponteiro. */
export function useAparelhoDeToque() {
  const toque = ref(true);
  let consulta: MediaQueryList | undefined;
  function atualizar() {
    toque.value = aparelhoDeToque({
      ponteiroGrosso: consulta?.matches ?? true,
      largura: window.innerWidth,
    });
  }
  onMounted(() => {
    consulta = window.matchMedia('(any-pointer: coarse)');
    atualizar();
    consulta.addEventListener('change', atualizar);
    window.addEventListener('resize', atualizar, { passive: true });
  });
  onUnmounted(() => {
    consulta?.removeEventListener('change', atualizar);
    window.removeEventListener('resize', atualizar);
  });
  return toque;
}
