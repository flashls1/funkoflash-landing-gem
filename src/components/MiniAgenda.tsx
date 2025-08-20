import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface MiniAgendaProps {
  language: 'en' | 'es';
}

interface CalendarEvent {
  id: string;
  event_title: string;
  start_date: string;
  start_time?: string;
  all_day: boolean;
  status: 'booked' | 'hold' | 'available' | 'tentative' | 'cancelled' | 'not_available';
}

export const MiniAgenda = ({ language }: MiniAgendaProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const content = {
    en: {
      title: 'Agenda'
    },
    es: {
      title: 'Agenda'
    }
  };

  const t = content[language];

  useEffect(() => {
    loadMiniAgenda();
  }, [user]);

  const loadMiniAgenda = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get user's talent profile
      const { data: talentProfile } = await supabase
        .from('talent_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!talentProfile) {
        setEvents([]);
        return;
      }

      // Get next 5 upcoming events for this talent
      const now = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('calendar_event')
        .select('id, event_title, start_date, start_time, all_day, status')
        .eq('talent_id', talentProfile.id)
        .gte('start_date', now)
        .order('start_date', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(5);

      if (error) throw error;

      setEvents((data as CalendarEvent[]) || []);
    } catch (error) {
      console.error('Error loading mini agenda:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'hold': return 'bg-yellow-100 text-yellow-800';
      case 'tentative': return 'bg-orange-100 text-orange-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'not_available': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatShortDate = (startDate: string, allDay: boolean, startTime?: string) => {
    const date = parseISO(startDate);
    const locale = language === 'es' ? es : undefined;

    if (allDay) {
      return format(date, 'MMM d', { locale });
    } else {
      const dateTime = `${startDate}T${startTime || '00:00'}`;
      const dateTimeObj = parseISO(dateTime);
      return `${format(date, 'MMM d', { locale })} ${format(dateTimeObj, 'p', { locale })}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-4 w-4" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 bg-muted rounded w-16"></div>
                <div className="h-4 bg-muted rounded flex-1"></div>
                <div className="h-6 bg-muted rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return null; // Don't show empty agenda if there are no events
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarIcon className="h-4 w-4" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="flex items-center gap-3 text-sm">
              <div className="text-muted-foreground font-medium min-w-0 flex-shrink-0">
                {formatShortDate(event.start_date, event.all_day, event.start_time)}
              </div>
              <div className="truncate flex-1 font-medium">
                {event.event_title}
              </div>
              <Badge className={`${getStatusColor(event.status)} text-xs px-2 py-0.5`}>
                {event.status.replace('_', ' ')}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};