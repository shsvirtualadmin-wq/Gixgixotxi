import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageMetaProps {
  title: string;
  description: string;
  ogImage?: string;
}

export function PageMeta({ title, description, ogImage = '/assets/og-image.png' }: PageMetaProps) {
  const location = useLocation();

  useEffect(() => {
    // 1. Page Title
    const fullTitle = title.includes('Boardly') ? title : `${title} — Boardly`;
    document.title = fullTitle;

    // 2. Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. Canonical URL
    const canonicalHref = `https://boardly.cfd${location.pathname}`;
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

    setOgMeta('og:title', fullTitle);
    setOgMeta('og:description', description);
    setOgMeta('og:url', canonicalHref);
    setOgMeta('og:image', ogImage.startsWith('http') ? ogImage : `https://boardly.cfd${ogImage}`);
    setOgMeta('og:site_name', 'Boardly');
    setOgMeta('og:type', 'website');
  }, [title, description, ogImage, location.pathname]);

  return null;
}

export default PageMeta;
