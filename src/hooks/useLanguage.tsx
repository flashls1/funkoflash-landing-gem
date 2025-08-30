
// Language context + hook, Spanish-first default
import { createContext, useContext, useMemo, useState, ReactNode, useEffect } from "react";

export type LanguageCode = "es" | "en";
type LanguageContextType = {
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
  t: (key: string) => string;
};

// Minimal in-file dictionary so we don't crash; project may swap in a fuller i18n later.
const DICT: Record<LanguageCode, Record<string, string>> = {
  es: {
    "nav.home": "Inicio",
    "nav.shop": "Tienda",
    "nav.talent": "Directorio de Talento",
    "nav.events": "Eventos",
    "nav.about": "Acerca de",
    "nav.contact": "Contacto",
    "auth.dashboard": "Panel",
    "auth.logout": "Cerrar sesión",
    "cta.request_access": "Solicitar acceso",
    "login.forgot": "¿Olvidaste tu contraseña?",
    "login.greeting.morning": "Buenos días",
    "login.greeting.afternoon": "Buenas tardes",
    "login.greeting.evening": "Buenas noches",
  },
  en: {
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.talent": "Talent Directory",
    "nav.events": "Events",
    "nav.about": "About",
    "nav.contact": "Contact",
    "auth.dashboard": "Dashboard",
    "auth.logout": "Log Out",
    "cta.request_access": "Request Access",
    "login.forgot": "Forgot Password",
    "login.greeting.morning": "Good morning",
    "login.greeting.afternoon": "Good afternoon",
    "login.greeting.evening": "Good evening",
  },
};

export const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Spanish-first default
  const [lang, setLang] = useState<LanguageCode>("es");

  // Pick up persisted pref if present (non-blocking)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ff.lang");
      if (saved === "en" || saved === "es") setLang(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("ff.lang", lang);
    } catch {}
  }, [lang]);

  const t = useMemo(() => {
    return (key: string) => DICT[lang]?.[key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

export default useLanguage; // allow default import for legacy callers
