import { useState, useEffect, useCallback } from 'react';

export type ThemeSetting = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
// Legacy type alias for backwards compatibility
export type Theme = ThemeSetting;

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getSavedSetting(): ThemeSetting {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem('boardly-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'dark';
}

function applyThemeSetting(setting: ThemeSetting): ResolvedTheme {
  if (typeof document === 'undefined') return 'dark';
  const resolved: ResolvedTheme = setting === 'system' ? getSystemTheme() : setting;

  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.setAttribute('data-theme-setting', setting);
  document.documentElement.style.colorScheme = resolved;

  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', resolved === 'dark' ? '#000000' : '#FFFFFF');
  }

  return resolved;
}

export function useTheme() {
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(getSavedSetting);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const setting = getSavedSetting();
    return setting === 'system' ? getSystemTheme() : setting;
  });

  // Apply on mount and when setting changes
  useEffect(() => {
    const active = applyThemeSetting(themeSetting);
    setResolvedTheme(active);
    try {
      localStorage.setItem('boardly-theme', themeSetting);
    } catch {
      // ignore
    }
  }, [themeSetting]);

  // Live listener for system dark/light changes when setting is 'system'
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (themeSetting === 'system') {
        const active = applyThemeSetting('system');
        setResolvedTheme(active);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      } else {
        mediaQuery.removeListener(handleSystemChange);
      }
    };
  }, [themeSetting]);

  // Broadcast & sync across tabs / windows
  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeSetting>;
      if (customEvent.detail && ['light', 'dark', 'system'].includes(customEvent.detail)) {
        setThemeSetting(customEvent.detail);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'boardly-theme' && e.newValue && ['light', 'dark', 'system'].includes(e.newValue)) {
        setThemeSetting(e.newValue as ThemeSetting);
      }
    };

    window.addEventListener('boardly-theme-changed', handleCustomChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('boardly-theme-changed', handleCustomChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setTheme = useCallback((newTheme: ThemeSetting) => {
    setThemeSetting(newTheme);
    const active = applyThemeSetting(newTheme);
    setResolvedTheme(active);
    try {
      localStorage.setItem('boardly-theme', newTheme);
      window.dispatchEvent(new CustomEvent('boardly-theme-changed', { detail: newTheme }));
    } catch {
      // ignore
    }
  }, []);

  // Backwards compatibility toggle between dark and light
  const toggle = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return {
    theme: themeSetting,
    resolvedTheme,
    themeSetting,
    setTheme,
    toggle,
    isDark: resolvedTheme === 'dark',
  };
}

