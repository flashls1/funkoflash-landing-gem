
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
  const { t, lang } = useLanguage();
  const { pathname } = useLocation();
  const site = useSiteDesign();
  const { currentTheme, colorThemes, changeTheme } = useColorTheme();

  const [raw, setRaw] = React.useState<RawSettings | null>(null);
  const [bg, setBg] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [presence, setPresence] = React.useState<Presence>("online");

  // Load page settings
  React.useEffect(() => {
    try {
      const cfg = site.getCurrentPageSettings(pathname) as any;
      setRaw(cfg?.settings ?? cfg ?? null);
    } catch { 
      setRaw(null); 
    }
  }, [pathname, site]);

  // Load user profile (name, avatar, presence) and background fallback
  React.useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user?.id) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("first_name,last_name,avatar_url,background_image_url,status")
        .eq("user_id", u.user.id)
        .maybeSingle();
      
      if (data) {
        const full = [data.first_name, data.last_name].filter(Boolean).join(" ");
        setName(full || u.user.user_metadata?.name || u.user.email || "User");
        setAvatarUrl(data.avatar_url ?? null);
        setPresence((data.status as Presence) ?? "online");
        
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
  const overlay = typeof raw?.overlayOpacity === "number" ? raw.overlayOpacity : 0.6;

  const nowCST = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const greet = greeting(nowCST, lang);

  const onPresence = async (next: Presence) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user?.id) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ status: next })
      .eq("user_id", u.user.id);
    
    if (!error) setPresence(next);
  };

  const getPresenceLabel = (s: Presence) => {
    if (lang === "es") {
      switch (s) {
        case "online": return "En línea";
        case "offline": return "Desconectado";
        case "invisible": return "Invisible";
        default: return s;
      }
    } else {
      switch (s) {
        case "online": return "Online";
        case "offline": return "Offline";
        case "invisible": return "Invisible";
        default: return s;
      }
    }
  };

  return (
    <section className="relative w-full rounded-xl overflow-hidden border border-white/10 mb-6">
      <div className={heightClass}>
        {bg ? (
          <img src={bg} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-600/20 to-blue-600/20" />
        )}
      </div>

      {/* OVERLAY */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-gradient-to-t from-black/60 to-transparent" 
          style={{ opacity: overlay }} 
        />
        <div className="absolute inset-0 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Left: avatar + greeting + name */}
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="avatar" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/20" 
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                  <span className="text-white/70 text-lg font-medium">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="leading-tight">
                <div className="text-white/80 text-sm">{greet}</div>
                <div className="text-white text-xl sm:text-2xl font-semibold">{name}</div>
              </div>
            </div>

            {/* Right: theme dropdown + presence controls */}
            <div className="flex items-center gap-3">
              {/* Theme dropdown */}
              <select
                aria-label={lang === "es" ? "Tema del dashboard" : "Dashboard theme"}
                className="bg-black/40 border border-white/20 rounded-md text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                value={currentTheme.id}
                onChange={(e) => changeTheme(e.target.value)}
              >
                {colorThemes.map(theme => (
                  <option key={theme.id} value={theme.id} className="bg-gray-800">
                    {theme.name}
                  </option>
                ))}
              </select>

              {/* Presence */}
              <div className="flex items-center gap-1 bg-black/40 border border-white/20 rounded-md px-2 py-1">
                {(["online", "offline", "invisible"] as Presence[]).map(s => (
                  <button
                    key={s}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      presence === s 
                        ? "bg-white/30 text-white" 
                        : "text-white/70 hover:bg-white/10"
                    }`}
                    onClick={() => onPresence(s)}
                    title={`${lang === "es" ? "Establecer estado" : "Set status"}: ${getPresenceLabel(s)}`}
                  >
                    {getPresenceLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
