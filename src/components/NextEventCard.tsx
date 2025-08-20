import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ExternalLink, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

interface NextEventCardProps {
  talentId?: string;
  language: 'en' | 'es';
  canEdit?: boolean;
}

interface UpcomingEvent {
  id: string;
  event_title: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  status: string;
  venue_name?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  url?: string;
}

export const NextEventCard = ({ talentId, language, canEdit = false }: NextEventCardProps) => {
  const [nextEvent, setNextEvent] = useState<UpcomingEvent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const t = {
    en: {
      title: "Next Event",
      miniAgenda: "Upcoming Events",
      none: "No upcoming events",
      openCalendar: "Open in Calendar",
      addEvent: "Add Event",
      contactManager: "Contact your manager",
      location: "Location",
      allDay: "All day",
      at: "at"
    },
    es: {
      title: "Próximo Evento",
      miniAgenda: "Eventos Próximos", 
      none: "No hay eventos próximos",
      openCalendar: "Abrir en Calendario",
      addEvent: "Agregar Evento",
      contactManager: "Contacta a tu manager",
      location: "Ubicación",
      allDay: "Todo el día",
      at: "a las"
    }
  };

  const content = t[language];

  useEffect(() => {
    if (talentId) {
      fetchUpcomingEvents();
    }
  }, [talentId]);

  const fetchUpcomingEvents = async () => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      let query = supabase
        .from('calendar_event')
        .select('*')
        .gte('start_date', now.split('T')[0])
        .order('start_date', { ascending: true })
        .limit(5);

      if (talentId) {
        query = query.eq('talent_id', talentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const events = data || [];
      setUpcomingEvents(events);
      setNextEvent(events.length > 0 ? events[0] : null);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      booked: 'bg-red-500',
      hold: 'bg-yellow-500',
      available: 'bg-green-500',
      tentative: 'bg-blue-500',
      cancelled: 'bg-gray-500',
      not_available: 'bg-purple-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      en: {
        booked: 'Booked',
        hold: 'Hold',
        available: 'Available',
        tentative: 'Tentative',
        cancelled: 'Cancelled',
        not_available: 'Not Available'
      },
      es: {
        booked: 'Reservado',
        hold: 'En Espera',
        available: 'Disponible',
        tentative: 'Tentativo',
        cancelled: 'Cancelado',
        not_available: 'No Disponible'
      }
    };
    return labels[language][status as keyof typeof labels[typeof language]] || status;
  };

  const formatEventDate = (event: UpcomingEvent) => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const locale = language === 'es' ? es : undefined;

    if (event.all_day) {
      if (event.start_date === event.end_date) {
        return format(startDate, 'PPP', { locale });
      } else {
        return `${format(startDate, 'PP', { locale })} - ${format(endDate, 'PP', { locale })}`;
      }
    } else {
      return `${format(startDate, 'PPP', { locale })} ${content.at} ${format(startDate, 'p', { locale })}`;
    }
  };

  const getLocationString = (event: UpcomingEvent) => {
    const parts = [
      event.venue_name,
      event.location_city,
      event.location_state,
      event.location_country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleOpenCalendar = () => {
    if (nextEvent) {
      const eventDate = new Date(nextEvent.start_date);
      const dateParam = format(eventDate, 'yyyy-MM-dd');
      navigate(`/calendar?date=${dateParam}&talent=${talentId}`);
    } else {
      navigate('/calendar');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {content.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!nextEvent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {content.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">{content.none}</p>
          {canEdit ? (
            <Button onClick={() => navigate('/calendar')} className="gap-2">
              <Plus className="h-4 w-4" />
              {content.addEvent}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">{content.contactManager}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Next Event Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {content.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">{nextEvent.event_title}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-white ${getStatusColor(nextEvent.status)}`}>
                {getStatusLabel(nextEvent.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatEventDate(nextEvent)}
              </span>
            </div>
            
            {getLocationString(nextEvent) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {getLocationString(nextEvent)}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleOpenCalendar} className="gap-2">
              <Calendar className="h-4 w-4" />
              {content.openCalendar}
            </Button>
            
            {nextEvent.url && (
              <Button 
                variant="outline" 
                onClick={() => window.open(nextEvent.url, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {language === 'en' ? 'Details' : 'Detalles'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mini Agenda */}
      {upcomingEvents.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{content.miniAgenda}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.slice(1, 4).map((event) => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{event.event_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.start_date), language === 'es' ? 'PP' : 'PP', { locale: language === 'es' ? es : undefined })}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs text-white ${getStatusColor(event.status)}`}
                  >
                    {getStatusLabel(event.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};