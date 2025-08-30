import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AdminThemeProvider from "@/components/AdminThemeProvider";
import LoginHistoryBox from "@/components/LoginHistoryBox";
import AdminHero from "@/components/AdminHero";
import AdminTabs from "@/components/AdminTabs";
import AdminStats from "@/components/AdminStats";
import BusinessEventsModule from "@/components/BusinessEventsModule";
import { 
  Users, 
  Calendar, 
  Settings, 
  Palette,
  UserCheck,
  MessageSquare,
  ShoppingBag,
  CalendarDays,
  Mic2,
  BarChart3,
  FileText
} from "lucide-react";

const AdminDashboard = () => {
  const { profile } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const content = {
    en: {
      welcome: "Admin Dashboard", 
      description: "Manage your platform from here",
      userManagement: "User Management",
      userManagementDesc: "Manage users, roles and permissions",
      accessRequests: "Access Requests", 
      accessRequestsDesc: "Review and approve access requests",
      messageCenter: "Message Center",
      messageCenterDesc: "Internal messaging system",
      siteDesign: "Site Design Module",
      siteDesignDesc: "Customize site appearance and navigation",
      talentDirectory: "Talent Directory",
      talentDirectoryDesc: "Manage talent profiles and directory",
      shopManager: "Shop Manager",
      shopManagerDesc: "Manage products and shop settings", 
      eventsManager: "Events Manager",
      eventsManagerDesc: "Manage public events and announcements",
      calendarManager: "Calendar Manager", 
      calendarManagerDesc: "Manage calendar events and schedules",
      systemSettings: "System Settings",
      systemSettingsDesc: "Configure system preferences and settings",
      reportsAnalytics: "Reports & Analytics", 
      reportsAnalyticsDesc: "View detailed reports and analytics",
      contentManagement: "Content Management",
      contentManagementDesc: "Manage site content and media"
    },
    es: {
      welcome: "Panel de Administración",
      description: "Gestiona tu plataforma desde aquí", 
      userManagement: "Gestión de Usuarios",
      userManagementDesc: "Gestionar usuarios, roles y permisos",
      accessRequests: "Solicitudes de Acceso",
      accessRequestsDesc: "Revisar y aprobar solicitudes de acceso", 
      messageCenter: "Centro de Mensajes",
      messageCenterDesc: "Sistema de mensajería interna",
      siteDesign: "Módulo de Diseño del Sitio",
      siteDesignDesc: "Personalizar apariencia y navegación del sitio",
      talentDirectory: "Directorio de Talento", 
      talentDirectoryDesc: "Gestionar perfiles de talento y directorio",
      shopManager: "Gestor de Tienda",
      shopManagerDesc: "Gestionar productos y configuración de tienda",
      eventsManager: "Gestor de Eventos",
      eventsManagerDesc: "Gestionar eventos públicos y anuncios", 
      calendarManager: "Gestor de Calendario",
      calendarManagerDesc: "Gestionar eventos de calendario y horarios",
      systemSettings: "Configuración del Sistema",
      systemSettingsDesc: "Configurar preferencias y ajustes del sistema",
      reportsAnalytics: "Informes y Análisis",
      reportsAnalyticsDesc: "Ver informes detallados y análisis",
      contentManagement: "Gestión de Contenido", 
      contentManagementDesc: "Gestionar contenido del sitio y medios"
    }
  };

  const t = content[language];

  const dashboardItems = [
    {
      title: t.userManagement,
      description: t.userManagementDesc,
      icon: Users,
      path: "/admin/user-management",
      color: "text-blue-600"
    },
    {
      title: t.accessRequests,
      description: t.accessRequestsDesc,
      icon: UserCheck,
      path: "/admin/access-requests", 
      color: "text-green-600"
    },
    {
      title: t.messageCenter,
      description: t.messageCenterDesc,
      icon: MessageSquare,
      path: "/admin/message-center",
      color: "text-purple-600"
    },
    {
      title: t.siteDesign,
      description: t.siteDesignDesc,
      icon: Palette,
      path: "/admin/site-design",
      color: "text-pink-600"
    },
    {
      title: t.talentDirectory,
      description: t.talentDirectoryDesc,
      icon: Mic2,
      path: "/admin/talent-directory",
      color: "text-orange-600"
    },
    {
      title: t.shopManager,
      description: t.shopManagerDesc,
      icon: ShoppingBag,
      path: "/admin/shop-manager",
      color: "text-emerald-600"
    },
    {
      title: t.eventsManager,
      description: t.eventsManagerDesc,
      icon: CalendarDays,
      path: "/admin/events-manager",
      color: "text-red-600"
    },
    {
      title: t.calendarManager,
      description: t.calendarManagerDesc,
      icon: Calendar,
      path: "/admin/calendar",
      color: "text-indigo-600"
    },
    {
      title: t.systemSettings,
      description: t.systemSettingsDesc,
      icon: Settings,
      path: "/admin/system-settings",
      color: "text-gray-600"
    },
    {
      title: t.reportsAnalytics,
      description: t.reportsAnalyticsDesc,
      icon: BarChart3,
      path: "/admin/reports",
      color: "text-cyan-600"
    },
    {
      title: t.contentManagement,
      description: t.contentManagementDesc,
      icon: FileText,
      path: "/admin/content",
      color: "text-teal-600"
    }
  ];

  return (
    <AdminThemeProvider>
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        <AdminHero />

        <AdminTabs>
          <AdminStats />

          {/* Business Events Module */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <BusinessEventsModule />
            <LoginHistoryBox language={language} />
          </div>

          {/* Main Module Grid - 3 columns to match original */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {dashboardItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card 
                  key={index} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group h-full"
                  onClick={() => navigate(item.path)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Icon className={`w-8 h-8 ${item.color} group-hover:scale-110 transition-transform`} />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col justify-between flex-1">
                    <CardDescription className="text-sm mb-4">
                      {item.description}
                    </CardDescription>
                    <Button variant="outline" className="w-full">
                      {language === 'es' ? 'Abrir' : 'Open'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </AdminTabs>
      </div>

      <Footer language={language} />
    </AdminThemeProvider>
  );
};

export default AdminDashboard;
