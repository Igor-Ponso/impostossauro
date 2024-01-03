/**
 * Function to control device media query
 * @returns {boolean}
 * @version 1.0.0
 * @param query
 */
const matchMedia = (query: string) => {
  const matches = ref(true);

  watchEffect((onInvalidate) => {
    const media: MediaQueryList = window.matchMedia(query);

    if (media.matches !== matches.value) {
      matches.value = media.matches;
    }

    const onChange = () => {
      matches.value = media.matches;
    };

    media.addEventListener('change', onChange);

    onInvalidate(() => {
      media.removeEventListener('change', onChange);
    });
  });

  return matches;
};

/**
 * Default Breakpoints using tailwind
 * presets
 * @see https://tailwindcss.com/docs/screens
 * @version 1.0.0
 */
export default function useMedia() {
  return ref({
    xs: matchMedia('(min-width: 0)'),
    xsm: matchMedia('(min-width: 425px'),
    sm: matchMedia('(min-width: 640px)'),
    md: matchMedia('(min-width: 768px)'),
    lg: matchMedia('(min-width: 1024px)'),
    xl: matchMedia('(min-width: 1280px)'),
    xxl: matchMedia('(min-width: 1536px)'),
  });
}
