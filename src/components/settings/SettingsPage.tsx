import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface SettingsPageProps {
  title: string;
  onBack?: () => void;
  rightAction?: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  };
  /** Optional floating bottom "Search settings" pill */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** When embedded inside an overlay/drawer (e.g. More tab), uses its own scroll container */
  scrollContainer?: 'window' | 'self';
  children: React.ReactNode;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  title,
  onBack,
  rightAction,
  search,
  scrollContainer = 'window',
  children,
}) => {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const selfScrollRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Always start at scrollTop = 0 when entering a settings page/sub-page
  useEffect(() => {
    if (scrollContainer === 'self') {
      if (selfScrollRef.current) {
        selfScrollRef.current.scrollTop = 0;
      }
      setScrolled(false);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    setScrolled(false);
  }, [title, scrollContainer]);

  useEffect(() => {
    let rafId = 0;
    if (scrollContainer === 'self') {
      const el = selfScrollRef.current;
      if (!el) return;
      const sync = () => {
        const over = el.scrollTop > 4;
        setScrolled((prev) => (prev === over ? prev : over));
      };
      const onScroll = () => {
        if (rafId) return;
        rafId = window.requestAnimationFrame(() => {
          rafId = 0;
          sync();
        });
      };
      el.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        if (rafId) window.cancelAnimationFrame(rafId);
        el.removeEventListener('scroll', onScroll);
      };
    }

    const syncWindow = () => {
      const over = window.scrollY > 4;
      setScrolled((prev) => (prev === over ? prev : over));
    };
    const onWindowScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        syncWindow();
      });
    };
    syncWindow();
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onWindowScroll);
    };
  }, [scrollContainer]);

  const containerClass =
    scrollContainer === 'self'
      ? 'h-full max-h-[100dvh] overflow-y-auto overscroll-contain'
      : 'min-h-[100dvh]';

  return (
    <div
      ref={scrollContainer === 'self' ? selfScrollRef : undefined}
      className={`${containerClass} w-full overflow-x-hidden`}
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* 56px Sticky Top Bar — solid --bg, safe-area aware, 1px bottom border only after scroll */}
      <header
        className="sticky top-0 z-30 w-full transition-[border-color] duration-150"
        style={{
          backgroundColor: 'var(--bg)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        }}
      >
        <div className="mx-auto flex h-[56px] w-full max-w-[640px] items-center justify-between gap-3 px-4">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={t('nav.goBack')}
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full transition-colors active:scale-95 cursor-pointer"
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
          ) : (
            <div className="h-[40px] w-[40px] shrink-0" aria-hidden="true" />
          )}

          <h1
            className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold leading-tight"
            style={{
              color: 'var(--text)',
              fontFamily: 'var(--font-sans, var(--font-heading), system-ui, sans-serif)',
            }}
          >
            {title}
          </h1>

          {rightAction ? (
            <button
              type="button"
              onClick={rightAction.onClick}
              aria-label={rightAction.label}
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full transition-colors active:scale-95 cursor-pointer"
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              {rightAction.icon}
            </button>
          ) : (
            <div className="h-[40px] w-[40px] shrink-0" aria-hidden="true" />
          )}
        </div>
      </header>

      {/* Centered content column (16px horizontal padding, max-w 640px) */}
      <main
        className="mx-auto w-full max-w-[640px] px-4 pt-4"
        style={{
          paddingBottom: search
            ? 'calc(56px + 16px + 24px + 16px + env(safe-area-inset-bottom, 0px))'
            : 'calc(40px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>

      {/* Floating bottom "Search settings" pill with transparent -> --bg fade scrim */}
      {search && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-20"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, var(--bg) 52%, var(--bg) 100%)',
            paddingTop: '28px',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="pointer-events-auto mx-auto w-full max-w-[640px] px-4">
            <div
              onClick={() => searchInputRef.current?.focus()}
              className="settings-search-pill flex h-[56px] w-full items-center gap-3 rounded-full px-5 transition-[border-color,box-shadow] duration-150"
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <Search
                className="h-5 w-5 shrink-0"
                style={{ color: 'var(--text-muted)' }}
                strokeWidth={2}
              />
              <input
                ref={searchInputRef}
                type="search"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder || t('settings.searchPlaceholder')}
                aria-label={search.placeholder || t('settings.searchPlaceholder')}
                className="settings-search-input h-full min-w-0 flex-1 text-[16px] placeholder:text-[var(--text-muted)]"
                style={{
                  color: 'var(--text)',
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  boxShadow: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  borderRadius: 'inherit',
                  font: 'inherit',
                }}
              />
              {search.value.trim().length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    search.onChange('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label={t('common.clear')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity active:opacity-70 cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
