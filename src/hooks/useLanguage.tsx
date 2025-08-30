import { useState, useEffect } from 'react';
import { getPersistentLanguage, setPersistentLanguage } from '@/utils/locale';

export function useLanguage() {
  const [language, setLanguageState] = useState<'en' | 'es'>(() => getPersistentLanguage());

  const setLanguage = (lang: 'en' | 'es') => {
    setLanguageState(lang);
    setPersistentLanguage(lang);
  };

  useEffect(() => {
    // Initialize with persistent language on mount
    const persistentLang = getPersistentLanguage();
    if (persistentLang !== language) {
      setLanguageState(persistentLang);
    }
  }, []);

  return { language, setLanguage };
}