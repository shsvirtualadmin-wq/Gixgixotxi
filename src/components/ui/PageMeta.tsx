import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface PageMetaProps {
  title: string;
  description: string;
  ogImage?: string;
  canonicalPath?: string;
  canonical?: string;
  noindex?: boolean;
  ogType?: 'website' | 'article' | 'profile';
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function PageMeta({
  title,
  description,
  ogImage = '/assets/og-image.png',
  canonicalPath,
  canonical: directCanonical,
  noindex = false,
  ogType = 'website',
  jsonLd,
}: PageMetaProps) {
  const location = useLocation();

  useEffect(() => {
    // 1. Page Title
    const fullTitle = title.includes('Boardly') ? title : `${title} — Boardly`;
    document.title = fullTitle;

    // Helper for standard meta tags
    const setMetaTag = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Meta description & robots
    setMetaTag('description', description);
    setMetaTag(
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // 3. Canonical URL (strip tracking params, normalize path)
    const normalizedDirect = directCanonical ? directCanonical.replace(/^https?:\/\/[^/]+/, '') : null;
    const cleanPath = (normalizedDirect || canonicalPath || location.pathname).replace(/\/+$/, '') || '/';
    const canonicalHref = `https://boardly.cfd${cleanPath}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);

    // 4. Open Graph Tags
    const setOgMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const fullImageUrl = ogImage.startsWith('http') ? ogImage : `https://boardly.cfd${ogImage}`;
    setOgMeta('og:title', fullTitle);
    setOgMeta('og:description', description);
    setOgMeta('og:url', canonicalHref);
    setOgMeta('og:image', fullImageUrl);
    setOgMeta('og:site_name', 'Boardly');
    setOgMeta('og:type', ogType);

    // 5. Twitter Card Tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', fullImageUrl);

    // 6. Structured Data (JSON-LD)
    const scriptId = 'boardly-page-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [title, description, ogImage, canonicalPath, noindex, ogType, jsonLd, location.pathname]);

  return null;
}

export default PageMeta;

