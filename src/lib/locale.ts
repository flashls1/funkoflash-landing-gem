export type Locale = "en" | "es";

export function normalizeLocale(input?: string | null): Locale {
  if (!input) return "en";
  const v = input.toLowerCase();
  if (v === "es" || v.startsWith("es-")) return "es";
  return "en";
}

/** SSR-safe browser locale detection */
export function getBrowserLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const lang = window.navigator?.language || (window.navigator as any)?.userLanguage;
    return normalizeLocale(lang || "");
  } catch {
    return "en";
  }
}

/** Resolve preferred locale using the priority:
 * 1) explicitOverride
 * 2) profileLocale
 * 3) browser
 * 4) fallback 'en'
 */
export function resolvePreferredLocale(
  explicitOverride?: Locale,
  profileLocale?: string | null
): Locale {
  if (explicitOverride) return explicitOverride;
  const fromProfile = normalizeLocale(profileLocale || "");
  if (fromProfile !== "en") return fromProfile;
  return getBrowserLocale();
}

export function formatGreeting(name: string, locale: Locale, date: Date = new Date()): { greeting: string; dateText: string; } {
  const h = date.getHours();
  if (locale === "es") {
    const g = h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
    const d = date.toLocaleDateString("es-MX", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return { greeting: `${g}, ${name}`, dateText: d };
  }
  const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const d = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return { greeting: `${g}, ${name}`, dateText: d };
}

export function tOnline(locale: Locale): string {
  return locale === "es" ? "En línea" : "Online";
}
export function tOffline(locale: Locale): string {
  return locale === "es" ? "Desconectado" : "Offline";
}
export function tInvisibleLabel(invisible: boolean, locale: Locale): string {
  return locale === "es"
    ? `Invisible: ${invisible ? "Activado" : "Desactivado"}`
    : `Invisible: ${invisible ? "On" : "Off"}`;
}
export function tBack(locale: Locale): string {
  return locale === "es" ? "Regresar al Panel" : "Back to Dashboard";
}