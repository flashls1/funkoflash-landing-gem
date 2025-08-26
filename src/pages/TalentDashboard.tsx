import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RealtimeMessageCenter from '@/components/RealtimeMessageCenter';
import { TalentAssetsManager } from '@/features/talent-assets/TalentAssetsManager';
import { useAuth } from '@/hooks/useAuth';
import { InvisibleModeToggle } from '@/components/InvisibleModeToggle';
import { useNavigate } from 'react-router-dom';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useSiteDesign } from '@/hooks/useSiteDesign';
import { Calendar, MessageSquare, User, Star, FileText, BarChart3, Settings, DollarSign, TrendingUp, Lock, Unlock, Palette, ChevronDown } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
import { NextEventCard } from '@/components/NextEventCard';
import { CalendarWidget } from '@/components/CalendarWidget';
import { MiniAgenda } from '@/components/MiniAgenda';

// Draggable card component for talent
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

const TalentDashboard = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [cardOrder, setCardOrder] = useState([0, 1, 2, 3, 4, 5]);
  const { user, profile } = useAuth();
  const { currentTheme, colorThemes, changeTheme } = useColorTheme();
  const { loading: siteDesignLoading } = useSiteDesign();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile || profile.role !== 'talent') {
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
    const firstName = profile?.first_name || 'Talent';

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
      dashboard: "Talent Dashboard",
      overview: "Overview",
      bookings: "Bookings",
      messages: "Messages",
      portfolio: "Portfolio",
      earnings: "Earnings",
      upcomingBookings: "Upcoming Bookings",
      totalEarnings: "Total Earnings",
      profileViews: "Profile Views",
      averageRating: "Average Rating",
      portfolioManagement: "Portfolio Management",
      portfolioManagementDesc: "Manage your portfolio, photos, and showcase work",
      updatePortfolio: "Update Portfolio",
      bookingManagement: "Booking Management",
      bookingManagementDesc: "View and manage your event bookings",
      viewBookings: "View Bookings",
      availabilityCalendar: "Availability Calendar",
      availabilityCalendarDesc: "Set your availability for new bookings",
      setAvailability: "Set Availability",
      earningsReports: "Earnings Reports",
      earningsReportsDesc: "Track your earnings and payment history",
      viewEarnings: "View Earnings",
      profileSettings: "Profile Settings",
      profileSettingsDesc: "Update your profile information and preferences",
      updateProfile: "Update Profile",
      performanceAnalytics: "Performance Analytics",
      performanceAnalyticsDesc: "View analytics on your bookings and performance",
      viewAnalytics: "View Analytics"
    },
    es: {
      dashboard: "Panel de Talento",
      overview: "Resumen",
      bookings: "Reservas",
      messages: "Mensajes",
      portfolio: "Portafolio",
      earnings: "Ganancias",
      upcomingBookings: "Próximas Reservas",
      totalEarnings: "Ganancias Totales",
      profileViews: "Vistas del Perfil",
      averageRating: "Calificación Promedio",
      portfolioManagement: "Gestión de Portafolio",
      portfolioManagementDesc: "Gestiona tu portafolio, fotos y muestra tu trabajo",
      updatePortfolio: "Actualizar Portafolio",
      bookingManagement: "Gestión de Reservas",
      bookingManagementDesc: "Ver y gestionar tus reservas de eventos",
      viewBookings: "Ver Reservas",
      availabilityCalendar: "Calendario de Disponibilidad",
      availabilityCalendarDesc: "Establece tu disponibilidad para nuevas reservas",
      setAvailability: "Establecer Disponibilidad",
      earningsReports: "Reportes de Ganancias",
      earningsReportsDesc: "Rastrea tus ganancias e historial de pagos",
      viewEarnings: "Ver Ganancias",
      profileSettings: "Configuración del Perfil",
      profileSettingsDesc: "Actualiza tu información de perfil y preferencias",
      updateProfile: "Actualizar Perfil",
      performanceAnalytics: "Analíticas de Rendimiento",
      performanceAnalyticsDesc: "Ve analíticas de tus reservas y rendimiento",
      viewAnalytics: "Ver Analíticas"
    }
  };

  const t = content[language];

  // Show loading while authentication and site design are being checked
  if (siteDesignLoading) {
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

  if (!user || !profile || profile.role !== 'talent') {
    return null;
  }

  // Module definitions with colors for talent
  const moduleCards = [
    { id: 'portfolio-management', icon: User, color: 'text-purple-500', title: t.portfolioManagement, desc: t.portfolioManagementDesc, action: t.updatePortfolio },
    { id: 'booking-management', icon: Calendar, color: 'text-blue-500', title: t.bookingManagement, desc: t.bookingManagementDesc, action: t.viewBookings },
    { id: 'availability-calendar', icon: Calendar, color: 'text-green-500', title: t.availabilityCalendar, desc: t.availabilityCalendarDesc, action: t.setAvailability },
    { id: 'earnings-reports', icon: DollarSign, color: 'text-yellow-500', title: t.earningsReports, desc: t.earningsReportsDesc, action: t.viewEarnings },
    { id: 'profile-settings', icon: Settings, color: 'text-gray-500', title: t.profileSettings, desc: t.profileSettingsDesc, action: t.updateProfile },
    { id: 'performance-analytics', icon: TrendingUp, color: 'text-orange-500', title: t.performanceAnalytics, desc: t.performanceAnalyticsDesc, action: t.viewAnalytics }
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
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-purple-500 to-pink-600 text-white">
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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{t.overview}</TabsTrigger>
            <TabsTrigger value="bookings">{t.bookings}</TabsTrigger>
            <TabsTrigger value="messages">{t.messages}</TabsTrigger>
            <TabsTrigger value="portfolio">{t.portfolio}</TabsTrigger>
            <TabsTrigger value="earnings">{t.earnings}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Next Event and Calendar Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <NextEventCard language={language} />
              <div className="lg:col-span-1">
                <CalendarWidget language={language} />
              </div>
            </div>
            
            {/* Mini Agenda */}
            <div className="mb-6">
              <MiniAgenda language={language} />
            </div>

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
                  <CardTitle className="text-sm font-medium">{t.upcomingBookings}</CardTitle>
                  <Calendar className="h-4 w-4 opacity-80" style={{ color: currentTheme.accent }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs opacity-80">Next 30 days</p>
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
                  <CardTitle className="text-sm font-medium">{t.totalEarnings}</CardTitle>
                  <BarChart3 className="h-4 w-4 opacity-80" style={{ color: currentTheme.accent }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$2,450</div>
                  <p className="text-xs opacity-80">This month</p>
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
                  <CardTitle className="text-sm font-medium">{t.profileViews}</CardTitle>
                  <User className="h-4 w-4 opacity-80" style={{ color: currentTheme.accent }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">157</div>
                  <p className="text-xs opacity-80">This week</p>
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
                  <CardTitle className="text-sm font-medium">{t.averageRating}</CardTitle>
                  <Star className="h-4 w-4 opacity-80" style={{ color: currentTheme.accent }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8</div>
                  <p className="text-xs opacity-80">★★★★★</p>
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
                      className="border-2 transition-transform hover:scale-105 cursor-pointer"
                      onClick={() => {
                        if (card.id === 'availability-calendar') {
                          navigate('/calendar');
                        }
                      }}
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
                          onClick={() => {
                            if (card.id === 'availability-calendar') {
                              navigate('/calendar');
                            }
                          }}
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
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="border-2 border-black bg-white">
              <CardHeader>
                <CardTitle>{t.bookingManagement}</CardTitle>
                <CardDescription>View and manage your event bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Booking management functionality will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <RealtimeMessageCenter language={language} />
          </TabsContent>

          <TabsContent value="portfolio">
            <TalentAssetsManager talentId={profile?.id} locale={language} />
          </TabsContent>

          <TabsContent value="earnings">
            <Card className="border-2 border-black bg-white">
              <CardHeader>
                <CardTitle>{t.earningsReports}</CardTitle>
                <CardDescription>Track your earnings and payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Earnings tracking functionality will be implemented here.</p>
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

export default TalentDashboard;