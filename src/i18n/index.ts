import {
  LANGUAGE_META,
  ORDERED_LANGUAGES,
  VALID_APP_LANGUAGES,
  type AppLanguage,
  type LanguageMeta,
  type ResolvedLanguage,
  type TranslationDictionary,
  type TranslationParams,
} from './types';
import { en } from './locales/en';
import { urLatn } from './locales/ur-latn';
import { ur } from './locales/ur';
import { es } from './locales/es';
import { zh } from './locales/zh';
import { hi } from './locales/hi';
import { ar } from './locales/ar';
import { fr } from './locales/fr';

export * from './types';

export const LOCALES: Record<ResolvedLanguage, TranslationDictionary> = {
  en,
  'ur-latn': urLatn,
  ur,
  es,
  zh,
  hi,
  ar,
  fr,
};

export const APP_LANGUAGE_STORAGE_KEY = 'boardly_app_language';
export const APP_LANGUAGE_BY_UID_STORAGE_KEY = 'boardly_app_language_by_uid';

let activeResolvedLanguage: ResolvedLanguage = 'en';

export function normalizeAppLanguage(raw: unknown): AppLanguage | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed === 'system' || trimmed === 'default') return 'auto';
  if (trimmed === 'ur-latn' || trimmed === 'roman-urdu' || trimmed === 'ur_latn') {
    return 'ur-latn';
  }
  if (VALID_APP_LANGUAGES.has(trimmed)) {
    return trimmed as AppLanguage;
  }
  return null;
}

export function detectSystemLanguage(): ResolvedLanguage {
  if (typeof navigator === 'undefined') return 'en';
  const candidates: string[] = [];
  if (Array.isArray(navigator.languages)) {
    candidates.push(...navigator.languages);
  }
  if (navigator.language) {
    candidates.push(navigator.language);
  }

  for (const raw of candidates) {
    if (!raw) continue;
    const tag = raw.toLowerCase().replace(/_/g, '-');
    if (tag.startsWith('ur-latn')) return 'ur-latn';
    if (tag === 'ur' || tag.startsWith('ur-')) return 'ur';
    if (tag === 'ar' || tag.startsWith('ar-')) return 'ar';
    if (tag === 'es' || tag.startsWith('es-')) return 'es';
    if (tag === 'zh' || tag.startsWith('zh-')) return 'zh';
    if (tag === 'hi' || tag.startsWith('hi-')) return 'hi';
    if (tag === 'fr' || tag.startsWith('fr-')) return 'fr';
    if (tag === 'en' || tag.startsWith('en-')) return 'en';
  }

  return 'en';
}

export function resolveLanguage(setting: AppLanguage): ResolvedLanguage {
  if (setting === 'auto') {
    return detectSystemLanguage();
  }
  return LANGUAGE_META[setting] ? setting : 'en';
}

export function getLanguageMeta(lang: ResolvedLanguage): LanguageMeta {
  return LANGUAGE_META[lang] || LANGUAGE_META.en;
}

export function getActiveResolvedLanguage(): ResolvedLanguage {
  return activeResolvedLanguage;
}

export function setActiveResolvedLanguage(lang: ResolvedLanguage): void {
  activeResolvedLanguage = lang;
}

export function applyDocumentLanguage(resolved: ResolvedLanguage): void {
  setActiveResolvedLanguage(resolved);
  if (typeof document === 'undefined') return;
  const meta = getLanguageMeta(resolved);
  const root = document.documentElement;
  root.setAttribute('lang', meta.htmlLang);
  root.setAttribute('dir', meta.dir);
  root.setAttribute('data-lang', resolved);
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    const val = params[key];
    if (val === null || val === undefined) return match;
    return String(val);
  });
}

export function translate(
  lang: ResolvedLanguage,
  key: string,
  params?: TranslationParams
): string {
  const dict = LOCALES[lang];
  const raw = (dict && dict[key]) || en[key];
  if (!raw || !raw.trim()) {
    // Fallback strictly to English; never return blank text or raw dot-key if preventable
    const fallback = en[key];
    if (fallback && fallback.trim()) {
      return interpolate(fallback, params);
    }
    const lastSegment = key.split('.').pop() || key;
    return lastSegment.replace(/([A-Z])/g, ' $1').trim();
  }
  return interpolate(raw, params);
}

/**
 * Shared standalone translation helper using the currently active language.
 * Inside React components, prefer `const { t } = useLanguage()` so UI updates reactively.
 */
export function t(key: string, params?: TranslationParams): string {
  return translate(activeResolvedLanguage, key, params);
}

export function formatNumber(
  value: number,
  lang: ResolvedLanguage = activeResolvedLanguage,
  options?: Intl.NumberFormatOptions
): string {
  if (!Number.isFinite(value)) return '0';
  const meta = getLanguageMeta(lang);
  try {
    return new Intl.NumberFormat(meta.intlLocale, {
      numberingSystem: 'latn',
      ...options,
    } as Intl.NumberFormatOptions).format(value);
  } catch {
    return value.toLocaleString('en-US');
  }
}

export function formatPKR(
  amount: number,
  lang: ResolvedLanguage = activeResolvedLanguage
): string {
  return `PKR ${formatNumber(amount, lang, { maximumFractionDigits: 0 })}`;
}

export function formatDate(
  input: Date | number | string,
  lang: ResolvedLanguage = activeResolvedLanguage,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  const meta = getLanguageMeta(lang);
  try {
    return new Intl.DateTimeFormat(meta.intlLocale, {
      numberingSystem: 'latn',
      ...options,
    } as Intl.DateTimeFormatOptions).format(date);
  } catch {
    return date.toLocaleDateString('en-US', options);
  }
}

export function formatRelativeTime(
  input: Date | number | string,
  lang: ResolvedLanguage = activeResolvedLanguage
): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return translate(lang, 'common.justNow');
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return translate(lang, 'common.minutesAgo', { count: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return translate(lang, 'common.hoursAgo', { count: diffHr });
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return translate(lang, 'common.daysAgo', { count: diffDays });
  return formatDate(date, lang);
}

export function getDisplayLabelForSetting(
  setting: AppLanguage,
  resolvedLang: ResolvedLanguage = activeResolvedLanguage
): string {
  if (setting === 'auto') {
    return translate(resolvedLang, 'settings.systemDefault');
  }
  return getLanguageMeta(setting).nativeLabel;
}

export function readStoredLanguageForUid(uid: string | null | undefined): AppLanguage | null {
  if (typeof window === 'undefined') return null;
  try {
    if (uid) {
      const rawMap = window.localStorage.getItem(APP_LANGUAGE_BY_UID_STORAGE_KEY);
      if (rawMap) {
        const parsed = JSON.parse(rawMap) as Record<string, unknown>;
        const candidate = normalizeAppLanguage(parsed?.[uid]);
        if (candidate) return candidate;
      }
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function readBootStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const raw = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
    return normalizeAppLanguage(raw) ?? 'en';
  } catch {
    return 'en';
  }
}

export function writeStoredLanguage(lang: AppLanguage, uid?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, lang);
    if (uid) {
      let map: Record<string, AppLanguage> = {};
      const existing = window.localStorage.getItem(APP_LANGUAGE_BY_UID_STORAGE_KEY);
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (parsed && typeof parsed === 'object') {
            map = parsed as Record<string, AppLanguage>;
          }
        } catch {
          map = {};
        }
      }
      map[uid] = lang;
      window.localStorage.setItem(APP_LANGUAGE_BY_UID_STORAGE_KEY, JSON.stringify(map));
    }
  } catch {
    // ignore storage errors
  }
}

export { ORDERED_LANGUAGES };
