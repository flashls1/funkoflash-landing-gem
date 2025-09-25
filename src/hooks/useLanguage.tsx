import { useState, useEffect } from 'react';
import { getPersistentLanguage, setPersistentLanguage } from '@/utils/locale';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useLanguage() {
  const { profile } = useAuth();
  const [language, setLanguageState] = useState<'en' | 'es'>(() => getPersistentLanguage());

  const setLanguage = async (lang: 'en' | 'es') => {
    setLanguageState(lang);
    setPersistentLanguage(lang);
    
    // Update user profile with preferred language
    if (profile?.user_id) {
      try {
        await supabase
          .from('profiles')
          .update({ preferred_language: lang })
          .eq('user_id', profile.user_id);
      } catch (error) {
        console.error('Error updating preferred language:', error);
      }
    }
  };

  useEffect(() => {
    // Initialize with user's preferred language from profile or persistent storage  
    const profileLang = (profile as any)?.preferred_language;
    if (profileLang && (profileLang === 'en' || profileLang === 'es')) {
      setLanguageState(profileLang);
    } else {
      const persistentLang = getPersistentLanguage();
      if (persistentLang !== language) {
        setLanguageState(persistentLang);
      }
    }
  }, [(profile as any)?.preferred_language]);

  return { language, setLanguage };
}