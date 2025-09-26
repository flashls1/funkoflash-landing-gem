import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { useTalentProfile } from '@/hooks/useTalentProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatDateUS } from '@/lib/utils';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const TalentEvents = () => {
  const { language, setLanguage } = useLanguage();
  const { user, profile } = useAuth();
  const { talentProfile, loading: talentLoading, error: talentError } = useTalentProfile();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile || profile.role !== 'talent') {
      navigate('/auth');
      return;
    }
    if (talentProfile) {
      fetchUpcomingEvents();
    }
  }, [user, profile, talentProfile, navigate]);

  const fetchUpcomingEvents = async () => {
    if (!talentProfile) return;

    try {
      setLoading(true);
      
      // Get business events where talent is assigned
      const { data: businessEvents, error: businessError } = await supabase
        .from('business_events')
        .select(`
          *,
          business_event_talent!inner(talent_id)
        `)
        .eq('business_event_talent.talent_id', talentProfile.id)
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
    return <div>Loading...</div>;
  }

  if (talentError || !talentProfile) {
    return <div>Error: Unable to load talent profile. Please contact support.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/talent')}
            className="text-primary hover:text-primary/80 mb-4"
          >
            {content[language].backToDashboard}
          </button>
          
          <h1 className="text-2xl font-bold mb-2">{content[language].upcomingEvents}</h1>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{content[language].noEvents}</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {upcomingEvents.map((event) => (
            <Card 
              key={event.id}
              className={`overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                isMobile ? 'mx-[5px] h-[200px]' : ''
              }`}
              onClick={() => navigate(`/talent/events/${event.id}/schedule`)}
            >
            <CardContent className="p-0">
              <div className={`flex ${isMobile ? 'flex-row h-full' : 'flex-col'}`}>
                {/* Event Image */}
                <div className={`${isMobile ? 'w-[150px] h-full' : 'w-full h-40'} flex-shrink-0`}>
                  {event.hero_logo_path ? (
                    <img 
                      src={event.hero_logo_path} 
                      alt={event.title}
                      className={`w-full h-full object-cover ${
                        isMobile ? 'rounded-l-lg' : 'rounded-t-lg'
                      }`}
                      style={isMobile ? { 
                        width: '150px', 
                        height: '150px',
                        objectFit: 'cover'
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
                    <div className={`${isMobile ? 'flex-1 p-4' : 'p-4'} flex flex-col justify-between`}>
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`font-semibold ${isMobile ? 'text-sm' : 'text-lg'} line-clamp-2`}>
                            {event.title}
                          </h3>
                          {!isMobile && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {event.status || 'pending'}
                            </Badge>
                          )}
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1 mb-2 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className={`${isMobile ? 'text-xs' : 'text-sm'} line-clamp-1`}>
                            {event.city}, {event.state}
                          </span>
                        </div>
                      </div>

                      {/* Dates - positioned on the right in mobile */}
                      <div className={`${isMobile ? 'absolute right-4 top-4' : ''}`}>
                        <div className={`flex items-center gap-1 text-muted-foreground ${
                          isMobile ? 'flex-col items-end' : ''
                        }`}>
                          <Clock className={`h-3 w-3 ${isMobile ? 'mb-1' : ''}`} />
                          <span className={`${isMobile ? 'text-xs text-right' : 'text-sm'}`}>
                            {formatDateUS(event.start_ts)}
                            {event.end_ts && ` - ${formatDateUS(event.end_ts)}`}
                          </span>
                        </div>
                        
                        {isMobile && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {event.status || 'pending'}
                          </Badge>
                        )}
                      </div>
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