let cssLoaded = false;

/**
 * Dynamically loads KaTeX stylesheet only on test, results, and quiz preparation pages.
 */
export async function loadKatexCss(): Promise<void> {
  if (cssLoaded || typeof document === 'undefined') return;

  const existing = document.getElementById('boardly-katex-stylesheet');
  if (existing) {
    cssLoaded = true;
    return;
  }

  try {
    await import('katex/dist/katex.min.css');
    cssLoaded = true;
  } catch (err) {
    console.warn('[KaTeX Loader] Bundled CSS import fallback:', err);
    try {
      const link = document.createElement('link');
      link.id = 'boardly-katex-stylesheet';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.18.1/dist/katex.min.css';
      link.crossOrigin = 'anonymous';
      link.onload = () => {
        cssLoaded = true;
      };
      document.head.appendChild(link);
    } catch (e) {
      console.warn('[KaTeX Loader] Link append fallback failed:', e);
    }
  }
}
