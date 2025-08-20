// Safe locale utility
export function safeLocale(locale?: string): 'en' | 'es' {
  return locale === 'es' ? 'es' : 'en';
}

export function getSafeLocale(): 'en' | 'es' {
  if (typeof window === 'undefined') return 'en';
  
  const stored = localStorage.getItem('language');
  if (stored === 'es' || stored === 'en') return stored;
  
  const browserLang = navigator.language?.toLowerCase();
  return browserLang?.startsWith('es') ? 'es' : 'en';
}