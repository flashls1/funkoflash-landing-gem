import React from "react";

type Role = "admin" | "talent" | "business" | "staff";

type Props = {
  role: Role;
  user: { name: string; avatarUrl?: string; isOnline?: boolean };
  greeting?: string;
  dateText?: string;
  invisibleMode: boolean;
  onToggleInvisible: () => void;
  onBack: () => void;
  backgroundImageUrl?: string;
};

// Utility: Admin strings are forced to English.
function getAdminStrings() {
  const now = new Date();
  const cstTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
  const hours = cstTime.getHours();
  const firstName = "Admin"; // Fallback, will be overridden by actual name
  
  const greeting = hours < 12 
    ? `Good morning` 
    : hours < 18 
    ? `Good afternoon` 
    : `Good evening`;
    
  const dateText = cstTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago"
  });
  
  return { greeting, dateText };
}

export default function HeroOverlay({
  role,
  user,
  greeting,
  dateText,
  invisibleMode,
  onToggleInvisible,
  onBack,
  backgroundImageUrl
}: Props) {
  const enforced = role === "admin" ? getAdminStrings() : { greeting, dateText };

  return (
    <div className="relative w-full">
      {/* Hero image container */}
      <div 
        className="relative rounded-2xl overflow-hidden aspect-[16/7] md:aspect-[16/6] bg-black h-48"
        style={{
          backgroundImage: backgroundImageUrl 
            ? `url(${backgroundImageUrl})` 
            : "url('/lovable-uploads/bb29cf4b-64ec-424f-8221-3b283256e06d.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Gradient overlay for text readability */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent rounded-2xl pointer-events-none" 
          aria-hidden="true" 
        />

        {/* Overlay content */}
        <div
          className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8 text-white"
          role="region"
          aria-label="User header"
        >
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-3 items-center">
            {/* Col 1: Avatar + Name + Online status */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <img
                  src={user.avatarUrl || '/images/avatar-fallback.png'}
                  alt="Profile avatar"
                  className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full object-cover ring-2 ring-white/10"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
                  }}
                />
                {user.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full ring-2 ring-black"></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate text-white drop-shadow-lg">
                    {user.name}
                  </h1>
                  {user.isOnline && (
                    <span
                      className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5
                                 text-[10px] sm:text-xs font-medium bg-emerald-500/20 text-emerald-200
                                 ring-1 ring-emerald-400/30"
                      aria-label="Online"
                    >
                      ● Online
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-white/90 line-clamp-1 drop-shadow-lg">
                  {enforced.greeting || greeting}
                </div>
              </div>
            </div>

            {/* Col 2: Date */}
            <div className="flex md:justify-center">
              <div className="text-xs sm:text-sm md:text-base text-white/80 line-clamp-1 drop-shadow-lg">
                {enforced.dateText || dateText}
              </div>
            </div>

            {/* Col 3: Actions */}
            <div className="flex justify-between md:justify-end gap-3">
              <button
                type="button"
                aria-label="Back to Dashboard"
                onClick={onBack}
                className="h-11 px-3 sm:px-4 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20
                           ring-1 ring-white/20 backdrop-blur transition-all
                           text-sm sm:text-base font-medium text-white"
              >
                Back
              </button>
              <button
                type="button"
                aria-pressed={invisibleMode}
                aria-label="Toggle Invisible Mode"
                onClick={onToggleInvisible}
                className="h-11 px-3 sm:px-4 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20
                           ring-1 ring-white/20 backdrop-blur transition-all
                           text-sm sm:text-base font-medium text-white"
              >
                {invisibleMode ? "Invisible: On" : "Invisible: Off"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}