import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveStaticOrPatternRouteMeta } from '../../utils/routeSeoMeta';
import {
  SHARE_SITE_ORIGIN,
  buildDynamicOgImageUrl,
} from '../../utils/sharePreviewHelper';

export interface PageMetaProps {
  title: string;
  description: string;
  ogImage?: string;
  ogImageAlt?: string;
  canonicalPath?: string;
  noindex?: boolean;
  ogType?: 'website' | 'article' | 'profile';
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function PageMeta({
  title,
  description,
  ogImage,
  ogImageAlt,
  canonicalPath,
  noindex = false,
  ogType = 'website',
  jsonLd,
}: PageMetaProps) {
  const location = useLocation();

  useEffect(() => {
    // 1. Page Title
    const fullTitle = title.includes('Boardly') ? title : `${title} | Boardly`;
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
    const cleanPath = (canonicalPath || location.pathname).replace(/\/+$/, '') || '/';
    const canonicalHref = `${SHARE_SITE_ORIGIN}${cleanPath}`;
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

    const routeFallback = resolveStaticOrPatternRouteMeta(cleanPath, location.search);
    const resolvedOgImage =
      ogImage && ogImage !== '/assets/og-image.png'
        ? ogImage
        : routeFallback.ogImage ||
          buildDynamicOgImageUrl(
            {
              type: ogType === 'profile' ? 'profile' : ogType === 'article' ? 'post' : 'default',
              title: fullTitle.replace(/\s*[|—-]\s*Boardly.*$/i, ''),
              subtitle: description,
            },
            SHARE_SITE_ORIGIN
          );
    const fullImageUrl = resolvedOgImage.startsWith('http')
      ? resolvedOgImage
      : `${SHARE_SITE_ORIGIN}${resolvedOgImage}`;
    const finalImageAlt = ogImageAlt || routeFallback.ogImageAlt || fullTitle;

    setOgMeta('og:title', fullTitle);
    setOgMeta('og:description', description);
    setOgMeta('og:url', canonicalHref);
    setOgMeta('og:image', fullImageUrl);
    setOgMeta('og:image:secure_url', fullImageUrl);
    setOgMeta('og:image:width', '1200');
    setOgMeta('og:image:height', '630');
    setOgMeta('og:image:alt', finalImageAlt);
    setOgMeta('og:site_name', 'Boardly');
    setOgMeta('og:type', ogType);

    // 5. Twitter Card Tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:url', canonicalHref);
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', fullImageUrl);
    setMetaTag('twitter:image:alt', finalImageAlt);

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
  }, [
    title,
    description,
    ogImage,
    ogImageAlt,
    canonicalPath,
    noindex,
    ogType,
    jsonLd,
    location.pathname,
    location.search,
  ]);

  return null;
}

export default PageMeta;


