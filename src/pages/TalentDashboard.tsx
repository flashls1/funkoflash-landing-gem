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
import { useBackgroundManager } from '@/hooks/useBackgroundManager';
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
  const { getBackgroundStyle } = useBackgroundManager();
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


  const content = {
    en: {
      backToDashboard: '← Back to Dashboard',
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
      backToDashboard: '← Volver al Panel',
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
    { id: 'events', icon: Calendar, label: content[language].events, gradient: 'from-blue-500 to-purple-600' },
    { id: 'calendar', icon: Clock, label: content[language].calendar, gradient: 'from-pink-500 to-orange-500' },
    { id: 'messages', icon: MessageSquare, label: content[language].messages, gradient: 'from-teal-400 to-cyan-500' },
    { id: 'portfolio', icon: FileText, label: content[language].portfolio, gradient: 'from-red-500 to-yellow-400' },
    { id: 'earnings', icon: DollarSign, label: content[language].earnings, gradient: 'from-green-500 to-lime-400' },
    { id: 'performance', icon: TrendingUp, label: content[language].performance, gradient: 'from-purple-500 to-indigo-600' },
    { id: 'settings', icon: Settings, label: content[language].settings, gradient: 'from-orange-400 to-pink-500' },
    { id: 'opportunities', icon: Star, label: content[language].opportunities, gradient: 'from-cyan-400 to-blue-500' },
    { id: 'contracts', icon: BarChart3, label: content[language].contracts, gradient: 'from-yellow-400 to-red-500' }
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
            {content[language].backToDashboard}
          </Button>
          <RealtimeMessageCenter language={language} />
        </div>
        <Footer language={language} />
      </div>
    );
  }

  const backgroundUrl = (profile as any)?.background_image_url || '/lovable-uploads/d0f4637c-55b5-42eb-af08-29eabb28b253.png';

  return (
    <div className="min-h-screen" style={getBackgroundStyle()}>
      <div className="min-h-screen bg-black/50 pt-[5px]">
        <Navigation language={language} setLanguage={setLanguage} />
        
        <div className="pt-4 px-[5px]">
          <div className="border-2 border-white rounded-2xl overflow-hidden relative">
            <HeroShell imageUrl={backgroundUrl}>
            <HeroOverlay 
              role={profile?.role || 'talent'}
              user={{
                name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Talent',
                avatarUrl: (profile as any)?.avatar_url,
                isOnline: true,
                businessName: null
              }}
              invisibleMode={false}
              onToggleInvisible={() => {}}
              locale={language}
            />
            </HeroShell>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* 3x3 Module Grid */}
          <div className="grid grid-cols-3 gap-4">
            {dashboardModules.map((module) => {
              const IconComponent = module.icon;
              return (
                <button
                  key={module.id}
                  className={`flex flex-col items-center justify-center w-full h-28 rounded-lg border-2 border-blue-900 bg-gradient-to-r ${module.gradient} shadow-md hover:scale-105 hover:brightness-110 transition-transform`}
                  onClick={() => handleModuleClick(module.id)}
                >
                  <IconComponent className="h-8 w-8 mb-2 text-white" />
                  <span className="text-sm font-bold text-white truncate">{module.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden md:block">
          <Footer language={language} />
          </div>
          
          {/* Orange line at bottom of page - 20px below buttons */}
          <div className="mt-5 mx-4">
            <div className="h-0.5 bg-funko-orange w-full"></div>
          </div>
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