import type { ThemePreference } from '../types/theme.types';

export const THEME_STORAGE_KEY = 'bom-trato:theme';

const themes = new Set<ThemePreference>(['system', 'light', 'dark']);

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (stored && themes.has(stored as ThemePreference)) {
      return stored as ThemePreference;
    }
  } catch {
    return 'system';
  }

  return 'system';
}

export function storeThemePreference(theme: ThemePreference): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    return;
  }
}
