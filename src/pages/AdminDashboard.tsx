import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RealtimeMessageCenter from '@/components/RealtimeMessageCenter';
import TalentDirectoryCMS from './TalentDirectoryCMS';
import { AdminTalentAssetsWrapper } from '@/features/talent-assets/AdminTalentAssetsWrapper';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { InvisibleModeToggle } from '@/components/InvisibleModeToggle';
import { useNavigate } from 'react-router-dom';
import { useColorTheme } from '@/hooks/useColorTheme';
import { Users, MessageSquare, Settings, FileText, Calendar, BarChart3, Palette, ShoppingBag, Building, Lock, Unlock, ChevronDown, FolderOpen } from 'lucide-react';
import { hasFeature } from '@/lib/features';
import UserManagement from '@/components/UserManagement';
import AccessRequestManager from '@/components/AccessRequestManager';
import AppearanceManager from '@/features/appearance/AppearanceManager';
import BusinessDashboard from './BusinessDashboard';
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
  const { language, setLanguage } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [cardOrder, setCardOrder] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const [activeTab, setActiveTab] = useState('overview');
  const { user, profile, loading } = useAuth();
  const { currentTheme, colorThemes, changeTheme } = useColorTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Handle authentication and authorization separately
  useEffect(() => {
    if (loading) return; // Wait for auth to initialize

    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile && profile.role !== 'admin') {
      navigate('/auth');
      return;
    }
  }, [user, profile, loading, navigate]);

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
      businessManagement: "Business Management",
      businessManagementDesc: "Create, edit, and manage business events",
      manageBusinessEvents: "Manage Business Events",
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
      manageSiteDesign: "Open Design Module",
      calendarManagement: "Calendar Management",
      calendarManagementDesc: "Manage schedules and events",
      manageCalendar: "Manage Calendar",
      appearanceSettings: "Appearance Settings",
      appearanceSettingsDesc: "Configure desktop ripple effects and background appearance"
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
      businessManagement: "Gestión de Negocios",
      businessManagementDesc: "Crear, editar y gestionar eventos de negocios",
      manageBusinessEvents: "Gestionar Eventos de Negocios",
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
      manageSiteDesign: "Abrir Módulo de Diseño",
      calendarManagement: "Gestión de Calendario",
      calendarManagementDesc: "Gestiona horarios y eventos",
      manageCalendar: "Gestionar Calendario",
      appearanceSettings: "Configuración de Apariencia",
      appearanceSettingsDesc: "Configurar efectos de ondas de escritorio y apariencia de fondo"
    }
  };

  const t = content[language];

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or not admin, don't render dashboard content
  if (!user || !profile || profile.role !== 'admin') {
    return null;
  }

  // Module definitions with colors
  const allModuleCards = [
    { id: 'user-management', icon: Users, color: 'text-blue-500', title: t.userManagement, desc: t.userManagementDesc, action: t.manageUsers, onClick: () => setActiveTab('users') },
    { id: 'access-requests', icon: FileText, color: 'text-purple-500', title: t.accessRequests, desc: t.accessRequestsDesc, action: t.reviewRequests, onClick: () => setActiveTab('access-requests') },
    { id: 'business-management', icon: Building, color: 'text-green-500', title: t.businessManagement, desc: t.businessManagementDesc, action: t.manageBusinessEvents, onClick: () => navigate('/admin/business-events') },
    { id: 'system-settings', icon: Settings, color: 'text-gray-500', title: t.systemSettings, desc: t.systemSettingsDesc, action: t.configureSystem, onClick: () => setActiveTab('system-settings') },
    { id: 'reports-analytics', icon: BarChart3, color: 'text-orange-500', title: t.reportsAnalytics, desc: t.reportsAnalyticsDesc, action: t.viewReports },
    { id: 'content-management', icon: FileText, color: 'text-indigo-500', title: t.contentManagement, desc: t.contentManagementDesc, action: t.manageContent },
    { id: 'site-design', icon: Palette, color: 'text-pink-500', title: `✨ ${t.siteDesign}`, desc: t.siteDesignDesc, action: t.manageSiteDesign, onClick: () => navigate('/admin/site-design') },
    { id: 'talent-directory', icon: Users, color: 'text-cyan-500', title: language === 'en' ? 'Talent Directory' : 'Directorio de Talento', desc: language === 'en' ? 'Manage talent profiles and directory banner' : 'Gestionar perfiles de talento y banner del directorio', action: language === 'en' ? 'Manage Talent Directory' : 'Gestionar Directorio de Talento', onClick: () => navigate('/admin/talent-directory') },
    { id: 'shop-manager', icon: ShoppingBag, color: 'text-emerald-500', title: language === 'en' ? 'Shop Manager' : 'Gestor de Tienda', desc: language === 'en' ? 'Manage products, images, and shop inventory' : 'Gestionar productos, imágenes e inventario de la tienda', action: language === 'en' ? 'Manage Shop' : 'Gestionar Tienda', onClick: () => navigate('/admin/shop-manager') },
    { id: 'events-manager', icon: Calendar, color: 'text-red-500', title: language === 'en' ? 'Events Manager' : 'Gestor de Eventos', desc: language === 'en' ? 'Create, manage, and publish events with talent assignments' : 'Crear, gestionar y publicar eventos con asignaciones de talento', action: language === 'en' ? 'Manage Events' : 'Gestionar Eventos', onClick: () => navigate('/admin/events-manager') },
    { id: 'talent-assets', icon: FolderOpen, color: 'text-amber-500', title: language === 'en' ? 'Talent Assets Manager' : 'Gestor de Activos de Talento', desc: language === 'en' ? 'Manage talent assets, watermarks, and media files' : 'Gestionar activos, marcas de agua y archivos multimedia de talento', action: language === 'en' ? 'Manage Assets' : 'Gestionar Activos', onClick: () => setActiveTab('talent-assets') }
  ];

  const moduleCards = allModuleCards;

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        className="min-h-screen"
        style={{
          backgroundImage: "url('/lovable-uploads/bb29cf4b-64ec-424f-8221-3b283256e06d.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundColor: currentTheme.background
        }}
      >
        <Navigation language={language} setLanguage={setLanguage} />
        
        <div className="container mx-auto px-4 py-8">
        {/* Combined Profile Header with Greeting and Date */}
        <div className="mb-6">
          <Card 
            className="border-2 rounded-2xl overflow-hidden"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <div 
              className="relative h-48 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: (profile as any)?.background_image_url 
                  ? `url(${(profile as any).background_image_url})` 
                  : "url('/lovable-uploads/bb29cf4b-64ec-424f-8221-3b283256e06d.png')"
              }}
            >
              {/* Overlay for better text visibility */}
              <div className="absolute inset-0 bg-black/40"></div>
              
              {/* Profile content */}
              <div className="relative flex items-end justify-between h-full p-6">
                {/* Left side - Profile info */}
                <div className="flex items-end gap-4">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                    <AvatarImage src={(profile as any)?.avatar_url || ''} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-white mb-2">
                    <h2 className="text-2xl font-bold drop-shadow-lg">
                      {profile?.first_name} {profile?.last_name}
                    </h2>
                    <p className="text-white/90 capitalize">{profile?.role}</p>
                    <InvisibleModeToggle language={language} className="mt-2" />
                  </div>
                </div>
                
                {/* Right side - Greeting and Date */}
                <div className="text-right text-white">
                  <h1 className="text-3xl font-bold mb-1 drop-shadow-lg">
                    {getGreeting()}
                  </h1>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-lg font-medium drop-shadow-lg">
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
            </div>
          </Card>
          
          {/* Control Bar - Module Layout and Dashboard Colors */}
          <Card 
            className="border-2 rounded-2xl shadow-lg"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  {/* Module Layout Controls */}
                  <div className="flex items-center gap-3">
                    {isDragEnabled ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    <span className="text-sm font-medium">
                      {language === 'en' ? 'Module Layout' : 'Diseño de Módulos'}
                    </span>
                    <Switch
                      checked={isDragEnabled}
                      onCheckedChange={setIsDragEnabled}
                      style={{ backgroundColor: isDragEnabled ? currentTheme.accent : undefined }}
                    />
                    <span className="text-xs opacity-70">
                      {isDragEnabled 
                        ? (language === 'en' ? 'Unlocked' : 'Desbloqueado')
                        : (language === 'en' ? 'Locked' : 'Bloqueado')
                      }
                    </span>
                  </div>

                  {/* Navigation Tabs */}
                  <nav className="flex space-x-6">
                    <button 
                      onClick={() => setActiveTab('overview')}
                      className={`py-2 px-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                        activeTab === 'overview'
                          ? `border-current`
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ color: activeTab === 'overview' ? currentTheme.accent : currentTheme.cardForeground }}
                    >
                      <BarChart3 className="h-4 w-4" />
                      {t.overview}
                    </button>
                    <button 
                      onClick={() => setActiveTab('users')}
                      className={`py-2 px-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                        activeTab === 'users'
                          ? `border-current`
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ color: activeTab === 'users' ? currentTheme.accent : currentTheme.cardForeground }}
                    >
                      <Users className="h-4 w-4" />
                      {t.users}
                    </button>
                    <button 
                      onClick={() => setActiveTab('messages')}
                      className={`py-2 px-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                        activeTab === 'messages'
                          ? `border-current`
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ color: activeTab === 'messages' ? currentTheme.accent : currentTheme.cardForeground }}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t.messages}
                    </button>
                    <button 
                      onClick={() => setActiveTab('events')}
                      className={`py-2 px-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                        activeTab === 'events'
                          ? `border-current`
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ color: activeTab === 'events' ? currentTheme.accent : currentTheme.cardForeground }}
                    >
                      <Calendar className="h-4 w-4" />
                      {t.events}
                    </button>
                     <button 
                      onClick={() => setActiveTab('talent-assets')}
                      className={`py-2 px-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                        activeTab === 'talent-assets'
                          ? `border-current`
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ color: activeTab === 'talent-assets' ? currentTheme.accent : currentTheme.cardForeground }}
                    >
                      <FileText className="h-4 w-4" />
                      Assets
                    </button>
                     <button 
                      onClick={() => setActiveTab('business-dashboard')}
                      className={`py-2 px-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                        activeTab === 'business-dashboard'
                          ? `border-current`
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ color: activeTab === 'business-dashboard' ? currentTheme.accent : currentTheme.cardForeground }}
                    >
                      <Building className="h-4 w-4" />
                      Business
                    </button>
                     <button 
                      onClick={() => setActiveTab('settings')}
                      className={`py-2 px-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                        activeTab === 'settings'
                          ? `border-current`
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ color: activeTab === 'settings' ? currentTheme.accent : currentTheme.cardForeground }}
                    >
                      <Settings className="h-4 w-4" />
                      {t.settings}
                    </button>
                  </nav>
                </div>
                
                {/* Dashboard Colors Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      style={{
                        backgroundColor: currentTheme.cardBackground,
                        borderColor: currentTheme.border,
                        color: currentTheme.cardForeground
                      }}
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'Dashboard Colors' : 'Colores del Panel'}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-48"
                    style={{
                      backgroundColor: currentTheme.cardBackground,
                      borderColor: currentTheme.border,
                      color: currentTheme.cardForeground
                    }}
                  >
                    {colorThemes.map((theme) => (
                      <DropdownMenuItem
                        key={theme.id}
                        onClick={() => changeTheme(theme.id)}
                        className="flex items-center gap-3 cursor-pointer"
                        style={{
                          backgroundColor: currentTheme.id === theme.id ? currentTheme.accent + '20' : 'transparent'
                        }}
                      >
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: theme.accent, borderColor: theme.border }}
                        />
                        {theme.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card 
                className="border-2 transition-transform hover:scale-105"
                style={{
                  backgroundColor: currentTheme.cardBackground,
                  borderColor: currentTheme.border,
                  color: currentTheme.cardForeground
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.totalUsers}</CardTitle>
                  <Users className="h-4 w-4 opacity-80" style={{ color: currentTheme.accent }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs opacity-80">Platform users</p>
                </CardContent>
              </Card>

              <Card 
                className="border-2 transition-transform hover:scale-105"
                style={{
                  backgroundColor: currentTheme.cardBackground,
                  borderColor: currentTheme.border,
                  color: currentTheme.cardForeground
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.pendingRequests}</CardTitle>
                  <FileText className="h-4 w-4 opacity-80" style={{ color: currentTheme.accent }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs opacity-80">Awaiting review</p>
                </CardContent>
              </Card>

              <Card 
                className="border-2 transition-transform hover:scale-105"
                style={{
                  backgroundColor: currentTheme.cardBackground,
                  borderColor: currentTheme.border,
                  color: currentTheme.cardForeground
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.activeEvents}</CardTitle>
                  <Calendar className="h-4 w-4 opacity-80" style={{ color: currentTheme.accent }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs opacity-80">Current events</p>
                </CardContent>
              </Card>

              <Card 
                className="border-2 transition-transform hover:scale-105"
                style={{
                  backgroundColor: currentTheme.cardBackground,
                  borderColor: currentTheme.border,
                  color: currentTheme.cardForeground
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.systemHealth}</CardTitle>
                  <Badge variant="default" className="bg-green-500">
                    Healthy
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">99.9%</div>
                  <p className="text-xs opacity-80">Uptime</p>
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
                    <Card 
                      className="border-2 transition-transform hover:scale-105"
                      style={{
                        backgroundColor: currentTheme.cardBackground,
                        borderColor: currentTheme.border,
                        color: currentTheme.cardForeground
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5" style={{ color: currentTheme.accent }} />
                          {card.title}
                        </CardTitle>
                        <CardDescription className="opacity-80">{card.desc}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          className="w-full" 
                          onClick={card.onClick}
                          style={{
                            backgroundColor: currentTheme.accent,
                            color: currentTheme.background,
                            borderColor: currentTheme.accent
                          }}
                        >
                          {card.action}
                        </Button>
                      </CardContent>
                    </Card>
                  </DraggableCard>
                );
              })}
            </div>
            </div>
          )}

          {activeTab === 'users' && (
            <UserManagement 
              language={language} 
              onBack={() => setActiveTab('overview')} 
            />
          )}

          {activeTab === 'access-requests' && (
            <AccessRequestManager 
              language={language} 
              onBack={() => setActiveTab('overview')} 
            />
          )}

          {activeTab === 'messages' && (
            <RealtimeMessageCenter language={language} />
          )}

          {activeTab === 'events' && (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Events Module</h3>
              <p className="text-muted-foreground">Event management functionality coming soon.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Settings Module</h3>
              <p className="text-muted-foreground">Settings management functionality coming soon.</p>
            </div>
          )}

          {activeTab === 'talent-assets' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Talent Assets Manager</h2>
              <AdminTalentAssetsWrapper locale={language} />
            </div>
          )}

          {activeTab === 'business-dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Business Dashboard View</h2>
                <div className="text-sm text-muted-foreground">Testing business user experience</div>
              </div>
              <BusinessDashboard />
            </div>
          )}

          {activeTab === 'system-settings' && hasFeature('appearance') && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{t.systemSettings}</h3>
                <p className="text-muted-foreground">{t.systemSettingsDesc}</p>
              </div>
              <AppearanceManager />
            </div>
          )}
        </div>
      </div>

        <Footer language={language} />
      </div>
    </DndProvider>
  );
};

export default AdminDashboard;