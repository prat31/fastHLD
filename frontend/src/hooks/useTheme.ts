import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'fasthld-theme';

function applyTheme(pref: ThemePreference) {
  const isDark =
    pref === 'dark' ||
    (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    return stored ?? 'system';
  });

  // Apply on mount and whenever preference changes
  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  // Re-apply when OS theme changes (for 'system' preference)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (preference === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  const setTheme = useCallback((pref: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, pref);
    setPreference(pref);
  }, []);

  return { preference, setTheme };
}
