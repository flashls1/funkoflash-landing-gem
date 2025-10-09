import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { useTalentProfile } from '@/hooks/useTalentProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatDateUS } from '@/lib/utils';
import { MapPin, Calendar, Clock, ArrowLeft } from 'lucide-react';

// Helper function to format dates with day names
const formatDateWithDayName = (dateString: string) => {
  const date = new Date(dateString);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();
  
  // Add ordinal suffix (st, nd, rd, th)
  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  return `${dayName} ${month} ${getOrdinalSuffix(day)}, ${year}`;
};

const formatEventDateRange = (startDate: string, endDate: string | null) => {
  if (!endDate) {
    return formatDateWithDayName(startDate);
  }
  
  const start = formatDateWithDayName(startDate);
  const end = formatDateWithDayName(endDate);
  
  if (start === end) {
    return start;
  }
  
  return `${start} and ${end}`;
};
import { useIsMobile } from '@/hooks/use-mobile';

const TalentEvents = () => {
  const { language, setLanguage } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const { talentProfile, loading: talentLoading, error: talentError } = useTalentProfile();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (talentError || !user || !profile || profile.role !== 'talent') {
      navigate('/auth');
      return;
    }
    if (talentProfile) {
      fetchUpcomingEvents();
    }
  }, [user, profile, talentProfile, navigate, talentError]);

  const fetchUpcomingEvents = async () => {
    if (!talentProfile) return;

    try {
      setLoading(true);
      
      // First get event IDs from business_event_talent where talent is assigned
      const { data: talentAssignments, error: assignmentError } = await supabase
        .from('business_event_talent')
        .select('event_id')
        .eq('talent_id', talentProfile.id);

      if (assignmentError) throw assignmentError;

      if (!talentAssignments || talentAssignments.length === 0) {
        setUpcomingEvents([]);
        return;
      }

      const eventIds = talentAssignments.map(assignment => assignment.event_id);

      // Get business events using the event IDs
      const { data: businessEvents, error: businessError } = await supabase
        .from('business_events')
        .select('*')
        .in('id', eventIds)
        .gte('start_ts', new Date().toISOString())
        .order('start_ts', { ascending: true });

      if (businessError) throw businessError;

      setUpcomingEvents(businessEvents || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    en: {
      upcomingEvents: 'Upcoming Events',
      noEvents: 'No upcoming events',
      backToDashboard: '← Back to Dashboard',
      location: 'Location',
      dates: 'Dates',
      status: 'Status'
    },
    es: {
      upcomingEvents: 'Próximos Eventos',
      noEvents: 'No hay eventos próximos',
      backToDashboard: '← Volver al Panel',
      location: 'Ubicación', 
      dates: 'Fechas',
      status: 'Estado'
    }
  };

  if (loading || talentLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/talent')}
            className="mb-4 min-h-[44px] h-11 px-4 text-base font-semibold pointer-events-auto z-10 relative"
            aria-label={content[language].backToDashboard}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {content[language].backToDashboard}
          </Button>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-white text-lg">
              {language === 'en' ? 'Loading your events...' : 'Cargando tus eventos...'}
            </p>
          </div>
        </div>
        <div className="hidden md:block">
          <Footer language={language} />
        </div>
      </div>
    );
  }

  if (talentError || !talentProfile) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/talent')}
            className="mb-4 min-h-[44px] h-11 px-4 text-base font-semibold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {content[language].backToDashboard}
          </Button>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md">
              <p className="text-white text-lg mb-4">
                {language === 'en' 
                  ? 'Unable to load talent profile. Please contact support.' 
                  : 'No se pudo cargar el perfil del talento. Por favor contacte soporte.'}
              </p>
              <Button
                onClick={() => navigate('/dashboard/talent')}
                className="min-h-[44px] h-11 px-6 text-base font-semibold"
              >
                {content[language].backToDashboard}
              </Button>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <Footer language={language} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 relative z-20">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/talent')}
            className="mb-4 min-h-[44px] h-11 px-4 text-base font-semibold pointer-events-auto"
            aria-label={content[language].backToDashboard}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {content[language].backToDashboard}
          </Button>
          
          <h1 className="text-2xl font-bold mb-2 text-white">{content[language].upcomingEvents}</h1>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-12 text-white">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{content[language].noEvents}</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {upcomingEvents.map((event) => (
            <Card 
              key={event.id}
              className={`overflow-hidden transition-all hover:shadow-lg cursor-pointer border-2 border-sky-300 bg-card ${
                isMobile ? 'mx-[5px] h-[200px]' : ''
              }`}
              onClick={() => navigate(`/talent/events/${event.id}/schedule`)}
            >
            <CardContent className="p-0 h-full">
              <div className={`flex ${isMobile ? 'flex-row h-full items-stretch' : 'flex-col'}`}>
                {/* Event Image */}
                 <div className={`${isMobile ? 'w-[150px] h-full flex items-center justify-center p-2 rounded-l-lg rounded-r-lg' : 'w-full h-40'} flex-shrink-0 border-2 border-funko-blue-dark bg-card`}>
                   {event.hero_logo_path ? (
                     <img 
                       src={event.hero_logo_path} 
                       alt={event.title}
                        className={`w-auto h-auto object-contain ${
                          isMobile ? '' : 'rounded-t-lg'
                        }`}
                       style={isMobile ? { 
                         maxWidth: '130px', 
                         maxHeight: '130px'
                       } : {}}
                     />
                   ) : (
                     <div className={`w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ${
                       isMobile ? 'rounded-l-lg' : 'rounded-t-lg'
                     }`}>
                       <Calendar className="h-8 w-8 text-primary/50" />
                     </div>
                   )}
                 </div>

                    {/* Event Details */}
                    <div className={`${isMobile ? 'flex-1 h-full pt-2 pb-2 px-4 relative' : 'p-4'} flex flex-col justify-between`}>
                      <div>
                        <div className="flex items-start justify-between mb-1 -mt-[2px]">
                           <h3 className={`font-semibold ${isMobile ? 'text-sm' : 'text-lg'} line-clamp-2`}>
                             {event.title}
                           </h3>
                          {!isMobile && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                              {event.status === 'published' ? 'Booked' : (event.status || 'pending')}
                            </Badge>
                          )}
                        </div>

                        {/* Full Address */}
                         <div className="flex items-start gap-1 mb-1 text-muted-foreground">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />
                          <div className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                            {event.venue && <div className="font-medium">{event.venue}</div>}
                            <div>
                              {[event.address_line, event.city, event.state, event.zipcode]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          </div>
                        </div>

                        {/* Event Dates */}
                         <div className="flex items-start gap-1 mb-1 text-muted-foreground">
                           <Clock className="h-3 w-3 mt-0.5 flex-shrink-0 text-accent" />
                          <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                            {formatEventDateRange(event.start_ts, event.end_ts)}
                          </span>
                        </div>
                      </div>

                      {/* Booked Badge - Bottom Right */}
                      {isMobile && (
                        <div className="absolute bottom-2 right-3">
                          <Badge variant="secondary" className="text-xs">
                            {event.status === 'published' ? 'Booked' : (event.status || 'pending')}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <Footer language={language} />
      </div>
    </div>
  );
};

export default TalentEvents;