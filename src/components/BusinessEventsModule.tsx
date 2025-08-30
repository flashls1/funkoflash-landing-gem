
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Calendar, MapPin, ExternalLink, Edit } from "lucide-react";

type BizEvent = {
  id: string;
  title: string | null;
  start_ts: string | null;
  end_ts: string | null;
  city: string | null;
  state: string | null;
  status: string | null;
};

export default function BusinessEventsModule() {
  const { t, lang } = useLanguage();
  const [rows, setRows] = React.useState<BizEvent[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("business_events")
        .select("id,title,start_ts,end_ts,city,state,status")
        .order("start_ts", { ascending: true })
        .limit(10);
      
      if (!active) return;
      if (error) setErr(error.message);
      else setRows((data || []) as BizEvent[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="bg-card p-4 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4" />
          <h3 className="text-sm font-medium">{lang === "en" ? "Business Events" : "Eventos de Negocio"}</h3>
        </div>
        <div className="text-sm opacity-70">{lang === "en" ? "Loading events..." : "Cargando eventos…"}</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="bg-card p-4 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4" />
          <h3 className="text-sm font-medium">{lang === "en" ? "Business Events" : "Eventos de Negocio"}</h3>
        </div>
        <div className="text-red-400 text-sm">Error: {err}</div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="bg-card p-4 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4" />
          <h3 className="text-sm font-medium">{lang === "en" ? "Business Events" : "Eventos de Negocio"}</h3>
        </div>
        <div className="text-sm opacity-70">{t("dashboard.no_events") || (lang === "en" ? "No events available" : "No hay eventos")}</div>
      </div>
    );
  }

  return (
    <div className="bg-card p-4 rounded-lg border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4" />
        <h3 className="text-sm font-medium">{lang === "en" ? "Business Events" : "Eventos de Negocio"}</h3>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {rows.map(e => (
          <div key={e.id} className="flex items-center justify-between border border-white/10 rounded-md p-3 text-sm hover:bg-white/5 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{e.title || (lang === "en" ? "(untitled)" : "(sin título)")}</div>
              <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
                <MapPin className="w-3 h-3" />
                <span>
                  {e.city || ""}{e.state ? `, ${e.state}` : ""}
                </span>
                <span className="ml-2">{formatDate(e.start_ts)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              <a 
                href={`/events/${e.id}`} 
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title={lang === "en" ? "View event" : "Ver evento"}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href={`/admin/events/${e.id}`} 
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title={lang === "en" ? "Edit event" : "Editar evento"}
              >
                <Edit className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
