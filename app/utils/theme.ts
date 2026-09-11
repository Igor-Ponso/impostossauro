export type Theme = 'dark' | 'light';

/** O script inline do <head> repete esta string literalmente: roda antes do bundle e nao pode importar daqui. */
export const THEME_STORAGE_KEY = 'impostossauro-tema';

/** So 'light' exato clareia: valor corrompido nao pode mudar o tema. */
export function resolveTheme(stored: string | null): Theme {
  return stored === 'light' ? 'light' : 'dark';
}

export function revealRadius(x: number, y: number, width: number, height: number): number {
  return Math.max(
    Math.hypot(x, y),
    Math.hypot(width - x, y),
    Math.hypot(x, height - y),
    Math.hypot(width - x, height - y),
  );
}
