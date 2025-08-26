import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CalendarStatusBadge } from './CalendarStatusBadge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface CalendarEvent {
  id: string;
  event_title: string;
  start_date: string;
  end_date: string;
  status: 'available' | 'hold' | 'tentative' | 'booked' | 'cancelled' | 'not_available';
  talent_id?: string;
  talent_profiles?: {
    name: string;
  };
}

interface CalendarWidgetProps {
  language: 'en' | 'es';
}

export const CalendarWidget = ({ language }: CalendarWidgetProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date());
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const content = {
    en: {
      calendar: 'Calendar Overview',
      addEvent: 'Add Event',
      viewFull: 'View Full Calendar',
      noEvents: 'No events this month',
      loadingEvents: 'Loading events...',
      today: 'Today',
      thisMonth: 'This Month'
    },
    es: {
      calendar: 'Vista del Calendario',
      addEvent: 'Agregar Evento',
      viewFull: 'Ver Calendario Completo',
      noEvents: 'No hay eventos este mes',
      loadingEvents: 'Cargando eventos...',
      today: 'Hoy',
      thisMonth: 'Este Mes'
    }
  };

  const t = content[language];

  useEffect(() => {
    if (!user || !profile) return;
    loadEvents();
  }, [user, profile]);

  const loadEvents = async () => {
    if (!user || !profile) return;
    
    setLoading(true);
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);

      let query = supabase
        .from('calendar_event')
        .select(`
          id,
          event_title,
          start_date,
          end_date,
          status,
          talent_id,
          talent_profiles(name)
        `)
        .gte('start_date', format(startDate, 'yyyy-MM-dd'))
        .lte('end_date', format(endDate, 'yyyy-MM-dd'));

      // Apply role-based filtering similar to main calendar
      if (profile.role === 'talent') {
        // For talent, get their talent profile and show their events + unassigned
        const { data: talentProfiles } = await supabase
          .from('talent_profiles')
          .select('id')
          .eq('user_id', user.id)
          .eq('active', true);
        
        if (talentProfiles && talentProfiles.length > 0) {
          const talentIds = talentProfiles.map(tp => tp.id);
          const talentFilter = talentIds.map(id => `talent_id.eq.${id}`).join(',');
          query = query.or(`${talentFilter},talent_id.is.null`);
        } else {
          // If no talent profile, only show unassigned events
          query = query.is('talent_id', null);
        }
      } else if (profile.role === 'admin' || profile.role === 'staff') {
        // Admin/Staff see all events (no additional filter needed)
      } else if (profile.role === 'business') {
        // Business users see unassigned events (limited view)
        query = query.is('talent_id', null);
      }

      const { data, error } = await query
        .order('start_date')
        .limit(10); // Limit for widget display

      if (error) {
        console.error('Error loading calendar events:', error);
      } else {
        setEvents((data || []).map(event => ({
          ...event,
          status: event.status as 'available' | 'hold' | 'tentative' | 'booked' | 'cancelled' | 'not_available'
        })));
      }
    } catch (err) {
      console.error('Error in loadEvents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    navigate('/calendar?action=add');
  };

  const handleViewFull = () => {
    navigate('/calendar');
  };

  // Get today's events
  const todayEvents = events.filter(event => 
    isSameDay(new Date(event.start_date), new Date())
  );

  // Get this month's events (excluding today)
  const monthEvents = events.filter(event => 
    !isSameDay(new Date(event.start_date), new Date())
  ).slice(0, 5); // Show max 5 upcoming events

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t.calendar}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddEvent}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              {t.addEvent}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewFull}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              {t.viewFull}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            {t.loadingEvents}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t.noEvents}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Today's Events */}
            {todayEvents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-primary">{t.today}</h4>
                <div className="space-y-2">
                  {todayEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-2 rounded border bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {event.event_title}
                        </p>
                        {event.talent_profiles?.name && (
                          <p className="text-xs text-muted-foreground">
                            {event.talent_profiles.name}
                          </p>
                        )}
                      </div>
                      <CalendarStatusBadge status={event.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* This Month's Upcoming Events */}
            {monthEvents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">{t.thisMonth}</h4>
                <div className="space-y-2">
                  {monthEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {event.event_title}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.start_date), 'MMM d')}
                          </p>
                          {event.talent_profiles?.name && (
                            <p className="text-xs text-muted-foreground">
                              • {event.talent_profiles.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <CalendarStatusBadge status={event.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};