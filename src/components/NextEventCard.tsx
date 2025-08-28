import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Plus, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface NextEventProps {
  language: 'en' | 'es';
}

interface CalendarEvent {
  id: string;
  event_title: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  all_day: boolean;
  status: 'booked' | 'hold' | 'available' | 'tentative' | 'cancelled' | 'not_available';
  venue_name?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  talent_profiles?: { name: string };
}

export const NextEventCard = ({ language }: NextEventProps) => {
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { hasPermission } = usePermissions();
  const { currentTheme } = useColorTheme();
  const navigate = useNavigate();

  const content = {
    en: {
      title: 'Next Event',
      none: 'No upcoming events',
      add: 'Add event',
      contactManager: 'Contact your manager',
      openCalendar: 'Open in Calendar'
    },
    es: {
      title: 'Próximo evento',
      none: 'No hay eventos próximos',
      add: 'Agregar evento',
      contactManager: 'Contacta a tu mánager',
      openCalendar: 'Abrir en Calendario'
    }
  };

  const t = content[language];

  useEffect(() => {
    loadNextEvent();
  }, [user]);

  const loadNextEvent = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get user's profile to check role
      const { data: fullProfile } = await supabase
        .from('profiles')
        .select('role, business_name, first_name, last_name, email')
        .eq('user_id', user.id)
        .single();

      if (fullProfile?.role === 'business') {
        const now = new Date().toISOString();
        
        console.log('NextEventCard: Loading events for business user');
        
        // Use the new secure view that automatically applies RLS filtering
        const { data: businessCalendarEvents, error: calendarError } = await supabase
          .from('v_business_calendar_events')
          .select('*')
          .gte('start_at', now)
          .order('start_at', { ascending: true })
          .limit(1);
        
        console.log('NextEventCard: Business calendar events:', businessCalendarEvents);
        
        if (calendarError) {
          console.error('Error fetching calendar events:', calendarError);
          setNextEvent(null);
          return;
        }
        
        // Use the first calendar event as the next event
        const nextCalendarEvent = businessCalendarEvents?.[0] || null;

        // Convert the view data to our CalendarEvent format
        if (nextCalendarEvent) {
          const convertedEvent: CalendarEvent = {
            id: nextCalendarEvent.id,
            event_title: nextCalendarEvent.title,
            start_date: nextCalendarEvent.start_at ? nextCalendarEvent.start_at.split('T')[0] : '',
            end_date: nextCalendarEvent.end_at ? nextCalendarEvent.end_at.split('T')[0] : '',
            start_time: nextCalendarEvent.start_at ? nextCalendarEvent.start_at.split('T')[1]?.split('.')[0] : null,
            end_time: nextCalendarEvent.end_at ? nextCalendarEvent.end_at.split('T')[1]?.split('.')[0] : null,
            all_day: !nextCalendarEvent.start_at?.includes('T'),
            status: nextCalendarEvent.status as 'booked' | 'hold' | 'available' | 'tentative' | 'cancelled' | 'not_available',
            venue_name: nextCalendarEvent.venue,
            location_city: nextCalendarEvent.city,
            location_state: null,
            location_country: nextCalendarEvent.country,
            talent_profiles: null
          };
          setNextEvent(convertedEvent);
        } else {
          setNextEvent(null);
        }
        return;
      }
      
      // For talent users, use the secure talent calendar view
      const { data: talentEvents, error: talentError } = await supabase
        .from('v_talent_calendar_events')
        .select('*')
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(1);

      if (talentError) {
        console.error('Error fetching talent events:', talentError);
        setNextEvent(null);
        return;
      }

      const nextTalentEvent = talentEvents?.[0] || null;

      if (nextTalentEvent) {
        const convertedEvent: CalendarEvent = {
          id: nextTalentEvent.id,
          event_title: nextTalentEvent.title,
          start_date: nextTalentEvent.start_at ? nextTalentEvent.start_at.split('T')[0] : '',
          end_date: nextTalentEvent.end_at ? nextTalentEvent.end_at.split('T')[0] : '',
          start_time: nextTalentEvent.start_at ? nextTalentEvent.start_at.split('T')[1]?.split('.')[0] : null,
          end_time: nextTalentEvent.end_at ? nextTalentEvent.end_at.split('T')[1]?.split('.')[0] : null,
          all_day: !nextTalentEvent.start_at?.includes('T'),
          status: nextTalentEvent.status as 'booked' | 'hold' | 'available' | 'tentative' | 'cancelled' | 'not_available',
          venue_name: nextTalentEvent.venue,
          location_city: nextTalentEvent.city,
          location_state: null,
          location_country: nextTalentEvent.country,
          talent_profiles: null
        };
        setNextEvent(convertedEvent);
      } else {
        setNextEvent(null);
      }
    } catch (error) {
      console.error('Error loading next event:', error);
      setNextEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'tentative': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'booked': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'not_available': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (startDate: string, endDate: string, allDay: boolean, startTime?: string, endTime?: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const locale = language === 'es' ? es : undefined;

    if (allDay) {
      if (startDate === endDate) {
        return format(start, 'PPP', { locale });
      } else {
        return `${format(start, 'MMM d', { locale })} - ${format(end, 'PPP', { locale })}`;
      }
    } else {
      const startDateTime = `${startDate}T${startTime || '00:00'}`;
      const endDateTime = `${endDate}T${endTime || '23:59'}`;
      const startISO = parseISO(startDateTime);
      const endISO = parseISO(endDateTime);
      
      if (startDate === endDate) {
        return `${format(startISO, 'PPP', { locale })} ${format(startISO, 'p', { locale })} - ${format(endISO, 'p', { locale })}`;
      } else {
        return `${format(startISO, 'PPp', { locale })} - ${format(endISO, 'PPp', { locale })}`;
      }
    }
  };

  const formatLocation = (event: CalendarEvent) => {
    const parts = [event.venue_name, event.location_city, event.location_state, event.location_country]
      .filter(Boolean);
    return parts.join(', ');
  };

  const handleOpenCalendar = () => {
    if (nextEvent) {
      // Deep-link to calendar focused on the event's date
      const date = new Date(nextEvent.start_date);
      navigate(`/calendar?date=${date.toISOString().split('T')[0]}`);
    }
  };

  const handleAddEvent = () => {
    navigate('/calendar?action=add');
  };

  if (loading) {
    return (
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
            <Calendar className="h-5 w-5" style={{ color: currentTheme.accent }} />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
          <Calendar className="h-5 w-5" style={{ color: currentTheme.accent }} />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {nextEvent ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{nextEvent.event_title}</h3>
              <p className="text-muted-foreground">
                {formatDate(
                  nextEvent.start_date, 
                  nextEvent.end_date, 
                  nextEvent.all_day, 
                  nextEvent.start_time, 
                  nextEvent.end_time
                )}
              </p>
              {formatLocation(nextEvent) && (
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {formatLocation(nextEvent)}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(nextEvent.status)}>
                {nextEvent.status.replace('_', ' ')}
              </Badge>
              
              <Button 
                variant="business" 
                size="sm"
                onClick={handleOpenCalendar}
              >
                {t.openCalendar}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">{t.none}</p>
            
            {hasPermission('calendar:edit_own') && profile?.role !== 'business' ? (
              <Button 
                variant="business" 
                size="sm"
                onClick={handleAddEvent}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t.add}
              </Button>
            ) : (
              <Button 
                variant="business" 
                size="sm"
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {t.contactManager}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};