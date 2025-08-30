import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PresenceToggle from "@/components/PresenceToggle";
import { useColorTheme } from "@/hooks/useColorTheme";
import { useLanguage } from "@/hooks/useLanguage";
import {
  LayoutGrid,
  BarChart3,
  Users,
  MessageSquare,
  Calendar,
  Settings
} from "lucide-react";

interface AdminTabsProps {
  children: React.ReactNode;
}

export default function AdminTabs({ children }: AdminTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme, colorThemes, changeTheme } = useColorTheme();
  const { language } = useLanguage();

  const content = {
    en: {
      moduleLayout: "Module Layout",
      overview: "Overview", 
      userManagement: "User Management",
      messages: "Messages",
      events: "Events",
      settings: "Settings",
      dashboardColors: "Dashboard Colors"
    },
    es: {
      moduleLayout: "Diseño de Módulos",
      overview: "Resumen",
      userManagement: "Gestión de Usuarios", 
      messages: "Mensajes",
      events: "Eventos",
      settings: "Configuración",
      dashboardColors: "Colores del Panel"
    }
  };

  const t = content[language];

  const tabs = [
    { id: "overview", label: t.overview, icon: LayoutGrid },
    { id: "stats", label: t.overview, icon: BarChart3 },
    { id: "users", label: t.userManagement, icon: Users },
    { id: "messages", label: t.messages, icon: MessageSquare },
    { id: "events", label: t.events, icon: Calendar },
    { id: "settings", label: t.settings, icon: Settings }
  ];

  const handleTabChange = (value: string) => {
    switch(value) {
      case "users":
        navigate("/admin/user-management");
        break;
      case "messages":
        navigate("/admin/message-center");
        break;
      case "events":
        navigate("/admin/events-manager");
        break;
      case "settings":
        navigate("/admin/site-design");
        break;
      default:
        // Stay on current dashboard
        break;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" onValueChange={handleTabChange}>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <TabsList className="grid w-auto grid-cols-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="flex items-center gap-4">
            <PresenceToggle />
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground hidden sm:inline">
                {t.dashboardColors}:
              </label>
              <select
                className="bg-background border border-border rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={currentTheme.id}
                onChange={(e) => changeTheme(e.target.value)}
              >
                {colorThemes.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}