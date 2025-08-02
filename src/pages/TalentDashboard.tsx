import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MessageCenter from '@/components/MessageCenter';
import ProfileManager from '@/components/ProfileManager';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, User, Star, FileText, BarChart3 } from 'lucide-react';

const TalentDashboard = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [currentTime, setCurrentTime] = useState(new Date());
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

  return (
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

        {/* Profile Section */}
        <ProfileManager language={language} />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 border-2 border-black bg-white">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.overview}
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t.bookings}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t.messages}
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t.portfolio}
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.earnings}
            </TabsTrigger>
          </TabsList>

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
              <Card className="border-2 border-black bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t.portfolioManagement}
                  </CardTitle>
                  <CardDescription>{t.portfolioManagementDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.updatePortfolio}</Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {t.bookingManagement}
                  </CardTitle>
                  <CardDescription>{t.bookingManagementDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.viewBookings}</Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {t.availabilityCalendar}
                  </CardTitle>
                  <CardDescription>{t.availabilityCalendarDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.setAvailability}</Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t.earningsReports}
                  </CardTitle>
                  <CardDescription>{t.earningsReportsDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.viewEarnings}</Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t.profileSettings}
                  </CardTitle>
                  <CardDescription>{t.profileSettingsDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.updateProfile}</Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-black bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t.performanceAnalytics}
                  </CardTitle>
                  <CardDescription>{t.performanceAnalyticsDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">{t.viewAnalytics}</Button>
                </CardContent>
              </Card>
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
            <MessageCenter language={language} />
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
  );
};

export default TalentDashboard;