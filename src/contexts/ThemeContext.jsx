import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_KEY = 'theme'; // 'light' | 'dark' 

function getInitialTheme() {
  // 1) Prefer user-scoped session data
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      const fromUser = u?.preferences?.theme || u?.themePreference || u?.theme;
      if (fromUser === 'light' || fromUser === 'dark' || fromUser === 'system') return fromUser;
    }
  } catch {}
  // 2) Fallback to global key
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

function applyThemeClass(theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldDark = theme === 'dark' || (theme === 'system' && prefersDark);
  const root = document.documentElement;
  root.classList.toggle('dark', shouldDark);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Apply on mount and when theme changes
  useEffect(() => {
    applyThemeClass(theme);
    // Keep both: global key and session user data
    localStorage.setItem(THEME_KEY, theme);
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const updated = {
          ...u,
          preferences: { ...(u?.preferences || {}), theme },
          themePreference: theme,
          theme,
        };
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch {}
  }, [theme]);

  // React to system change when theme === 'system'
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') applyThemeClass('system');
    };
    media.addEventListener?.('change', handler);
    return () => media.removeEventListener?.('change', handler);
  }, [theme]);

  const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolvedTheme = useMemo(() => (theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme), [theme, prefersDark]);

  const value = useMemo(() => ({ theme, setTheme, resolvedTheme }), [theme, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
