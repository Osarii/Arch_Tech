import { useEffect, useState } from 'react';
import i18n from '../i18n';
import { resources } from '../i18n/resources';

export type SiteLocale = 'en' | 'es';

export const STORAGE_KEY_LOCALE = 'arch-tech-locale';
export const SUPPORTED_LOCALES: SiteLocale[] = ['en', 'es'];

export function getStoredLocale(): SiteLocale {
  if (typeof window === 'undefined') {
    return i18n.language?.startsWith('es') ? 'es' : 'en';
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY_LOCALE);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    // LocalStorage quota or access error
  }
  return i18n.language?.startsWith('es') ? 'es' : 'en';
}

const listeners = new Set<(locale: SiteLocale) => void>();

export function setStoredLocale(locale: SiteLocale): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_LOCALE, locale);
    document.documentElement.lang = locale;
    window.dispatchEvent(new CustomEvent('arch-tech-locale-change', { detail: locale }));
  } catch {
    // LocalStorage error fallback
  }
  if (i18n.language !== locale) {
    i18n.changeLanguage(locale);
  }
  listeners.forEach((listener) => listener(locale));
}

export function subscribeLocale(listener: (locale: SiteLocale) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

i18n.on('languageChanged', (lng: string) => {
  const norm: SiteLocale = lng.startsWith('es') ? 'es' : 'en';
  listeners.forEach((listener) => listener(norm));
});

// Canonical i18n resource mappings avoiding duplicate translation dictionaries
export const landingTranslations = {
  en: resources.en.landing,
  es: resources.es.landing,
};

export const portalAiTranslations = {
  en: resources.en.ai,
  es: resources.es.ai,
};

export const a11yPanelTranslations = {
  en: resources.en.accessibility,
  es: resources.es.accessibility,
};

export const publicNewsTranslations = {
  en: resources.en.news,
  es: resources.es.news,
};

export const publicProjectTranslations = {
  en: resources.en.public,
  es: resources.es.public,
};

export const portalShellTranslations = {
  en: (resources.en.portal as any).shell,
  es: (resources.es.portal as any).shell,
};

export const portalCommonTranslations = {
  en: resources.en.portal,
  es: resources.es.portal,
};

export const clientPortalTranslations = {
  en: resources.en.client,
  es: resources.es.client,
};

export const architectPortalTranslations = {
  en: resources.en.architect,
  es: resources.es.architect,
};

export const adminPortalTranslations = {
  en: resources.en.admin,
  es: resources.es.admin,
};

export function useLocale() {
  const [locale, setLocaleState] = useState<SiteLocale>(getStoredLocale());

  useEffect(() => {
    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<SiteLocale>;
      if (customEvent.detail === 'en' || customEvent.detail === 'es') {
        setLocaleState(customEvent.detail);
      } else {
        setLocaleState(getStoredLocale());
      }
    };

    const unsubscribe = subscribeLocale((newLocale) => {
      setLocaleState(newLocale);
    });

    window.addEventListener('arch-tech-locale-change', handleLocaleChange);
    return () => {
      unsubscribe();
      window.removeEventListener('arch-tech-locale-change', handleLocaleChange);
    };
  }, []);

  const changeLocale = (newLocale: SiteLocale) => {
    setStoredLocale(newLocale);
    setLocaleState(newLocale);
  };

  const t = {
    landing: landingTranslations[locale],
    portalAi: portalAiTranslations[locale],
    a11yPanel: a11yPanelTranslations[locale],
    publicNews: publicNewsTranslations[locale],
    publicProject: publicProjectTranslations[locale],
    portalShell: portalShellTranslations[locale],
    portalCommon: portalCommonTranslations[locale],
    clientPortal: clientPortalTranslations[locale],
    architectPortal: architectPortalTranslations[locale],
    adminPortal: adminPortalTranslations[locale],
  };

  return {
    locale,
    setLocale: changeLocale,
    landing: t.landing,
    portalAi: t.portalAi,
    a11yPanel: t.a11yPanel,
    publicNews: t.publicNews,
    publicProject: t.publicProject,
    portalShell: t.portalShell,
    portalCommon: t.portalCommon,
    clientPortal: t.clientPortal,
    architectPortal: t.architectPortal,
    adminPortal: t.adminPortal,
    t,
  };
}
