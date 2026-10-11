import React, { useEffect } from 'react';
import { getPageSeo, PageSeoConfig, DEFAULT_OG_IMAGE, SITE_NAME } from '../../config/seo';

export interface SeoHeadProps {
  pathname?: string;
  override?: Partial<PageSeoConfig>;
  noIndex?: boolean;
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  pathname,
  override,
  noIndex = false,
}) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const currentPath = pathname || window.location.pathname;
    const baseConfig = getPageSeo(currentPath);
    const config: PageSeoConfig = {
      ...baseConfig,
      ...override,
    };

    // 1. Title (50-60 chars)
    document.title = config.title;

    // Helper to safely set or create meta tags
    const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Robots
    if (noIndex || currentPath.startsWith('/app') || currentPath.startsWith('/admin')) {
      setMetaTag('name', 'robots', 'noindex,nofollow');
    } else {
      setMetaTag('name', 'robots', config.robots || 'index,follow');
    }

    // 3. Meta Description (140-160 chars)
    setMetaTag('name', 'description', config.description);

    // 4. Canonical
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', config.canonical);

    // 5. OpenGraph
    setMetaTag('property', 'og:title', config.title);
    setMetaTag('property', 'og:description', config.description);
    setMetaTag('property', 'og:url', config.canonical);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:image', config.ogImage || DEFAULT_OG_IMAGE);

    // 6. Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', config.title);
    setMetaTag('name', 'twitter:description', config.description);
    setMetaTag('name', 'twitter:image', config.ogImage || DEFAULT_OG_IMAGE);

    // 7. Schema.org JSON-LD
    let schemaScript = document.getElementById('dynamic-page-schema') as HTMLScriptElement | null;
    if (config.schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'dynamic-page-schema';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(config.schema);
    } else if (schemaScript) {
      schemaScript.remove();
    }
  }, [pathname, override, noIndex]);

  return null;
};
