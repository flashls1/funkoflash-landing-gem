import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RealtimeMessageCenter from '@/components/RealtimeMessageCenter';
import { useAuth } from '@/hooks/useAuth';
import { InvisibleModeToggle } from '@/components/InvisibleModeToggle';
import { useNavigate } from 'react-router-dom';
import { useColorTheme } from '@/hooks/useColorTheme';
import { Calendar, MessageSquare, User, Star, FileText, BarChart3, Settings, DollarSign, TrendingUp, Lock, Unlock, Palette, ChevronDown, Users, Briefcase } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
import { NextEventCard } from '@/components/NextEventCard';
import { MiniAgenda } from '@/components/MiniAgenda';

// Draggable card component for business
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
  const [cardOrder, setCardOrder] = useState([0, 1, 2, 3, 4, 5, 6]);
  const { user, profile, loading } = useAuth();
  const { currentTheme, colorThemes, changeTheme } = useColorTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle authentication and authorization separately
    if (loading) return; // Wait for auth to initialize

    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile && profile.role !== 'admin') {
      navigate('/auth');
      return;
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
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
      messages: "Messages",
      settings: "Settings",
      siteDesign: "Site Design",
      siteDesignDesc: "Customize the website design and branding",
      talentDirectory: "Talent Directory",
      talentDirectoryDesc: "Manage talent profiles and directory settings",
      shopManager: "Shop Manager",
      shopManagerDesc: "Manage products and shop settings",
      eventsManager: "Events Manager",
      eventsManagerDesc: "Manage events and event settings",
      businessEvents: "Business Events",
      businessEventsDesc: "Manage corporate events and business engagements",
      userManagement: "User Management",
      userManagementDesc: "Manage user accounts and permissions",
      moduleComingSoon: "Additional modules coming soon.",
      moduleLayout: "Module Layout",
      dashboardColors: "Dashboard Colors",
      locked: "Locked",
      unlocked: "Unlocked"
    },
    es: {
      dashboard: "Panel de Administrador",
      overview: "Resumen",
      messages: "Mensajes",
      settings: "Configuración",
      siteDesign: "Diseño del Sitio",
      siteDesignDesc: "Personaliza el diseño y la marca del sitio web",
      talentDirectory: "Directorio de Talento",
      talentDirectoryDesc: "Gestiona perfiles de talento y configuraciones del directorio",
      shopManager: "Gestor de Tienda",
      shopManagerDesc: "Gestiona productos y configuraciones de la tienda",
      eventsManager: "Gestor de Eventos",
      eventsManagerDesc: "Gestiona eventos y configuraciones de eventos",
      businessEvents: "Eventos Empresariales",
      businessEventsDesc: "Gestiona eventos corporativos y compromisos empresariales",
      userManagement: "Gestión de Usuarios",
      userManagementDesc: "Gestiona cuentas de usuario y permisos",
      moduleComingSoon: "Módulos adicionales próximamente.",
      moduleLayout: "Diseño de Módulos",
      dashboardColors: "Colores del Panel",
      locked: "Bloqueado",
      unlocked: "Desbloqueado"
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

  const adminModules = [
    {
      title: t.siteDesign,
      description: t.siteDesignDesc,
      icon: Palette,
      href: "/admin/site-design",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: t.talentDirectory,
      description: t.talentDirectoryDesc,
      icon: Users,
      href: "/admin/talent-directory",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: t.shopManager,
      description: t.shopManagerDesc,
      icon: DollarSign,
      href: "/admin/shop-manager",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: t.eventsManager,
      description: t.eventsManagerDesc,
      icon: Calendar,
      href: "/admin/events-manager",
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: t.businessEvents,
      description: t.businessEventsDesc,
      icon: Briefcase,
      href: "/admin/business-events",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      title: t.userManagement,
      description: t.userManagementDesc,
      icon: User,
      href: "/admin/user-management",
      gradient: "from-gray-500 to-slate-500"
    }
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
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-green-600 text-white">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-white mb-2">
                    <h2 className="text-2xl font-bold drop-shadow-lg">
                      {profile?.first_name} {profile?.last_name}
                    </h2>
                    <p className="text-white/90 capitalize flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {profile?.role}
                    </p>
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
            className="border-2 border-t-0 rounded-t-none"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  {/* Module Layout Controls */}
                  <div className="flex items-center gap-3">
                    {isDragEnabled ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    <span className="text-sm font-medium">
                      {t.moduleLayout}
                    </span>
                    <Switch
                      checked={isDragEnabled}
                      onCheckedChange={setIsDragEnabled}
                      style={{ backgroundColor: isDragEnabled ? currentTheme.accent : undefined }}
                    />
                    <span className="text-xs opacity-70">
                      {isDragEnabled ? t.unlocked : t.locked}
                    </span>
                  </div>

                  {/* Navigation Tabs */}
                  <nav className="flex space-x-6">
                    <button 
                      className="py-2 px-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 border-current"
                      style={{ color: currentTheme.accent }}
                    >
                      <BarChart3 className="h-4 w-4" />
                      {t.overview}
                    </button>
                    <button 
                      className="py-2 px-3 border-b-2 border-transparent opacity-70 hover:opacity-100 font-medium text-sm transition-colors flex items-center gap-2"
                      style={{ color: currentTheme.cardForeground }}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t.messages}
                    </button>
                    <button 
                      className="py-2 px-3 border-b-2 border-transparent opacity-70 hover:opacity-100 font-medium text-sm transition-colors flex items-center gap-2"
                      style={{ color: currentTheme.cardForeground }}
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
                      {t.dashboardColors}
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

        {/* Main Content */}
        <div className="space-y-6">
          {/* Next Event and Mini Agenda */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NextEventCard language={language} />
            <MiniAgenda language={language} />
          </div>

          {/* Admin Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminModules.map((module, index) => {
              const actualIndex = cardOrder.indexOf(index);
              return (
                <DraggableCard
                  key={index}
                  id={index}
                  index={actualIndex}
                  moveCard={moveCard}
                  isDragEnabled={isDragEnabled}
                >
                  <Card 
                    className="group hover:shadow-xl transition-all duration-300 border-2 cursor-pointer overflow-hidden"
                    style={{
                      backgroundColor: currentTheme.cardBackground,
                      borderColor: currentTheme.border,
                      color: currentTheme.cardForeground
                    }}
                    onClick={() => navigate(module.href)}
                  >
                    {/* Gradient Header */}
                    <div className={`h-2 bg-gradient-to-r ${module.gradient}`} />
                    
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${module.gradient} text-white shadow-lg`}>
                          <module.icon className="h-6 w-6" />
                        </div>
                        <div className="text-right">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <CardTitle className="text-xl group-hover:scale-105 transition-transform">
                        {module.title}
                      </CardTitle>
                      <CardDescription 
                        className="text-sm leading-relaxed"
                        style={{ color: currentTheme.cardForeground + '80' }}
                      >
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start p-0 h-auto font-medium hover:translate-x-1 transition-transform"
                        style={{ color: currentTheme.accent }}
                      >
                        Manage →
                      </Button>
                    </CardContent>
                    
                    {/* Hover Gradient Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
                  </Card>
                </DraggableCard>
              );
            })}
          </div>

          {/* Future modules placeholder */}
          <Card 
            className="border-2 text-center py-8"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <CardContent>
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Analytics & Reporting</h3>
              <p className="opacity-70">{t.moduleComingSoon}</p>
            </CardContent>
          </Card>
        </div>

        <RealtimeMessageCenter language={language} />
        </div>
        
        <Footer language={language} />
      </div>
    </DndProvider>
  );
};

export default AdminDashboard;
