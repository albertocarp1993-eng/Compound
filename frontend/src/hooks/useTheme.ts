import { useEffect, useState } from 'react';

export type AppTheme = 'midnight' | 'light';

const STORAGE_KEY = 'snowball-theme';

const resolveInitialTheme = (): AppTheme => {
  if (typeof window === 'undefined') return 'midnight';

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'midnight' || stored === 'light') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'midnight';
};

export function useTheme(): {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
} {
  const [theme, setTheme] = useState<AppTheme>(resolveInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme((prev) => (prev === 'midnight' ? 'light' : 'midnight')),
  };
}

export default useTheme;
