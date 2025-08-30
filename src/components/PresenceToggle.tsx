
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

type Status = "online" | "offline" | "invisible";

export default function PresenceToggle() {
  const { t } = useLanguage();
  const [status, setStatus] = React.useState<Status>("online");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user?.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("status")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (data?.status) setStatus(data.status as Status);
    })();
  }, []);

  const update = async (next: Status) => {
    setError(null);
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user?.id) {
      setLoading(false);
      return;
    }
    
    const { error } = await supabase
      .from("profiles")
      .update({ status: next })
      .eq("user_id", u.user.id);
    
    setLoading(false);
    if (error) setError(error.message);
    else setStatus(next);
  };

  const getStatusColor = (s: Status) => {
    switch (s) {
      case "online": return "bg-green-500/20 border-green-500/50 text-green-300";
      case "offline": return "bg-gray-500/20 border-gray-500/50 text-gray-300";
      case "invisible": return "bg-purple-500/20 border-purple-500/50 text-purple-300";
      default: return "bg-white/10 border-white/20";
    }
  };

  const getStatusLabel = (s: Status) => {
    switch (s) {
      case "online": return "En línea";
      case "offline": return "Desconectado";
      case "invisible": return "Invisible";
      default: return s;
    }
  };

  return (
    <div className="bg-card p-4 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Estado de presencia:</span>
        <div className={`w-3 h-3 rounded-full ${status === 'online' ? 'bg-green-500' : status === 'invisible' ? 'bg-purple-500' : 'bg-gray-500'}`} />
      </div>
      
      <div className="flex gap-2">
        {(["online", "offline", "invisible"] as Status[]).map(s => (
          <button 
            key={s}
            className={`px-3 py-1 rounded-md text-xs border transition-colors ${
              status === s 
                ? getStatusColor(s)
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
            onClick={() => update(s)}
            disabled={loading}
          >
            {getStatusLabel(s)}
          </button>
        ))}
      </div>
      
      {error && (
        <div className="text-red-400 text-xs mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
}
