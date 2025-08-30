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
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useSiteDesign } from '@/hooks/useSiteDesign';
import { Calendar, MessageSquare, User, Star, FileText, BarChart3, Settings, DollarSign, TrendingUp, Lock, Unlock, Palette, ChevronDown, Building2, FolderOpen, Upload } from 'lucide-react';
import HeroOverlay from '@/components/HeroOverlay';
import { InvisibleModeToggle } from '@/components/InvisibleModeToggle';
import { DndProvider } from 'react-dnd';
import { ComingSoonModal } from '@/components/ui/ComingSoonModal';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
import { NextEventCard } from '@/components/NextEventCard';
import { MiniAgenda } from '@/components/MiniAgenda';
import { CalendarWidget } from '@/components/CalendarWidget';
import BusinessProfileSettings from '@/components/BusinessProfileSettings';
import TravelManagementModule from '@/features/business-events/TravelManagementModule';

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

const BusinessDashboard = () => {
  const { language, setLanguage } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [cardOrder, setCardOrder] = useState([0, 1]);
  const [comingSoonModal, setComingSoonModal] = useState({ isOpen: false, featureName: '' });
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const { user, profile, loading } = useAuth();
  const { currentTheme, colorThemes, changeTheme } = useColorTheme();
  const { loading: siteDesignLoading } = useSiteDesign();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle authentication and authorization separately
    if (loading) return; // Wait for auth to initialize

    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile && profile.role !== 'business') {
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
    const firstName = profile?.first_name || 'Business';

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

  const showComingSoon = (featureName: string) => {
    setComingSoonModal({ isOpen: true, featureName });
  };

  const content = {
    en: {
      dashboard: "Business Dashboard",
      overview: "Overview",
      bookings: "Bookings",
      portfolio: "Portfolio", 
      messages: "Messages",
      profileSettings: "Profile Settings",
      performanceAnalytics: "Performance Analytics",
      bookingManagement: "Booking Management",
      moduleComingSoon: "Modules coming soon.",
      moduleLayout: "Module Layout",
      dashboardColors: "Dashboard Colors",
      locked: "Locked",
      unlocked: "Unlocked",
      businessAccount: "Business Account",
      uploadBusinessImage: "Upload Business Image",
      changeHeroImage: "Change Hero Image"
    },
    es: {
      dashboard: "Panel de Empresa",
      overview: "Resumen",
      bookings: "Reservas",
      portfolio: "Portafolio",
      messages: "Mensajes", 
      profileSettings: "Configuración de Perfil",
      performanceAnalytics: "Análisis de Rendimiento",
      bookingManagement: "Gestión de Reservas",
      moduleComingSoon: "Módulos próximamente.",
      moduleLayout: "Diseño de Módulos",
      dashboardColors: "Colores del Panel",
      locked: "Bloqueado",
      unlocked: "Desbloqueado",
      businessAccount: "Cuenta Empresarial",
      uploadBusinessImage: "Subir Imagen Empresarial",
      changeHeroImage: "Cambiar Imagen Principal"
    }
  };

  const t = content[language];

  // Show loading while authentication is being checked
  if (loading || siteDesignLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: 'var(--site-background)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or not business, don't render dashboard content
  if (!user || !profile || profile.role !== 'business') {
    return null;
  }

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
        {/* Hero Section with Overlay */}
        <div className="mb-6">
          <HeroOverlay
            role="business"
            user={{
              name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Business',
              avatarUrl: (profile as any)?.avatar_url,
              isOnline: true
            }}
            greeting={getGreeting()}
            dateText={currentTime.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'America/Chicago'
            })}
            invisibleMode={false}
            onToggleInvisible={() => {}}
            onBack={() => navigate('/')}
            backgroundImageUrl={(profile as any)?.background_image_url}
          />
          
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
                      className="py-2 px-3 border-b-2 border-transparent opacity-50 font-medium text-sm flex items-center gap-2 cursor-not-allowed"
                      style={{ color: currentTheme.cardForeground }}
                      disabled
                      title={language === 'en' ? 'Coming soon' : 'Próximamente'}
                    >
                      <Calendar className="h-4 w-4" />
                      {t.bookings}
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
                      <FolderOpen className="h-4 w-4" />
                      {t.portfolio}
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
          {/* Next Event and Calendar Widget */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DraggableCard id="next-event" index={0} moveCard={moveCard} isDragEnabled={isDragEnabled}>
              <NextEventCard language={language} />
            </DraggableCard>
            <DraggableCard id="calendar-widget" index={1} moveCard={moveCard} isDragEnabled={isDragEnabled}>
              <CalendarWidget language={language} />
            </DraggableCard>
          </div>

          {/* Mini Agenda */}
          <div className="mb-6">
            <MiniAgenda language={language} />
          </div>

          {/* Business Events and Travel Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Events Module */}
            <Card 
              className="border-2 hover:border-primary/50 transition-colors"
              style={{
                backgroundColor: currentTheme.cardBackground,
                borderColor: currentTheme.border,
                color: currentTheme.cardForeground
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" style={{ color: currentTheme.accent }} />
                  {language === 'en' ? 'Business Events' : 'Eventos Empresariales'}
                </CardTitle>
                <CardDescription>
                  {language === 'en' ? 'Manage your business events and bookings' : 'Gestiona tus eventos empresariales y reservas'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="business" 
                  className="w-full"
                  onClick={() => navigate('/business/events')}
                >
                  {language === 'en' ? 'Manage Events' : 'Gestionar Eventos'}
                </Button>
              </CardContent>
            </Card>

            {/* Travel Management Module */}
            <div>
              <TravelManagementModule language={language} />
            </div>
          </div>

          {/* Additional Business Dashboard Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Profile Settings */}
            <Card 
              className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
              style={{
                backgroundColor: currentTheme.cardBackground,
                borderColor: currentTheme.border,
                color: currentTheme.cardForeground
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" style={{ color: currentTheme.accent }} />
                  {t.profileSettings}
                </CardTitle>
                <CardDescription>
                  {language === 'en' ? 'Manage your business profile and upload images' : 'Gestiona tu perfil empresarial y sube imágenes'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="business" 
                    className="w-full justify-start h-8 text-sm"
                    onClick={() => setProfileSettingsOpen(true)}
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    {t.uploadBusinessImage}
                  </Button>
                  <Button 
                    variant="business" 
                    className="w-full justify-start h-8 text-sm"
                    onClick={() => setProfileSettingsOpen(true)}
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    {t.changeHeroImage}
                  </Button>
                  <Button 
                    variant="business" 
                    className="w-full justify-start h-8 text-sm"
                    onClick={() => setProfileSettingsOpen(true)}
                  >
                    <Building2 className="h-3 w-3 mr-2" />
                    {language === 'en' ? 'Add Business Name' : 'Agregar Nombre Empresarial'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Booking Management */}
            <Card 
              className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
              style={{
                backgroundColor: currentTheme.cardBackground,
                borderColor: currentTheme.border,
                color: currentTheme.cardForeground
              }}
              onClick={() => navigate('/business/booking-management')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" style={{ color: currentTheme.accent }} />
                  {t.bookingManagement}
                </CardTitle>
                <CardDescription>
                  {language === 'en' ? 'Manage your business events and bookings' : 'Gestiona tus eventos empresariales y reservas'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="business" 
                  className="w-full"
                >
                  {language === 'en' ? 'Manage Bookings' : 'Gestionar Reservas'}
                </Button>
              </CardContent>
            </Card>

            {/* Performance Analytics */}
            <Card 
              className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
              style={{
                backgroundColor: currentTheme.cardBackground,
                borderColor: currentTheme.border,
                color: currentTheme.cardForeground
              }}
              onClick={() => showComingSoon(t.performanceAnalytics)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" style={{ color: currentTheme.accent }} />
                  {t.performanceAnalytics}
                </CardTitle>
                <CardDescription>
                  {language === 'en' ? 'View analytics and performance metrics' : 'Ve analíticas y métricas de rendimiento'}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  {language === 'en' ? 'Feature Coming Soon' : 'Función Próximamente'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Note about event access */}
          <div className="col-span-full">
            <Card 
              className="border-2"
              style={{
                backgroundColor: currentTheme.cardBackground,
                borderColor: currentTheme.border,
                color: currentTheme.cardForeground
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" style={{ color: currentTheme.accent }} />
                  {language === 'en' ? 'Event Access' : 'Acceso a Eventos'}
                </CardTitle>
                <CardDescription>
                  {language === 'en' 
                    ? 'Events are created by administrators. You will be notified when assigned to events.' 
                    : 'Los eventos son creados por administradores. Serás notificado cuando seas asignado a eventos.'
                  }
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Coming Soon Modal */}
        <ComingSoonModal
          isOpen={comingSoonModal.isOpen}
          onClose={() => setComingSoonModal({ isOpen: false, featureName: '' })}
          featureName={comingSoonModal.featureName}
          language={language}
        />

        {/* Business Profile Settings Modal */}
        <BusinessProfileSettings
          language={language}
          isOpen={profileSettingsOpen}
          onClose={() => setProfileSettingsOpen(false)}
        />

        {/* Message Center with proper spacing */}
        <div className="mt-8">
          <RealtimeMessageCenter language={language} />
        </div>
        </div>
        
        <Footer language={language} />
      </div>
    </DndProvider>
  );
};

export default BusinessDashboard;