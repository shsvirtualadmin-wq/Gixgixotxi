import React, { createContext, useContext, useCallback, useLayoutEffect } from 'react';

export type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme | string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

const applyThemeToDOM = () => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const metaTheme = document.getElementById('theme-color-meta') || document.querySelector('meta[name="theme-color"]');
  root.setAttribute('data-theme', 'light');
  root.classList.add('light');
  root.classList.remove('dark');
  document.body.classList.add('light');
  document.body.classList.remove('dark');
  root.style.colorScheme = 'light';
  document.body.style.colorScheme = 'light';
  root.style.backgroundColor = '#F8FAFC';
  document.body.style.backgroundColor = '#F8FAFC';
  if (metaTheme) metaTheme.setAttribute('content', '#F8FAFC');

  try {
    localStorage.removeItem('boardly_theme');
    localStorage.removeItem('shs_theme');
  } catch {}
};

if (typeof window !== 'undefined') {
  applyThemeToDOM();
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : React.useEffect;

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useIsomorphicLayoutEffect(() => {
    applyThemeToDOM();
  }, []);

  const setTheme = useCallback(() => {
    applyThemeToDOM();
  }, []);

  const toggleTheme = useCallback(() => {
    applyThemeToDOM();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);


