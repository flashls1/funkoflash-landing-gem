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
      
      // Get user's profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, business_name, first_name, last_name, email')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setEvents([]);
        return;
      }

      let events: CalendarEvent[] = [];
      const now = new Date().toISOString().split('T')[0];

      // For business users, get business events
      if (profile.role === 'business') {
        // Get business account for this user
        const businessName = profile.business_name || (profile.first_name + ' ' + (profile.last_name || ''));
        
        let businessAccount = null;
        
        // Try by name first
        if (businessName.trim()) {
          const { data: accountByName } = await supabase
            .from('business_account')
            .select('id')
            .eq('name', businessName)
            .maybeSingle();
          businessAccount = accountByName;
        }
        
        // If not found by name, try by email
        if (!businessAccount && profile.email) {
          const { data: accountByEmail } = await supabase
            .from('business_account')
            .select('id')
            .eq('contact_email', profile.email)
            .maybeSingle();
          businessAccount = accountByEmail;
        }
        
        if (businessAccount) {
          // Get event IDs from business_event_account table
          const { data: eventIds } = await supabase
            .from('business_event_account')
            .select('event_id')
            .eq('business_account_id', businessAccount.id);
            
          if (eventIds && eventIds.length > 0) {
            const { data: businessEvents } = await supabase
              .from('business_events')
              .select('*')
              .in('id', eventIds.map(item => item.event_id))
              .gte('start_ts', now + 'T00:00:00.000Z')
              .order('start_ts', { ascending: true })
              .limit(5);
              
            // Convert business events to calendar event format
            events = (businessEvents || []).map(be => ({
              id: be.id,
              event_title: be.title || 'Business Event',
              start_date: be.start_ts ? be.start_ts.split('T')[0] : now,
              start_time: be.start_ts ? be.start_ts.split('T')[1]?.split('.')[0] : undefined,
              all_day: !be.start_ts?.includes('T'),
              status: (be.status === 'published' ? 'booked' : 'tentative') as CalendarEvent['status']
            }));
          }
        }
      } else {
        // For talent users, get calendar events
        const { data: talentProfile } = await supabase
          .from('talent_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (talentProfile) {
          const { data, error } = await supabase
            .from('calendar_event')
            .select('id, event_title, start_date, start_time, all_day, status')
            .eq('talent_id', talentProfile.id)
            .gte('start_date', now)
            .order('start_date', { ascending: true })
            .order('created_at', { ascending: true })
            .limit(5);

           if (!error) {
             events = (data || []) as CalendarEvent[];
           }
        }
      }

      setEvents(events);
    } catch (error) {
      console.error('Error loading mini agenda:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-status-available text-white';
      case 'hold': return 'bg-status-hold text-white';
      case 'tentative': return 'bg-status-tentative text-black';
      case 'booked': return 'bg-status-booked text-white';
      case 'cancelled': return 'bg-status-cancelled text-white';
      case 'not_available': return 'bg-status-not-available text-white';
      default: return 'bg-muted text-muted-foreground';
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