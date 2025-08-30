import React from "react";

type Role = "admin" | "staff" | "business" | "talent";

type User = {
  name: string;
  avatarUrl?: string;
  isOnline?: boolean;
  businessName?: string | null;
};

type Props = {
  role: Role;
  user: User;
  invisibleMode: boolean;
  onToggleInvisible: () => void;
  onBack: () => void;
  greeting?: string; // pass for non-admin roles (localized as needed)
  dateText?: string; // pass for non-admin roles (localized as needed)
};

// Admin strings forced to English
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
  onBack,
  greeting,
  dateText,
}: Props) {
  const { name, avatarUrl, isOnline, businessName } = user;
  const enforced = role === "admin" ? getAdminStrings(name) : { greeting, dateText };
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="absolute inset-0 p-4 sm:p-6 md:p-8 text-white">
      {/* Top bar: Back control (keep subtle but always present) */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Dashboard"
          className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 ring-1 ring-white/20 backdrop-blur text-sm font-medium"
        >
          Back
        </button>
      </div>

      {/* Core area */}
      <div className="relative h-full w-full">
        {/* Bottom-right greeting + date */}
        <div className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6 md:right-8 md:bottom-8 text-right space-y-1">
          <div className="text-sm sm:text-base md:text-lg font-semibold leading-tight line-clamp-1">
            {enforced.greeting || greeting}
          </div>
          <div className="text-xs sm:text-sm text-neutral-200/85 leading-tight line-clamp-1">
            {enforced.dateText || dateText}
          </div>
        </div>

        {/* Centered avatar block with right-side status + invisible */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     flex items-start justify-center gap-3 sm:gap-4 md:gap-6"
          style={{ maxWidth: "100%" }}
        >
          {/* Center stack: avatar + name + role + optional business */}
          <div className="flex flex-col items-center text-center min-w-0">
            <img
              src={avatarUrl || "/images/avatar-fallback.png"}
              alt="Profile avatar"
              className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full object-cover ring-2 ring-white/10"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
              }}
            />
            <div className="mt-3 space-y-0.5">
              <div className="text-base sm:text-lg md:text-xl font-semibold leading-tight line-clamp-1 max-w-[70vw]">
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

          {/* Right column: status + invisible (compact, proportional) */}
          <div className="flex flex-col items-start justify-start pt-1 gap-2 sm:gap-2.5">
            <span
              className="inline-flex items-center rounded-full px-2 py-1
                         text-[11px] sm:text-xs font-medium
                         bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30"
              aria-label={isOnline ? "Online" : "Offline"}
              role="status"
            >
              <span className="mr-1 text-[10px]">●</span>
              {isOnline ? "Online" : "Offline"}
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
              Invisible: {invisibleMode ? "On" : "Off"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}