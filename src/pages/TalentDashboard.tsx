import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RealtimeMessageCenter from '@/components/RealtimeMessageCenter';
import ProfileManager from '@/components/ProfileManager';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, User, Star, FileText, BarChart3, Settings, DollarSign, TrendingUp, Lock, Unlock } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';

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
        {/* Header with Enhanced Design */}
        <div className="relative mb-8 overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent rounded-2xl"></div>
          
          {/* Content */}
          <div className="relative p-8 bg-gradient-to-r from-purple-900/80 via-pink-900/80 to-orange-900/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
            <div className="flex items-center gap-4">
              {/* Decorative accent */}
              <div className="w-2 h-16 bg-gradient-to-b from-pink-400 via-purple-400 to-orange-400 rounded-full shadow-lg"></div>
              
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

        {/* Combined Profile and Module Layout Bar */}
        <div className="mb-6 space-y-0">
          <ProfileManager language={language} />
          
          {/* Combined Module Layout and Navigation Bar - Flush with profile */}
          <Card className="border-2 border-black border-t-0 rounded-t-none bg-white/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  {/* Module Layout Controls */}
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

                  {/* Navigation Tabs */}
                  <nav className="flex space-x-6">
                    <button className="py-2 px-3 border-b-2 border-funko-orange text-funko-orange font-medium text-sm transition-colors flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {t.overview}
                    </button>
                    <button className="py-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t.bookings}
                    </button>
                    <button className="py-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t.messages}
                    </button>
                    <button className="py-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t.portfolio}
                    </button>
                    <button className="py-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {t.earnings}
                    </button>
                  </nav>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-2 border-black bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.upcomingBookings}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Next 30 days</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.totalEarnings}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$2,450</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.profileViews}</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">157</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.averageRating}</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8</div>
                  <p className="text-xs text-muted-foreground">★★★★★</p>
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
                        <Button className="w-full">
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
            <Card className="border-2 border-black bg-white">
              <CardHeader>
                <CardTitle>{t.portfolioManagement}</CardTitle>
                <CardDescription>Manage your portfolio and showcase your work</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Portfolio management functionality will be implemented here.</p>
              </CardContent>
            </Card>
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