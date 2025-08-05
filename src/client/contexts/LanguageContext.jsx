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
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  const changeLanguage = (newLang) => {
    if (['pl', 'en', 'fr'].includes(newLang)) {
      setLanguage(newLang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};