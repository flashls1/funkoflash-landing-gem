
import React from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useSiteDesign } from "@/hooks/useSiteDesign";
import { useColorTheme } from "@/hooks/useColorTheme";
import { supabase } from "@/integrations/supabase/client";

type RawSettings = {
  backgroundMedia?: string;
  mediaType?: "image" | "video";
  overlayOpacity?: number;
  height?: string;
  position?: { x: number; y: number };
  scale?: number;
};

type Presence = "online" | "offline" | "invisible";

function greeting(date: Date, lang: string) {
  const h = date.getHours();
  if (lang === "es") {
    if (h < 12) return "Buenos días";
    if (h < 18) return "Buenas tardes";
    return "Buenas noches";
  } else {
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }
}

export default function AdminHero() {
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const site = useSiteDesign();

  const [raw, setRaw] = React.useState<RawSettings | null>(null);
  const [bg, setBg] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  // Load page settings
  React.useEffect(() => {
    try {
      const cfg = site.getCurrentPageSettings(pathname) as any;
      setRaw(cfg?.settings ?? cfg ?? null);
    } catch { 
      setRaw(null); 
    }
  }, [pathname, site]);

  // Load user profile and background
  React.useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user?.id) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("first_name,last_name,avatar_url,background_image_url")
        .eq("user_id", u.user.id)
        .maybeSingle();
      
      if (data) {
        const full = [data.first_name, data.last_name].filter(Boolean).join(" ");
        setName(full || u.user.user_metadata?.name || u.user.email || "User");
        setAvatarUrl(data.avatar_url ?? null);
        
        // Set background from page settings first, then profile fallback
        if (raw?.backgroundMedia) {
          setBg(raw.backgroundMedia);
        } else if (data.background_image_url) {
          setBg(data.background_image_url);
        }
      }
    })();
  }, [raw?.backgroundMedia]);

  // Fixed hero height: 240px
  const heightClass = "h-[240px]";
  const nowCST = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const greet = greeting(nowCST, language);

  return (
    <section className="relative w-full rounded-xl overflow-hidden border border-border mb-6">
      <div className={heightClass}>
        {bg ? (
          <img src={bg} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-600/20 to-blue-600/20" />
        )}
      </div>

      {/* Simple overlay with user info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-4 left-4 flex items-center gap-3">
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="avatar" 
            className="w-16 h-16 rounded-full object-cover border-2 border-white/20" 
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
            <span className="text-white/70 text-xl font-medium">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="leading-tight">
          <div className="text-white/80 text-sm">{greet}</div>
          <div className="text-white text-2xl font-semibold">{name}</div>
          <div className="text-white/60 text-sm">Admin</div>
        </div>
      </div>

      {/* Date in top right */}
      <div className="absolute top-4 right-4 text-white/80 text-sm">
        {nowCST.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
          weekday: 'long',
          year: 'numeric', 
          month: 'long',
          day: 'numeric'
        })}
      </div>
    </section>
  );
}
