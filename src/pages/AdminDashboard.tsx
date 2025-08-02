import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MessageCenter from '@/components/MessageCenter';
import ProfileManager from '@/components/ProfileManager';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Settings, FileText, Calendar, BarChart3, Palette, ShoppingBag, Lock, Unlock } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';

// Draggable card component
const DraggableCard = ({ children, id, index, moveCard, isDragEnabled }: any) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'card',
    item: { id, index },
    canDrag: isDragEnabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'card',
    hover: (item: any) => {
      if (!isDragEnabled || item.index === index) return;
      moveCard(item.index, index);
      item.index = index;
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={isDragEnabled ? 'cursor-move' : 'cursor-default'}
    >
      {children}
    </div>
  );
};

const AdminDashboard = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [cardOrder, setCardOrder] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
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

  const moveCard = (dragIndex: number, hoverIndex: number) => {
    const newOrder = [...cardOrder];
    const draggedCard = newOrder[dragIndex];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedCard);
    setCardOrder(newOrder);
  };

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

  // Module definitions with colors
  const moduleCards = [
    { id: 'user-management', icon: Users, color: 'text-blue-500', title: t.userManagement, desc: t.userManagementDesc, action: t.manageUsers },
    { id: 'access-requests', icon: FileText, color: 'text-purple-500', title: t.accessRequests, desc: t.accessRequestsDesc, action: t.reviewRequests },
    { id: 'event-management', icon: Calendar, color: 'text-green-500', title: t.eventManagement, desc: t.eventManagementDesc, action: t.manageEvents, onClick: () => navigate('/admin/events-manager') },
    { id: 'system-settings', icon: Settings, color: 'text-gray-500', title: t.systemSettings, desc: t.systemSettingsDesc, action: t.configureSystem },
    { id: 'reports-analytics', icon: BarChart3, color: 'text-orange-500', title: t.reportsAnalytics, desc: t.reportsAnalyticsDesc, action: t.viewReports },
    { id: 'content-management', icon: FileText, color: 'text-indigo-500', title: t.contentManagement, desc: t.contentManagementDesc, action: t.manageContent },
    { id: 'site-design', icon: Palette, color: 'text-pink-500', title: `✨ ${t.siteDesign}`, desc: t.siteDesignDesc, action: t.manageSiteDesign, onClick: () => navigate('/admin/site-design') },
    { id: 'talent-directory', icon: Users, color: 'text-cyan-500', title: language === 'en' ? 'Talent Directory' : 'Directorio de Talento', desc: language === 'en' ? 'Manage talent profiles and directory banner' : 'Gestionar perfiles de talento y banner del directorio', action: language === 'en' ? 'Manage Talent Directory' : 'Gestionar Directorio de Talento', onClick: () => navigate('/admin/talent-directory') },
    { id: 'shop-manager', icon: ShoppingBag, color: 'text-emerald-500', title: language === 'en' ? 'Shop Manager' : 'Gestor de Tienda', desc: language === 'en' ? 'Manage products, images, and shop inventory' : 'Gestionar productos, imágenes e inventario de la tienda', action: language === 'en' ? 'Manage Shop' : 'Gestionar Tienda', onClick: () => navigate('/admin/shop-manager') },
    { id: 'events-manager', icon: Calendar, color: 'text-red-500', title: language === 'en' ? 'Events Manager' : 'Gestor de Eventos', desc: language === 'en' ? 'Create, manage, and publish events with talent assignments' : 'Crear, gestionar y publicar eventos con asignaciones de talento', action: language === 'en' ? 'Manage Events' : 'Gestionar Eventos', onClick: () => navigate('/admin/events-manager') }
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        className="min-h-screen"
        style={{
          backgroundImage: 'var(--site-background)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <Navigation language={language} setLanguage={setLanguage} />
        
        <div className="container mx-auto px-4 py-8">
        {/* Header with Enhanced Design */}
        <div className="relative mb-8 overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent rounded-2xl"></div>
          
          {/* Content */}
          <div className="relative p-8 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-orange-900/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
            <div className="flex items-center gap-4">
              {/* Decorative accent */}
              <div className="w-2 h-16 bg-gradient-to-b from-orange-400 via-blue-400 to-purple-400 rounded-full shadow-lg"></div>
              
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight">
                  {getGreeting()}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <p className="text-xl text-white/95 font-medium drop-shadow-lg">
                    {currentTime.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'America/Chicago'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Additional decorative elements */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <div className="w-3 h-3 bg-white/20 rounded-full"></div>
              <div className="w-3 h-3 bg-white/30 rounded-full"></div>
              <div className="w-3 h-3 bg-white/40 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Profile Section with integrated lock toggle */}
        <div className="mb-6 space-y-4">
          <ProfileManager language={language} />
          
          {/* Lock Toggle integrated in profile area */}
          <div className="flex items-center justify-end bg-white/90 backdrop-blur-sm border-2 border-black rounded-lg p-3">
            <div className="flex items-center gap-3">
              {isDragEnabled ? <Unlock className="h-4 w-4 text-gray-600" /> : <Lock className="h-4 w-4 text-gray-600" />}
              <span className="text-sm font-medium text-gray-700">
                {language === 'en' ? 'Module Layout' : 'Diseño de Módulos'}
              </span>
              <Switch
                checked={isDragEnabled}
                onCheckedChange={setIsDragEnabled}
                className="data-[state=checked]:bg-green-500"
              />
              <span className="text-gray-600 text-xs">
                {isDragEnabled 
                  ? (language === 'en' ? 'Unlocked' : 'Desbloqueado')
                  : (language === 'en' ? 'Locked' : 'Bloqueado')
                }
              </span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 border-2 border-black bg-white">
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
              <Card className="border-2 border-black bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.totalUsers}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Platform users</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.pendingRequests}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.activeEvents}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Current events</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
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
              {cardOrder.map((cardIndex, index) => {
                const card = moduleCards[cardIndex];
                const IconComponent = card.icon;
                return (
                  <DraggableCard
                    key={card.id}
                    id={card.id}
                    index={index}
                    moveCard={moveCard}
                    isDragEnabled={isDragEnabled}
                  >
                    <Card className="border-2 border-black bg-white transition-transform hover:scale-105">
                      <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${card.color}`}>
                          <IconComponent className="h-5 w-5" />
                          {card.title}
                        </CardTitle>
                        <CardDescription>{card.desc}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          className="w-full" 
                          onClick={card.onClick}
                        >
                          {card.action}
                        </Button>
                      </CardContent>
                    </Card>
                  </DraggableCard>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-2 border-black bg-white">
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
            <Card className="border-2 border-black bg-white">
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
            <Card className="border-2 border-black bg-white">
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
    </DndProvider>
  );
};

export default AdminDashboard;