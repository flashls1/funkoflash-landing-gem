import React from 'react';

interface ComingSoonProps {
  locale?: 'en' | 'es';
}

export function ComingSoon({ locale = 'en' }: ComingSoonProps) {
  const t = locale === 'es'
    ? { 
        title: 'Próximamente — Google Calendar', 
        sub: 'La importación/sincronización se añadirá aquí.' 
      }
    : { 
        title: 'Coming soon — Google Calendar', 
        sub: 'Import/sync will be added here.' 
      };

  return (
    <div 
      role="status" 
      aria-live="polite"
      className="inline-flex items-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2 text-sm text-muted-foreground"
    >
      <span className="font-medium">{t.title}</span>
      <span className="opacity-70">{t.sub}</span>
    </div>
  );
}