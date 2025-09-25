import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  CalendarDays, 
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';
import { formatDateUS } from '@/lib/utils';

interface ScheduleEntry {
  id: string;
  time_start: string;
  time_end: string;
  title: string;
  details?: string;
  category: {
    name: string;
    color: string;
    icon: string;
  };
}

const TalentEventShowSchedule = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isMobile = useIsMobile();
  const [event, setEvent] = useState<any>(null);
  const [showSchedules, setShowSchedules] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile || profile.role !== 'talent') {
      navigate('/auth');
      return;
    }
    if (eventId) {
      fetchEventAndSchedules();
    }
  }, [user, profile, eventId, navigate]);

  const fetchEventAndSchedules = async () => {
    if (!eventId || !profile) return;

    try {
      setLoading(true);
      
      // Fetch event details
      const { data: businessEvent, error: eventError } = await supabase
        .from('business_events')
        .select(`
          *,
          business_event_talent!inner(talent_id)
        `)
        .eq('id', eventId)
        .eq('business_event_talent.talent_id', profile.id)
        .single();

      if (eventError) throw eventError;
      setEvent(businessEvent);

      // Fetch show schedule entries
      const { data: schedules, error: schedulesError } = await supabase
        .from('show_schedule_entries')
        .select(`
          *,
          schedule_categories (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('event_id', eventId)
        .eq('active', true)
        .order('day_date', { ascending: true })
        .order('time_start', { ascending: true });

      if (schedulesError) throw schedulesError;

      setShowSchedules(schedules || []);

      // Generate available dates from schedule entries or event dates
      const dates = generateAvailableDates(businessEvent, schedules || []);
      setAvailableDates(dates);
      
      // Set current date to first available or today
      if (dates.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const startDate = dates.includes(today) ? today : dates[0];
        setCurrentDate(startDate);
      }
    } catch (error) {
      console.error('Error fetching show schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableDates = (event: any, schedules: any[]) => {
    // Get dates from schedule entries
    const scheduleDates = [...new Set(schedules.map(s => s.day_date))].sort();
    
    if (scheduleDates.length > 0) {
      return scheduleDates;
    }
    
    // Fallback to event dates
    if (!event.start_ts) return [];
    
    const dates = [];
    const start = new Date(event.start_ts);
    const end = event.end_ts ? new Date(event.end_ts) : start;
    
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const getCurrentDateSchedule = (): ScheduleEntry[] => {
    if (!currentDate) return [];
    
    return showSchedules
      .filter(schedule => schedule.day_date === currentDate)
      .map(schedule => ({
        id: schedule.id,
        time_start: schedule.time_start,
        time_end: schedule.time_end,
        title: schedule.title,
        details: schedule.details,
        category: schedule.schedule_categories || {
          name: 'General',
          color: 'hsl(216, 12%, 42%)',
          icon: '📌'
        }
      }));
  };

  const getCurrentDateLabel = () => {
    const currentSchedule = showSchedules.find(s => s.day_date === currentDate);
    return currentSchedule?.day_label || new Date(currentDate).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentIndex = availableDates.indexOf(currentDate);
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentDate(availableDates[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < availableDates.length - 1) {
      setCurrentDate(availableDates[currentIndex + 1]);
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Convert "HH:MM:SS" to "HH:MM"
  };

  const content = {
    en: {
      backToSchedule: '← Back to Schedule',
      showSchedule: 'Show Schedule',
      noScheduleItems: 'No programming scheduled for this day',
      officialProgramming: 'Official event programming & activities'
    },
    es: {
      backToSchedule: '← Volver al Horario',
      showSchedule: 'Horario del Show',
      noScheduleItems: 'No hay programación programada para este día',
      officialProgramming: 'Programación oficial del evento y actividades'
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  const currentDateSchedule = getCurrentDateSchedule();
  const currentIndex = availableDates.indexOf(currentDate);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < availableDates.length - 1;

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/talent/events/${eventId}/schedule`)}
            className="mb-4 p-0 h-auto text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {content[language].backToSchedule}
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">{content[language].showSchedule}</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{content[language].officialProgramming}</p>
          
          {event && (
            <p className="text-muted-foreground">{event.title}</p>
          )}
        </div>

        {/* Date Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigateDate('prev')}
                disabled={!canGoPrev}
                className="p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center">
                <div className="font-semibold">{formatDateUS(currentDate)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getCurrentDateLabel()}
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigateDate('next')}
                disabled={!canGoNext}
                className="p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Entries */}
        {currentDateSchedule.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">{content[language].noScheduleItems}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentDateSchedule.map((entry) => (
              <Card 
                key={entry.id} 
                className="overflow-hidden hover:shadow-md transition-shadow"
                style={{ borderLeftColor: entry.category.color, borderLeftWidth: '4px' }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Time Block */}
                    <div className="flex-shrink-0 text-center min-w-[80px]">
                      <div className="font-bold text-lg leading-tight">
                        {formatTime(entry.time_start)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(entry.time_end)}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold leading-tight">{entry.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-lg">{entry.category.icon}</span>
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: entry.category.color + '20',
                              color: entry.category.color,
                              borderColor: entry.category.color + '40'
                            }}
                          >
                            {entry.category.name}
                          </Badge>
                        </div>
                      </div>
                      
                      {entry.details && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {entry.details}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {!isMobile && <Footer language={language} />}
    </div>
  );
};

export default TalentEventShowSchedule;