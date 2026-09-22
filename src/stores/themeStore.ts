import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
}

/** First visit follows the OS; after that the user's explicit choice wins. */
const systemMode = (): ThemeMode =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const useThemeStore = create<ThemeState>()(
  persist(() => ({ mode: systemMode() }), {
    name: 'de9de9-theme',
    version: 1,
    /**
     * v0 had a third 'system' mode in the cycle. On a dark OS it rendered
     * identically to 'dark', so the toggle appeared to have two dark stops and
     * one light one. Resolve any stored 'system' to a concrete mode once.
     */
    migrate: (persisted): ThemeState => {
      const mode = (persisted as Partial<ThemeState> | undefined)?.mode;
      return { mode: mode === 'light' || mode === 'dark' ? mode : systemMode() };
    },
  }),
);

export const themeActions = {
  set: (mode: ThemeMode): void => {
    useThemeStore.setState({ mode });
  },
  /** light ↔ dark */
  toggle: (): void => {
    useThemeStore.setState((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' }));
  },
};
