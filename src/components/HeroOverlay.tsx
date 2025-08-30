import React from "react";
import type { Locale } from "@/lib/locale";
import { resolvePreferredLocale, formatGreeting, tOnline, tOffline, tInvisibleLabel } from "@/lib/locale";

type Role = "admin" | "staff" | "business" | "talent";

type User = {
  name: string;
  avatarUrl?: string;
  isOnline?: boolean;
  businessName?: string | null;
  profileLocale?: string | null; // optional: stored user preference, e.g., "es-MX" or "en"
};

type Props = {
  role: Role;
  user: User;
  invisibleMode: boolean;
  onToggleInvisible: () => void;
  // Optional explicit override; if omitted we use profile + browser
  locale?: Locale;
};

function getAdminStrings(name: string) {
  const now = new Date();
  const h = now.getHours();
  const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const d = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return { greeting: `${g}, ${name}`, dateText: d };
}

export default function HeroOverlay({
  role,
  user,
  invisibleMode,
  onToggleInvisible,
  locale,
}: Props) {
  const { name, avatarUrl, isOnline, businessName, profileLocale } = user;

  // Admin: force EN
  const effectiveLocale: Locale =
    role === "admin" ? "en" : resolvePreferredLocale(locale, profileLocale);

  const { greeting, dateText } =
    role === "admin" ? getAdminStrings(name) : formatGreeting(name, effectiveLocale);

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="absolute inset-0 p-3 sm:p-4 md:p-5 text-white">
      <div className="relative h-full w-full">
        {/* TOP-RIGHT: Online + Invisible (equal right margin as greeting/date) */}
        <div className="absolute right-3 top-3 sm:right-4 sm:top-4 md:right-5 md:top-5 flex flex-col items-end gap-2 sm:gap-2.5">
          <span
            className="inline-flex items-center rounded-full px-2 py-1
                       text-[11px] sm:text-xs font-medium
                       bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30"
            aria-label={isOnline ? tOnline(effectiveLocale) : tOffline(effectiveLocale)}
            role="status"
          >
            <span className="mr-1 text-[10px]">●</span>
            {isOnline ? tOnline(effectiveLocale) : tOffline(effectiveLocale)}
          </span>
          <button
            type="button"
            aria-pressed={invisibleMode}
            aria-label="Toggle Invisible Mode"
            onClick={onToggleInvisible}
            className="inline-flex items-center rounded-full px-2 py-1
                       text-[11px] sm:text-xs font-medium
                       bg-white/10 hover:bg-white/15 active:bg-white/20
                       ring-1 ring-white/25 backdrop-blur"
          >
            {tInvisibleLabel(invisibleMode, effectiveLocale)}
          </button>
        </div>

        {/* BOTTOM-RIGHT: Greeting + Date (shares the same right margin) */}
        <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 md:right-5 md:bottom-5 text-right space-y-0.5">
          <div className="text-xs sm:text-sm md:text-base font-semibold leading-tight line-clamp-1">
            {greeting}
          </div>
          <div className="text-[11px] sm:text-xs md:text-sm text-neutral-200/85 leading-tight line-clamp-1">
            {dateText}
          </div>
        </div>

        {/* LEFT-CENTER: Avatar + stacked Name/Role/(Business) with equal left margin */}
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2
                     flex flex-col items-start text-left min-w-0"
          style={{ maxWidth: "80vw" }}
        >
          <img
            src={avatarUrl || "/images/avatar-fallback.png"}
            alt="Profile avatar"
            className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full object-cover ring-2 ring-white/10"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
            }}
          />
          <div className="mt-2 space-y-0.5">
            <div className="text-sm sm:text-base md:text-lg font-semibold leading-tight line-clamp-1 max-w-[70vw]">
              {name}
            </div>
            <div className="text-[11px] sm:text-xs md:text-sm text-neutral-200/90 leading-tight">
              {roleLabel}
            </div>
            {businessName && (
              <div className="text-[11px] sm:text-xs md:text-sm text-neutral-200/85 leading-tight line-clamp-1 max-w-[72vw]">
                {businessName}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}