import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import {
  applyDocumentLanguage,
  detectSystemLanguage,
  formatDate,
  formatNumber,
  formatPKR,
  formatRelativeTime,
  getDisplayLabelForSetting,
  getLanguageMeta,
  normalizeAppLanguage,
  readBootStoredLanguage,
  readStoredLanguageForUid,
  resolveLanguage,
  translate,
  writeStoredLanguage,
  type AppLanguage,
  type ResolvedLanguage,
  type TranslationParams,
} from '@/i18n';

export interface LanguageContextValue {
  /** User's saved preference ('en' | 'ur-latn' | 'ur' | 'es' | 'zh' | 'hi' | 'ar' | 'fr' | 'auto') */
  language: AppLanguage;
  /** Resolved concrete language ('en' | 'ur-latn' | 'ur' | 'es' | 'zh' | 'hi' | 'ar' | 'fr') */
  resolvedLanguage: ResolvedLanguage;
  /** Current system-detected language (useful for "System default (English)" subtitle) */
  systemLanguage: ResolvedLanguage;
  /** Layout direction ('ltr' | 'rtl') */
  dir: 'ltr' | 'rtl';
  /** Convenience flag for RTL layout checks */
  isRtl: boolean;
  /** BCP 47 HTML lang attribute ('en', 'ur-Latn', 'ur', 'es', 'zh', 'hi', 'ar', 'fr') */
  htmlLang: string;
  /** Intl locale tag for formatting */
  intlLocale: string;
  /** Updates language instantly across the app and persists to user settings + localStorage */
  setLanguage: (next: AppLanguage) => Promise<void>;
  /** Reactive translation helper */
  t: (key: string, params?: TranslationParams) => string;
  /** Display label for the current or given language setting */
  getLanguageLabel: (setting?: AppLanguage) => string;
  /** Locale-aware formatters */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPKR: (amount: number) => string;
  formatDate: (input: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (input: Date | number | string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isGuest, updateLocalProfile } = useAuth();

  const [language, setLanguageState] = useState<AppLanguage>(() => readBootStoredLanguage());
  const [systemLanguage, setSystemLanguage] = useState<ResolvedLanguage>(() =>
    detectSystemLanguage()
  );

  // Track which UID we last synced so account switches immediately apply that account's language
  // without leaking the previous account's preference.
  const lastSyncedUidRef = useRef<string | null>(null);
  const localMutationPendingRef = useRef<{ uid: string | null; lang: AppLanguage; ts: number } | null>(
    null
  );

  const resolvedLanguage = useMemo<ResolvedLanguage>(
    () => (language === 'auto' ? systemLanguage : resolveLanguage(language)),
    [language, systemLanguage]
  );

  const meta = useMemo(() => getLanguageMeta(resolvedLanguage), [resolvedLanguage]);

  // Apply dir, lang, and data-lang synchronously on every resolvedLanguage change
  useEffect(() => {
    applyDocumentLanguage(resolvedLanguage);
  }, [resolvedLanguage]);

  // React to OS / browser language changes when set to 'auto'
  useEffect(() => {
    const onLanguageChange = () => {
      setSystemLanguage(detectSystemLanguage());
    };
    window.addEventListener('languagechange', onLanguageChange);
    return () => window.removeEventListener('languagechange', onLanguageChange);
  }, []);

  // Sync per-account language on login, logout, or account switch
  useEffect(() => {
    const uid = user?.uid ?? null;
    const isNewAccount = uid !== lastSyncedUidRef.current;

    if (!uid) {
      lastSyncedUidRef.current = null;
      return;
    }

    const profileMatchesUser = profile && (profile.uid === uid || !profile.uid);
    const profileLang = profileMatchesUser
      ? normalizeAppLanguage(profile?.appLanguage)
      : null;
    const storedForUid = readStoredLanguageForUid(uid);

    // Avoid clobbering a just-clicked language change before Firestore echoes back
    const pending = localMutationPendingRef.current;
    if (
      pending &&
      pending.uid === uid &&
      Date.now() - pending.ts < 4000
    ) {
      if (profileLang === pending.lang) {
        localMutationPendingRef.current = null;
      }
      lastSyncedUidRef.current = uid;
      return;
    }

    if (profileLang) {
      lastSyncedUidRef.current = uid;
      if (profileLang !== language) {
        setLanguageState(profileLang);
      }
      writeStoredLanguage(profileLang, uid);
      return;
    }

    if (storedForUid) {
      lastSyncedUidRef.current = uid;
      if (storedForUid !== language) {
        setLanguageState(storedForUid);
      }
      writeStoredLanguage(storedForUid, uid);
      return;
    }

    // Account switched to a different user who has no saved language preference yet -> default to 'en'
    // so Account A's language never bleeds into Account B.
    if (isNewAccount && profileMatchesUser) {
      lastSyncedUidRef.current = uid;
      if (language !== 'en') {
        setLanguageState('en');
      }
      writeStoredLanguage('en', uid);
    } else if (isNewAccount) {
      lastSyncedUidRef.current = uid;
    }
  }, [user?.uid, profile, language]);

  const setLanguage = useCallback(
    async (next: AppLanguage) => {
      const normalized = normalizeAppLanguage(next) ?? 'en';
      const uid = user?.uid ?? null;

      localMutationPendingRef.current = {
        uid,
        lang: normalized,
        ts: Date.now(),
      };

      // Instant in-memory + DOM update (no reload, no logout)
      setLanguageState(normalized);
      applyDocumentLanguage(resolveLanguage(normalized));
      writeStoredLanguage(normalized, uid);

      if (uid) {
        try {
          updateLocalProfile({ appLanguage: normalized });
        } catch {
          // non-fatal
        }

        if (!isGuest && !uid.startsWith('guest_')) {
          try {
            await setDoc(
              doc(db, 'users', uid),
              {
                appLanguage: normalized,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          } catch (err) {
            if (import.meta.env.DEV) {
              console.warn('[LanguageContext] Could not persist appLanguage to Firestore:', err);
            }
          }
        }
      }
    },
    [user?.uid, isGuest, updateLocalProfile]
  );

  const tFn = useCallback(
    (key: string, params?: TranslationParams) => translate(resolvedLanguage, key, params),
    [resolvedLanguage]
  );

  const getLanguageLabel = useCallback(
    (setting: AppLanguage = language) => getDisplayLabelForSetting(setting, resolvedLanguage),
    [language, resolvedLanguage]
  );

  const formatNumberFn = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, resolvedLanguage, options),
    [resolvedLanguage]
  );

  const formatPKRFn = useCallback(
    (amount: number) => formatPKR(amount, resolvedLanguage),
    [resolvedLanguage]
  );

  const formatDateFn = useCallback(
    (input: Date | number | string, options?: Intl.DateTimeFormatOptions) =>
      formatDate(input, resolvedLanguage, options),
    [resolvedLanguage]
  );

  const formatRelativeTimeFn = useCallback(
    (input: Date | number | string) => formatRelativeTime(input, resolvedLanguage),
    [resolvedLanguage]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      resolvedLanguage,
      systemLanguage,
      dir: meta.dir,
      isRtl: meta.dir === 'rtl',
      htmlLang: meta.htmlLang,
      intlLocale: meta.intlLocale,
      setLanguage,
      t: tFn,
      getLanguageLabel,
      formatNumber: formatNumberFn,
      formatPKR: formatPKRFn,
      formatDate: formatDateFn,
      formatRelativeTime: formatRelativeTimeFn,
    }),
    [
      language,
      resolvedLanguage,
      systemLanguage,
      meta.dir,
      meta.htmlLang,
      meta.intlLocale,
      setLanguage,
      tFn,
      getLanguageLabel,
      formatNumberFn,
      formatPKRFn,
      formatDateFn,
      formatRelativeTimeFn,
    ]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Graceful fallback if ever invoked outside provider (e.g., error boundary)
    const fallbackResolved = resolveLanguage(readBootStoredLanguage());
    const meta = getLanguageMeta(fallbackResolved);
    return {
      language: fallbackResolved,
      resolvedLanguage: fallbackResolved,
      systemLanguage: detectSystemLanguage(),
      dir: meta.dir,
      isRtl: meta.dir === 'rtl',
      htmlLang: meta.htmlLang,
      intlLocale: meta.intlLocale,
      setLanguage: async () => {},
      t: (key, params) => translate(fallbackResolved, key, params),
      getLanguageLabel: (setting = fallbackResolved) =>
        getDisplayLabelForSetting(setting, fallbackResolved),
      formatNumber: (v, opts) => formatNumber(v, fallbackResolved, opts),
      formatPKR: (a) => formatPKR(a, fallbackResolved),
      formatDate: (i, opts) => formatDate(i, fallbackResolved, opts),
      formatRelativeTime: (i) => formatRelativeTime(i, fallbackResolved),
    };
  }
  return ctx;
}

export const useTranslation = useLanguage;
