// Safe locale utility
export function safeLocale(locale?: string): 'en' | 'es' {
  return locale === 'es' ? 'es' : 'en';
}

export function getSafeLocale(): 'en' | 'es' {
  if (typeof window === 'undefined') return 'en';
  
  const stored = localStorage.getItem('ffLang');
  if (stored === 'es' || stored === 'en') return stored;
  
  const browserLang = navigator.language?.toLowerCase();
  return browserLang?.startsWith('es') ? 'es' : 'en';
}

export function setPersistentLanguage(language: 'en' | 'es'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ffLang', language);
}

export function getPersistentLanguage(): 'en' | 'es' {
  return getSafeLocale();
}