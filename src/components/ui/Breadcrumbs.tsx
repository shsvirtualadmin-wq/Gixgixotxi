import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const fullItems = useMemo<BreadcrumbItem[]>(
    () => [{ label: 'Home', href: '/' }, ...items],
    [items]
  );

  useEffect(() => {
    const scriptId = 'boardly-breadcrumb-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: fullItems.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.label,
        ...(item.href ? { item: `https://boardly.cfd${item.href}` } : {}),
      })),
    };

    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(breadcrumbSchema);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, [fullItems]);

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)] mb-6 ${className}`}
    >
      {fullItems.map((item, idx) => {
        const isLast = idx === fullItems.length - 1;
        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {idx > 0 && <ChevronRight size={13} className="text-[var(--text-muted)] opacity-60 shrink-0" />}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-pill text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
              >
                {idx === 0 && <Home size={12} className="text-[#D71921]" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-pill text-[var(--text-primary)] font-medium truncate max-w-[260px]"
                aria-current={isLast ? 'page' : undefined}
              >
                {idx === 0 && <Home size={12} className="text-[#D71921]" />}
                <span className="truncate">{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
