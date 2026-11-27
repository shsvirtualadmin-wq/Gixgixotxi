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

export * from './types';

export const LOCALES: Partial<Record<ResolvedLanguage, TranslationDictionary>> = {
  en,
};

const localeLoadPromises = new Map<ResolvedLanguage, Promise<TranslationDictionary>>();
const localeLoadedListeners = new Set<(lang: ResolvedLanguage) => void>();

export function isLocaleLoaded(lang: ResolvedLanguage): boolean {
  return Boolean(LOCALES[lang]);
}

export function subscribeLocaleLoaded(listener: (lang: ResolvedLanguage) => void): () => void {
  localeLoadedListeners.add(listener);
  return () => {
    localeLoadedListeners.delete(listener);
  };
}

export function ensureLocaleLoaded(lang: ResolvedLanguage): Promise<TranslationDictionary> {
  if (LOCALES[lang]) {
    return Promise.resolve(LOCALES[lang]!);
  }
  const existing = localeLoadPromises.get(lang);
  if (existing) return existing;

  const loader = (async (): Promise<TranslationDictionary> => {
    let dict: TranslationDictionary = en;
    switch (lang) {
      case 'ur-latn':
        dict = (await import('./locales/ur-latn')).urLatn;
        break;
      case 'ur':
        dict = (await import('./locales/ur')).ur;
        break;
      case 'es':
        dict = (await import('./locales/es')).es;
        break;
      case 'zh':
        dict = (await import('./locales/zh')).zh;
        break;
      case 'hi':
        dict = (await import('./locales/hi')).hi;
        break;
      case 'ar':
        dict = (await import('./locales/ar')).ar;
        break;
      case 'fr':
        dict = (await import('./locales/fr')).fr;
        break;
      case 'en':
      default:
        dict = en;
        break;
    }
    LOCALES[lang] = dict;
    for (const cb of localeLoadedListeners) {
      try {
        cb(lang);
      } catch {
        // Ignore subscriber error
      }
    }
    return dict;
  })().finally(() => {
    localeLoadPromises.delete(lang);
  });

  localeLoadPromises.set(lang, loader);
  return loader;
}

function ensureScriptFontLoaded(resolved: ResolvedLanguage): void {
  if (typeof document === 'undefined' || !document.head) return;
  let href = '';
  let id = '';
  if (resolved === 'ur' || resolved === 'ar') {
    id = 'boardly-script-font-rtl';
    href =
      'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap';
  } else if (resolved === 'hi') {
    id = 'boardly-script-font-hi';
    href =
      'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap';
  } else if (resolved === 'zh') {
    id = 'boardly-script-font-zh';
    href =
      'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap';
  }
  if (!href || !id) return;
  if (
    document.getElementById(id) ||
    document.getElementById(`boardly-script-font-${resolved}`)
  ) {
    return;
  }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print';
  link.onload = () => {
    link.media = 'all';
  };
  document.head.appendChild(link);
}

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
  if (resolved !== 'en' && !LOCALES[resolved]) {
    void ensureLocaleLoaded(resolved);
  }
  if (typeof document === 'undefined') return;
  const meta = getLanguageMeta(resolved);
  const root = document.documentElement;
  root.setAttribute('lang', meta.htmlLang);
  root.setAttribute('dir', meta.dir);
  root.setAttribute('data-lang', resolved);
  ensureScriptFontLoaded(resolved);
}

const FALLBACK_PLACEHOLDER_VALUES: Record<string, string> = {
  level: '1',
  count: '0',
  amount: '0',
  days: '0',
  xp: '0',
  score: '0',
  points: '0',
  rank: '1',
  action: 'continue on Boardly',
};

function interpolate(template: string, params?: TranslationParams): string {
  if (!template.includes('{{')) return template;
  let hadMissingParam = false;
  const replaced = template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const val = params?.[key];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      return String(val);
    }
    const fallback = FALLBACK_PLACEHOLDER_VALUES[key];
    if (fallback !== undefined) {
      return fallback;
    }
    hadMissingParam = true;
    return '';
  });
  if (!hadMissingParam) return replaced;
  return replaced
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
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
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return '0';
  const meta = getLanguageMeta(lang);
  try {
    return new Intl.NumberFormat(meta.intlLocale, {
      numberingSystem: 'latn',
      ...options,
    } as Intl.NumberFormatOptions).format(numeric);
  } catch {
    return numeric.toLocaleString('en-US');
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
