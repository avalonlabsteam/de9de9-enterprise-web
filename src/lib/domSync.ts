import { dirOf, useLangStore } from '@/stores/langStore';
import { useThemeStore } from '@/stores/themeStore';

/**
 * Stamps the persisted language/theme stores onto <html> and keeps them in
 * sync. Called once from main.tsx, before the first render, so every route —
 * the public landing/auth pages included, not just the AppLayout shells —
 * honors the zustand stores.
 */
export function initDomSync(): void {
  const applyLang = () => {
    const { lang } = useLangStore.getState();
    document.documentElement.dir = dirOf(lang);
    document.documentElement.lang = lang;
  };

  const applyTheme = () => {
    document.documentElement.classList.toggle('dark', useThemeStore.getState().mode === 'dark');
  };

  applyLang();
  applyTheme();
  useLangStore.subscribe(applyLang);
  useThemeStore.subscribe(applyTheme);
}
