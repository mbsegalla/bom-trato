'use client';

import { createContext, type ReactNode, useContext, useEffect, useSyncExternalStore } from 'react';

import { getStoredThemePreference, storeThemePreference } from '../services/theme.storage';
import type { ThemePreference } from '../types/theme.types';

const SYSTEM_DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

interface ThemeContextValue {
  theme: ThemePreference;
  ready: boolean;
  setTheme(theme: ThemePreference): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribeToTheme(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener('theme-preference-change', onChange);

  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('theme-preference-change', onChange);
  };
}

function subscribeToReady(): () => void {
  return () => {};
}

function getThemeSnapshot(): ThemePreference {
  return getStoredThemePreference();
}

function getServerThemeSnapshot(): ThemePreference {
  return 'system';
}

interface ThemeProviderProps {
  children: ReactNode;
}

function applyTheme(theme: ThemePreference): void {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia(SYSTEM_DARK_MODE_QUERY).matches);

  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const ready = useSyncExternalStore(
    subscribeToReady,
    () => true,
    () => false,
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!ready || theme !== 'system') {
      return;
    }

    const media = window.matchMedia(SYSTEM_DARK_MODE_QUERY);

    function handleChange(): void {
      applyTheme('system');
    }

    media.addEventListener('change', handleChange);

    return () => {
      media.removeEventListener('change', handleChange);
    };
  }, [ready, theme]);

  function setTheme(nextTheme: ThemePreference): void {
    storeThemePreference(nextTheme);
    window.dispatchEvent(new Event('theme-preference-change'));
    applyTheme(nextTheme);
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        ready,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }

  return context;
}
