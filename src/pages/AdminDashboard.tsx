import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MessageCenter from '@/components/MessageCenter';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Settings, FileText, Calendar, BarChart3, Palette } from 'lucide-react';

const AdminDashboard = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile || profile.role !== 'admin') {
      navigate('/auth');
      return;
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [user, profile, navigate]);

  const getGreeting = () => {
    const cstTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "America/Chicago"}));
    const hour = cstTime.getHours();
    const firstName = profile?.first_name || 'Admin';

    const greetings = {
      en: {
        morning: `Good morning ${firstName}`,
        afternoon: `Good afternoon ${firstName}`,
        evening: `Good evening ${firstName}`
      },
      es: {
        morning: `Buenos días ${firstName}`,
        afternoon: `Buenas tardes ${firstName}`,
        evening: `Buenas noches ${firstName}`
      }
    };

    const t = greetings[language];

    if (hour >= 0 && hour < 12) return t.morning;
    if (hour >= 12 && hour < 17) return t.afternoon;
    return t.evening;
  };

  const content = {
    en: {
      dashboard: "Admin Dashboard",
      overview: "Overview",
      users: "User Management",
      messages: "Messages",
      settings: "Settings",
      analytics: "Analytics",
      events: "Events",
      totalUsers: "Total Users",
      pendingRequests: "Pending Access Requests",
      activeEvents: "Active Events",
      systemHealth: "System Health",
      userManagement: "User Management",
      userManagementDesc: "Manage all platform users, roles, and permissions",
      manageUsers: "Manage Users",
      accessRequests: "Access Requests",
      accessRequestsDesc: "Review and approve new user access requests",
      reviewRequests: "Review Requests",
      eventManagement: "Event Management",
      eventManagementDesc: "Create, edit, and manage platform events",
      manageEvents: "Manage Events",
      systemSettings: "System Settings",
      systemSettingsDesc: "Configure platform settings and preferences",
      configureSystem: "Configure System",
      reportsAnalytics: "Reports & Analytics",
      reportsAnalyticsDesc: "View detailed reports and platform analytics",
      viewReports: "View Reports",
      contentManagement: "Content Management",
      contentManagementDesc: "Manage website content, pages, and media",
      manageContent: "Manage Content",
      siteDesign: "Site Design Module",
      siteDesignDesc: "Customize backgrounds, heroes, colors, fonts, and layouts",
      manageSiteDesign: "Open Design Module"
    },
    es: {
      dashboard: "Panel de Administrador",
      overview: "Resumen",
      users: "Gestión de Usuarios",
      messages: "Mensajes",
      settings: "Configuración",
      analytics: "Analíticas",
      events: "Eventos",
      totalUsers: "Usuarios Totales",
      pendingRequests: "Solicitudes Pendientes",
      activeEvents: "Eventos Activos",
      systemHealth: "Estado del Sistema",
      userManagement: "Gestión de Usuarios",
      userManagementDesc: "Gestiona todos los usuarios, roles y permisos de la plataforma",
      manageUsers: "Gestionar Usuarios",
      accessRequests: "Solicitudes de Acceso",
      accessRequestsDesc: "Revisa y aprueba nuevas solicitudes de acceso de usuarios",
      reviewRequests: "Revisar Solicitudes",
      eventManagement: "Gestión de Eventos",
      eventManagementDesc: "Crear, editar y gestionar eventos de la plataforma",
      manageEvents: "Gestionar Eventos",
      systemSettings: "Configuración del Sistema",
      systemSettingsDesc: "Configurar ajustes y preferencias de la plataforma",
      configureSystem: "Configurar Sistema",
      reportsAnalytics: "Reportes y Analíticas",
      reportsAnalyticsDesc: "Ver reportes detallados y analíticas de la plataforma",
      viewReports: "Ver Reportes",
      contentManagement: "Gestión de Contenido",
      contentManagementDesc: "Gestionar contenido del sitio web, páginas y medios",
      manageContent: "Gestionar Contenido",
      siteDesign: "Módulo de Diseño del Sitio",
      siteDesignDesc: "Personalizar fondos, héroes, colores, fuentes y diseños",
      manageSiteDesign: "Abrir Módulo de Diseño"
    }
  };

  const t = content[language];

  if (!user || !profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{getGreeting()}</h1>
          <p className="text-muted-foreground">
            {currentTime.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'America/Chicago'
            })}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.overview}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t.users}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t.messages}
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t.events}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t.settings}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.totalUsers}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Platform users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.pendingRequests}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.activeEvents}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Current events</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.systemHealth}</CardTitle>
                  <Badge variant="default" className="bg-green-500">
                    Healthy
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">99.9%</div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t.userManagement}
                  </CardTitle>
                  <CardDescription>{t.userManagementDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.manageUsers}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t.accessRequests}
                  </CardTitle>
                  <CardDescription>{t.accessRequestsDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.reviewRequests}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {t.eventManagement}
                  </CardTitle>
                  <CardDescription>{t.eventManagementDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.manageEvents}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {t.systemSettings}
                  </CardTitle>
                  <CardDescription>{t.systemSettingsDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.configureSystem}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t.reportsAnalytics}
                  </CardTitle>
                  <CardDescription>{t.reportsAnalyticsDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.viewReports}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t.contentManagement}
                  </CardTitle>
                  <CardDescription>{t.contentManagementDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.manageContent}</Button>
                </CardContent>
              </Card>

              <Card className="border-funko-orange/20 bg-funko-orange/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-funko-orange" />
                    ✨ {t.siteDesign}
                  </CardTitle>
                  <CardDescription>{t.siteDesignDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/admin/site-design')}
                  >
                    {t.manageSiteDesign}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-funko-orange" />
                    {language === 'en' ? 'Talent Directory' : 'Directorio de Talento'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'en' ? 'Manage talent profiles and directory banner' : 'Gestionar perfiles de talento y banner del directorio'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/admin/talent-directory')}
                  >
                    {language === 'en' ? 'Manage Talent Directory' : 'Gestionar Directorio de Talento'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t.userManagement}</CardTitle>
                <CardDescription>Manage platform users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">User management functionality will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <MessageCenter language={language} />
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>{t.eventManagement}</CardTitle>
                <CardDescription>Create and manage platform events</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Event management functionality will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>{t.systemSettings}</CardTitle>
                <CardDescription>Configure platform settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">System settings will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer language={language} />
    </div>
  );
};

export default AdminDashboard;