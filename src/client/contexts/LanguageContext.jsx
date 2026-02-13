import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Sprawdź zapisany język lub użyj języka przeglądarki
  const getInitialLanguage = () => {
    const saved = localStorage.getItem('language');
    if (saved && ['pl', 'en', 'fr'].includes(saved)) {
      return saved;
    }
    
    // Sprawdź język przeglądarki
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('pl')) return 'pl';
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('en')) return 'en';
    
    // Domyślnie polski
    return 'pl';
  };

  const [language, setLanguage] = useState(getInitialLanguage());

  useEffect(() => {
    try {
      localStorage.setItem('language', language);
      document.documentElement.lang = language;
    } catch (e) {
      // ignore storage errors in environments without localStorage
    }
  }, [language]);

  // Mapowanie kodu języka na locale do formatowania dat/liczb
  const languageToLocale = { pl: 'pl-PL', en: 'en-US', fr: 'fr-FR' };

  const t = (key) => {
    const keys = key.split('.');

    const resolve = (lang) => {
      let node = translations[lang];
      for (const k of keys) {
        node = node?.[k];
        if (node === undefined || node === null) return undefined;
      }
      return node;
    };

    // Try current language
    let value = resolve(language);
    if (value !== undefined) return value;

    // Fallback chain: pl -> en -> fr (excluding current if same)
    const fallbackOrder = ['pl', 'en', 'fr'].filter((l) => l !== language);
    for (const lang of fallbackOrder) {
      value = resolve(lang);
      if (value !== undefined) {
        if (process.env.NODE_ENV !== 'production') {
          try { console.warn(`[i18n] Missing key for '${language}': ${key}. Using fallback '${lang}'.`); } catch (e) {}
        }
        return value;
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      try { console.warn(`[i18n] Missing translation key in all languages: ${key}`); } catch (e) {}
    }
    // Last resort: return empty string to avoid showing raw keys in UI
    return '';
  };

  // Helper do formatowania dat zgodnie z wybranym językiem
  const formatDate = (dateLike) => {
    try {
      const locale = languageToLocale[language] || 'pl-PL';
      const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString(locale);
    } catch (e) {
      return '';
    }
  };

  // Helper do formatowania liczb zgodnie z wybranym językiem
  const formatNumber = (value, options) => {
    try {
      const locale = languageToLocale[language] || 'pl-PL';
      return new Intl.NumberFormat(locale, options).format(value);
    } catch (e) {
      return String(value ?? '');
    }
  };

  const changeLanguage = (newLang) => {
    if (['pl', 'en', 'fr'].includes(newLang)) {
      setLanguage(newLang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, formatDate, formatNumber }}>
      {children}
    </LanguageContext.Provider>
  );
};