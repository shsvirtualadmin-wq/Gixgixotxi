export type ResolvedLanguage =
  | 'en'
  | 'ur-latn'
  | 'ur'
  | 'es'
  | 'zh'
  | 'hi'
  | 'ar'
  | 'fr';

export type AppLanguage = ResolvedLanguage | 'auto';

export interface LanguageMeta {
  code: ResolvedLanguage;
  /** Displayed in the language's own name and script */
  nativeLabel: string;
  /** HTML lang attribute value (BCP 47) */
  htmlLang: string;
  /** Document text direction */
  dir: 'ltr' | 'rtl';
  /** Intl locale tag used for numbers, PKR prices, and dates */
  intlLocale: string;
}

export const LANGUAGE_META: Record<ResolvedLanguage, LanguageMeta> = {
  en: {
    code: 'en',
    nativeLabel: 'English',
    htmlLang: 'en',
    dir: 'ltr',
    intlLocale: 'en-PK',
  },
  'ur-latn': {
    code: 'ur-latn',
    nativeLabel: 'Roman Urdu',
    htmlLang: 'ur-Latn',
    dir: 'ltr',
    intlLocale: 'en-PK',
  },
  ur: {
    code: 'ur',
    nativeLabel: 'اردو',
    htmlLang: 'ur',
    dir: 'rtl',
    intlLocale: 'ur-PK',
  },
  es: {
    code: 'es',
    nativeLabel: 'Español',
    htmlLang: 'es',
    dir: 'ltr',
    intlLocale: 'es-ES',
  },
  zh: {
    code: 'zh',
    nativeLabel: '中文',
    htmlLang: 'zh',
    dir: 'ltr',
    intlLocale: 'zh-CN',
  },
  hi: {
    code: 'hi',
    nativeLabel: 'हिन्दी',
    htmlLang: 'hi',
    dir: 'ltr',
    intlLocale: 'hi-IN',
  },
  ar: {
    code: 'ar',
    nativeLabel: 'العربية',
    htmlLang: 'ar',
    dir: 'rtl',
    intlLocale: 'ar',
  },
  fr: {
    code: 'fr',
    nativeLabel: 'Français',
    htmlLang: 'fr',
    dir: 'ltr',
    intlLocale: 'fr-FR',
  },
};

export const ORDERED_LANGUAGES: ResolvedLanguage[] = [
  'en',
  'ur-latn',
  'ur',
  'es',
  'zh',
  'hi',
  'ar',
  'fr',
];

export const VALID_APP_LANGUAGES: ReadonlySet<string> = new Set<AppLanguage>([
  'en',
  'ur-latn',
  'ur',
  'es',
  'zh',
  'hi',
  'ar',
  'fr',
  'auto',
]);

export type TranslationParams = Record<string, string | number | null | undefined>;
export type TranslationDictionary = Record<string, string>;
