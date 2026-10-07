import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from './resources';

export const STORAGE_KEY_LOCALE = 'arch-tech-locale';
export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const detector = new LanguageDetector();
detector.init({
  order: ['localStorage', 'navigator'],
  lookupLocalStorage: STORAGE_KEY_LOCALE,
  caches: ['localStorage'],
});

i18n
  .use(detector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LOCALES,
    fallbackLng: 'en',
    defaultNS: 'common',
    fallbackNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Guarantee authoritative synchronization with localStorage, document lang, and legacy event listeners
if (typeof window !== 'undefined') {
  const syncLocaleState = (lng: string) => {
    const normalized: SupportedLocale = lng.startsWith('es') ? 'es' : 'en';
    if (document.documentElement.lang !== normalized) {
      document.documentElement.lang = normalized;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY_LOCALE, normalized);
    } catch {
      // Ignore quota errors
    }
    window.dispatchEvent(new CustomEvent('arch-tech-locale-change', { detail: normalized }));
  };

  syncLocaleState(i18n.language || 'en');

  i18n.on('languageChanged', (lng) => {
    syncLocaleState(lng);
  });
}

export default i18n;
