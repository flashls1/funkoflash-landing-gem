
import React from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useSiteDesign, DEFAULT_PAGE_DESIGN } from "@/hooks/useSiteDesign";
import { supabase } from "@/integrations/supabase/client";

type Settings = typeof DEFAULT_PAGE_DESIGN;
type HeroCfg = NonNullable<Settings["hero"]>;

export default function AdminHero() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const design = useSiteDesign();
  const cfg = design.getCurrentPageSettings(pathname) || DEFAULT_PAGE_DESIGN;
  const hero: HeroCfg = { ...(DEFAULT_PAGE_DESIGN.hero as HeroCfg), ...(cfg.hero || {}) };

  const [bg, setBg] = React.useState<string>("");

  React.useEffect(() => {
    (async () => {
      // page-specific background first
      if (hero.backgroundMedia) { 
        setBg(hero.backgroundMedia); 
        return; 
      }
      // fallback to profile background of the current admin
      const { data: u } = await supabase.auth.getUser();
      if (u?.user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("background_image_url")
          .eq("user_id", u.user.id)
          .maybeSingle();
        if (data?.background_image_url) setBg(data.background_image_url);
      }
    })();
  }, [hero.backgroundMedia]);

  const title = hero.title || t("dashboard.title") || "Panel de Administración";
  const subtitle = hero.subtitle || t("dashboard.subtitle") || "";

  return (
    <section className="relative w-full rounded-xl overflow-hidden border border-white/10 mb-6">
      <div className="h-[240px] sm:h-[320px] md:h-[380px]">
        {bg ? (
          <img src={bg} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-blue-600/20" />
        )}
      </div>
      <div className="absolute inset-0 flex items-end">
        <div className="w-full p-4 sm:p-6 md:p-8 bg-gradient-to-t from-black/60 to-transparent">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-white/90 mt-2">{subtitle}</p>}
        </div>
      </div>
    </section>
  );
}
