import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTalentProfile } from '@/hooks/useTalentProfile';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Plane, 
  Calendar, 
  MapPin,
  CalendarDays
} from 'lucide-react';

const TalentEventSchedule = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { talentProfile, loading: talentLoading, error: talentError } = useTalentProfile();
  const { language, setLanguage } = useLanguage();
  const isMobile = useIsMobile();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile || profile.role !== 'talent') {
      navigate('/auth');
      return;
    }
    if (eventId && talentProfile) {
      fetchEvent();
    }
  }, [user, profile, eventId, talentProfile, navigate]);

  const fetchEvent = async () => {
    if (!eventId || !talentProfile) return;

    try {
      setLoading(true);
      
      const { data: businessEvent, error } = await supabase
        .from('business_events')
        .select(`
          *,
          business_event_talent!inner(talent_id)
        `)
        .eq('id', eventId)
        .eq('business_event_talent.talent_id', talentProfile.id)
        .single();

      if (error) throw error;
      setEvent(businessEvent);
    } catch (error) {
      console.error('Error fetching event:', error);
      navigate('/talent/events');
    } finally {
      setLoading(false);
    }
  };

  const content = {
    en: {
      backToEvents: '← Back to Events',
      scheduleOptions: 'Schedule Options',
      travel: 'Travel',
      travelDesc: 'View flights, transport & hotel details',
      personalSchedule: 'Personal Schedule',
      personalDesc: 'Your private itinerary & planning',
      showSchedule: 'Show Schedule',
      showDesc: 'Official event programming & activities'
    },
    es: {
      backToEvents: '← Volver a Eventos',
      scheduleOptions: 'Opciones de Horario',
      travel: 'Viaje',
      travelDesc: 'Ver vuelos, transporte y detalles del hotel',
      personalSchedule: 'Horario Personal',
      personalDesc: 'Tu itinerario privado y planificación',
      showSchedule: 'Horario del Show',
      showDesc: 'Programación oficial del evento y actividades'
    }
  };

  const scheduleOptions = [
    {
      id: 'travel',
      icon: Plane,
      title: content[language].travel,
      description: content[language].travelDesc,
      color: 'from-sky-400 to-blue-500',
      route: `/talent/events/${eventId}/travel`
    },
    {
      id: 'personal',
      icon: Calendar,
      title: content[language].personalSchedule,
      description: content[language].personalDesc,
      color: 'from-slate-400 to-slate-600',
      route: `/talent/events/${eventId}/personal`
    },
    {
      id: 'show',
      icon: CalendarDays,
      title: content[language].showSchedule,
      description: content[language].showDesc,
      color: 'from-purple-500 to-pink-500',
      route: `/talent/events/${eventId}/show`
    }
  ];

  if (loading || talentLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (talentError || !talentProfile) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Error: Unable to load talent profile. Please contact support.</div>;
  }

  if (!event) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Event not found</div>;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/talent/events')}
            className="mb-4 p-0 h-auto text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {content[language].backToEvents}
          </Button>
          
          {/* Event Info */}
          <Card className="mb-6 border-2 border-sky-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {event.hero_logo_path && (
                  <img 
                    src={event.hero_logo_path} 
                    alt={event.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h1 className="text-xl font-bold mb-2">{event.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{event.city}, {event.state}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-lg font-semibold mb-4 text-white">{content[language].scheduleOptions}</h2>
        </div>

        {/* Schedule Options */}
        <div className="space-y-4">
          {scheduleOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Card 
                key={option.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(option.route)}
              >
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-r ${option.color} p-1`}>
                    <div className="bg-background/95 p-6 rounded-sm">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${option.color}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">{option.title}</h3>
                          <p className="text-muted-foreground text-sm">{option.description}</p>
                        </div>
                        <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {!isMobile && <Footer language={language} />}
    </div>
  );
};

export default TalentEventSchedule;