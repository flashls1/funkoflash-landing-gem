import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTalentModuleAccess } from "@/hooks/useTalentModuleAccess";
import { Lock, Unlock } from "lucide-react";

interface TalentOption {
  id: string;
  name: string;
  email?: string;
}

interface TalentModuleAccessManagerProps {
  locale?: "en" | "es";
}

const MODULES = [
  { id: "events", label: "Events", labelEs: "Eventos" },
  { id: "calendar", label: "Calendar", labelEs: "Calendario" },
  { id: "messages", label: "Messages", labelEs: "Mensajes" },
  { id: "portfolio", label: "Portfolio", labelEs: "Portafolio" },
  { id: "earnings", label: "Earnings", labelEs: "Ganancias" },
  { id: "performance", label: "Performance", labelEs: "Rendimiento" },
  { id: "profile", label: "Profile", labelEs: "Perfil" },
  { id: "opportunities", label: "Opportunities", labelEs: "Oportunidades" },
  { id: "contracts", label: "Contracts", labelEs: "Contratos" },
];

export default function TalentModuleAccessManager({ locale = "en" }: TalentModuleAccessManagerProps) {
  const [talents, setTalents] = useState<TalentOption[]>([]);
  const [selectedTalentId, setSelectedTalentId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const { moduleAccess, isLoading: isLoadingAccess, updateModuleAccess } = useTalentModuleAccess(selectedTalentId);

  const content = {
    en: {
      title: "Talent Accessibility",
      description: "Control which modules each talent can access on their dashboard",
      selectTalent: "Select Talent",
      moduleControls: "Module Access Controls",
      locked: "Locked",
      unlocked: "Unlocked",
    },
    es: {
      title: "Accesibilidad de Talento",
      description: "Controlar qué módulos puede acceder cada talento en su panel",
      selectTalent: "Seleccionar Talento",
      moduleControls: "Controles de Acceso a Módulos",
      locked: "Bloqueado",
      unlocked: "Desbloqueado",
    },
  };

  const text = content[locale];

  useEffect(() => {
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    try {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("id, name, user_id")
        .not("user_id", "is", null)
        .eq("active", true)
        .order("name");

      if (error) throw error;

      // Get emails from profiles
      const userIds = data?.map((t) => t.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const emailMap = new Map(profiles?.map((p) => [p.user_id, p.email]) || []);

      setTalents(
        data?.map((t) => ({
          id: t.id,
          name: t.name,
          email: t.user_id ? emailMap.get(t.user_id) : undefined,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching talents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (moduleId: string, currentState: boolean) => {
    if (!selectedTalentId) return;

    updateModuleAccess.mutate({
      talentId: selectedTalentId,
      moduleId,
      isLocked: !currentState,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{text.title}</CardTitle>
          <CardDescription>{text.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="talent-select">{text.selectTalent}</Label>
            <Select value={selectedTalentId} onValueChange={setSelectedTalentId} disabled={loading}>
              <SelectTrigger id="talent-select" className="w-full">
                <SelectValue placeholder={text.selectTalent} />
              </SelectTrigger>
              <SelectContent>
                {talents.map((talent) => (
                  <SelectItem key={talent.id} value={talent.id}>
                    {talent.name} {talent.email && `(${talent.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTalentId && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{text.moduleControls}</h3>
              <div className="grid gap-4">
                {MODULES.map((module) => {
                  const isLocked = moduleAccess.get(module.id) || false;
                  const label = locale === "es" ? module.labelEs : module.label;

                  return (
                    <div
                      key={module.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isLocked ? (
                          <Lock className="h-5 w-5 text-destructive" />
                        ) : (
                          <Unlock className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <Label htmlFor={`module-${module.id}`} className="text-base font-medium cursor-pointer">
                            {label}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {isLocked ? text.locked : text.unlocked}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id={`module-${module.id}`}
                        checked={isLocked}
                        onCheckedChange={() => handleToggle(module.id, isLocked)}
                        disabled={isLoadingAccess || updateModuleAccess.isPending}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
