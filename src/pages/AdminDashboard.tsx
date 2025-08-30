import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AdminHeader from "@/components/AdminHeader";
import AdminThemeProvider from "@/components/AdminThemeProvider";
import AdminGreeting from "@/components/AdminGreeting";
import LoginHistoryBox from "@/components/LoginHistoryBox";
import AdminHero from "@/components/AdminHero";
import PresenceToggle from "@/components/PresenceToggle";
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
  Mic2
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
      calendarManagerDesc: "Manage calendar events and schedules"
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
      calendarManagerDesc: "Gestionar eventos de calendario y horarios"
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
    }
  ];

  return (
    <AdminThemeProvider>
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        <AdminHero />

        <AdminHeader
          title={t.welcome}
          description={t.description}
          language={language}
        >
          <AdminGreeting language={language} className="text-accent" />
        </AdminHeader>

        {/* Status and Quick Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <PresenceToggle />
          </div>
          <div className="lg:col-span-2">
            <BusinessEventsModule />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {dashboardItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(item.path)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Login History Box */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoginHistoryBox language={language} />
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'es' ? 'Accesos Rápidos' : 'Quick Actions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/user-management")}
              >
                <Users className="w-4 h-4 mr-2" />
                {t.userManagement}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/site-design")}
              >
                <Palette className="w-4 h-4 mr-2" />
                {t.siteDesign}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/admin/talent-directory")}
              >
                <Mic2 className="w-4 h-4 mr-2" />
                {t.talentDirectory}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer language={language} />
    </AdminThemeProvider>
  );
};

export default AdminDashboard;
