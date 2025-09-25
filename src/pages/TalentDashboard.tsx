import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RealtimeMessageCenter from '@/components/RealtimeMessageCenter';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useSiteDesign } from '@/hooks/useSiteDesign';
import { 
  Calendar, 
  MessageSquare, 
  User, 
  Star, 
  FileText, 
  BarChart3, 
  Settings, 
  DollarSign, 
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight
} from 'lucide-react';
import HeroOverlay from '@/components/HeroOverlay';
import HeroShell from '@/components/HeroShell';
import TalentProfileSettings from '@/components/TalentProfileSettings';
import { EventDetailsModal } from '@/components/EventDetailsModal';
import { formatDateUS, formatTimeUS } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const TalentDashboard = () => {
  const { language, setLanguage } = useLanguage();
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [activeModule, setActiveModule] = useState('overview');
  const { user, profile } = useAuth();
  const { currentTheme, colorThemes, changeTheme } = useColorTheme();
  const { loading: siteDesignLoading } = useSiteDesign();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile || profile.role !== 'talent') {
      navigate('/auth');
      return;
    }
    fetchUpcomingEvents();
  }, [user, profile, navigate]);

  const fetchUpcomingEvents = async () => {
    if (!profile) return;

    try {
      // Get events from calendar_event table for this talent
      const { data: calendarEvents, error: calendarError } = await supabase
        .from('calendar_event')
        .select('*')
        .eq('talent_id', profile.id)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(5);

      // Get business events where talent is assigned
      const { data: businessEvents, error: businessError } = await supabase
        .from('business_events')
        .select(`
          *,
          business_event_talent!inner(talent_id)
        `)
        .eq('business_event_talent.talent_id', profile.id)
        .gte('start_ts', new Date().toISOString())
        .order('start_ts', { ascending: true })
        .limit(5);

      const allEvents = [
        ...(calendarEvents || []).map((event: any) => ({ ...event, type: 'calendar' })),
        ...(businessEvents || []).map((event: any) => ({ ...event, type: 'business' }))
      ].sort((a: any, b: any) => {
        const dateA = new Date(a.start_date || a.start_ts);
        const dateB = new Date(b.start_date || b.start_ts);
        return dateA.getTime() - dateB.getTime();
      });

      setUpcomingEvents(allEvents.slice(0, 3)); // Show top 3
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleModuleClick = (moduleId: string) => {
    switch (moduleId) {
      case 'events':
        navigate('/talent/events');
        break;
      case 'calendar':
        navigate('/calendar');
        break;
      case 'messages':
        setActiveModule('messages');
        break;
      case 'portfolio':
        navigate('/talent/portfolio-management');
        break;
      case 'earnings':
        navigate('/talent/earnings');
        break;
      case 'performance':
        navigate('/talent/performance');
        break;
      case 'settings':
        setIsProfileSettingsOpen(true);
        break;
      default:
        setActiveModule(moduleId);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = profile?.first_name || 'Talent';
    
    const greetings = {
      en: {
        morning: `Good morning, ${firstName}!`,
        afternoon: `Good afternoon, ${firstName}!`,
        evening: `Good evening, ${firstName}!`
      },
      es: {
        morning: `¡Buenos días, ${firstName}!`,
        afternoon: `¡Buenas tardes, ${firstName}!`,
        evening: `¡Buenas noches, ${firstName}!`
      }
    };

    if (hour < 12) return greetings[language].morning;
    if (hour < 18) return greetings[language].afternoon;
    return greetings[language].evening;
  };

  const content = {
    en: {
      welcome: 'Welcome to your dashboard',
      events: 'Events',
      calendar: 'Calendar',
      messages: 'Messages',
      portfolio: 'Portfolio',
      earnings: 'Earnings',
      performance: 'Performance',
      settings: 'Settings',
      opportunities: 'Opportunities',
      contracts: 'Contracts',
      upcomingEvents: 'Upcoming Events',
      noEvents: 'No upcoming events',
      viewAll: 'View All',
      quickStats: 'Quick Stats',
      totalBookings: 'Total Bookings',
      thisMonth: 'This Month',
      totalEarnings: 'Total Earnings',
      profileViews: 'Profile Views',
      avgRating: 'Avg Rating'
    },
    es: {
      welcome: 'Bienvenido a tu panel',
      events: 'Eventos',
      calendar: 'Calendario',
      messages: 'Mensajes',
      portfolio: 'Portafolio',
      earnings: 'Ganancias',
      performance: 'Rendimiento',
      settings: 'Configuración',
      opportunities: 'Oportunidades',
      contracts: 'Contratos',
      upcomingEvents: 'Próximos Eventos',
      noEvents: 'No hay eventos próximos',
      viewAll: 'Ver Todos',
      quickStats: 'Estadísticas Rápidas',
      totalBookings: 'Reservas Totales',
      thisMonth: 'Este Mes',
      totalEarnings: 'Ganancias Totales',
      profileViews: 'Vistas del Perfil',
      avgRating: 'Calificación Promedio'
    }
  };

  const dashboardModules = [
    { id: 'events', icon: Calendar, label: content[language].events, color: 'bg-blue-500' },
    { id: 'calendar', icon: Clock, label: content[language].calendar, color: 'bg-green-500' },
    { id: 'messages', icon: MessageSquare, label: content[language].messages, color: 'bg-purple-500' },
    { id: 'portfolio', icon: FileText, label: content[language].portfolio, color: 'bg-orange-500' },
    { id: 'earnings', icon: DollarSign, label: content[language].earnings, color: 'bg-yellow-500' },
    { id: 'performance', icon: TrendingUp, label: content[language].performance, color: 'bg-red-500' },
    { id: 'settings', icon: Settings, label: content[language].settings, color: 'bg-gray-500' },
    { id: 'opportunities', icon: Star, label: content[language].opportunities, color: 'bg-cyan-500' },
    { id: 'contracts', icon: BarChart3, label: content[language].contracts, color: 'bg-indigo-500' }
  ];

  if (siteDesignLoading) {
    return <div>Loading...</div>;
  }

  if (activeModule === 'messages') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="container mx-auto px-4 py-6">
          <Button 
            onClick={() => setActiveModule('overview')} 
            variant="ghost" 
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <RealtimeMessageCenter language={language} />
        </div>
        <Footer language={language} />
      </div>
    );
  }

  const backgroundUrl = (profile as any)?.background_image_url || '/lovable-uploads/d0f4637c-55b5-42eb-af08-29eabb28b253.png';

  return (
    <div className="min-h-screen" style={{
      backgroundImage: `url(${backgroundUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="min-h-screen bg-black/50 pt-[5px]">
        <Navigation language={language} setLanguage={setLanguage} />
        
        <div className="pt-4">
          <HeroShell imageUrl={backgroundUrl}>
            <HeroOverlay 
              role={profile?.role || 'talent'}
              user={user || { name: profile?.first_name || 'User' } as any}
              invisibleMode={false}
              onToggleInvisible={() => {}}
            />
            <div className="relative z-10 text-center text-white">
              <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white">
                <AvatarImage src={(profile as any)?.avatar_url} alt={profile?.first_name} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-3xl font-bold mb-2">{getGreeting()}</h1>
              <p className="text-lg opacity-90">{content[language].welcome}</p>
            </div>
          </HeroShell>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card/90 backdrop-blur">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-sm text-muted-foreground">{content[language].totalBookings}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/90 backdrop-blur">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">$2,450</div>
                <div className="text-sm text-muted-foreground">{content[language].thisMonth}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/90 backdrop-blur">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">1,234</div>
                <div className="text-sm text-muted-foreground">{content[language].profileViews}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/90 backdrop-blur">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">4.8</div>
                <div className="text-sm text-muted-foreground">{content[language].avgRating}</div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events */}
          <Card className="bg-card/90 backdrop-blur mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {content[language].upcomingEvents}
                </CardTitle>
                <Button variant="ghost" onClick={() => navigate('/calendar')}>
                  {content[language].viewAll}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-background/50 rounded-lg cursor-pointer hover:bg-background/70 transition-colors"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div>
                          <h4 className="font-medium">{event.title || event.event_title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDateUS(event.start_date || event.start_ts)}
                            {event.city && (
                              <>
                                <MapPin className="h-3 w-3 ml-2" />
                                {event.city}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {event.status || 'Scheduled'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {content[language].noEvents}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3x3 Module Grid */}
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {dashboardModules.map((module) => {
              const IconComponent = module.icon;
              return (
                <Card 
                  key={module.id}
                  className="bg-card/90 backdrop-blur cursor-pointer hover:scale-105 transition-transform duration-200 aspect-square"
                  onClick={() => handleModuleClick(module.id)}
                >
                  <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center">
                    <div className={`w-12 h-12 rounded-full ${module.color} flex items-center justify-center mb-3`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-base">{module.label}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Footer language={language} />
      </div>

      <TalentProfileSettings
        language={language}
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
      />

      <EventDetailsModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={selectedEvent}
        language={language}
      />
    </div>
  );
};

export default TalentDashboard;