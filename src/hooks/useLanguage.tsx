import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { t, type Language } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Keep the document in sync: screen readers pick pronunciation from <html lang>,
  // and the tab title is the first thing announced when the page loads.
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t('app.documentTitle', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
