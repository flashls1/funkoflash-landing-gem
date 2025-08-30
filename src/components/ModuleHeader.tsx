import React from "react";
import type { Locale } from "@/lib/locale";
import { resolvePreferredLocale, tBack } from "@/lib/locale";

type ModuleHeaderProps = {
  title: string;
  onBack: () => void;
  // optional hints for locale resolution
  localeOverride?: Locale;
  profileLocale?: string | null;
  role?: "admin" | "staff" | "business" | "talent";
};

export default function ModuleHeader({
  title,
  onBack,
  localeOverride,
  profileLocale,
  role = "staff",
}: ModuleHeaderProps) {
  const effective =
    role === "admin" ? "en" : resolvePreferredLocale(localeOverride, profileLocale);

  return (
    <header className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white/5 ring-1 ring-white/10 text-white">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={tBack(effective)}
          className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 ring-1 ring-white/20 backdrop-blur text-sm font-medium"
        >
          {tBack(effective)}
        </button>
        <h1 className="text-base sm:text-lg md:text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">{/* optional actions */}</div>
    </header>
  );
}