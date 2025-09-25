import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { EventScheduleTimeline } from '@/components/EventScheduleTimeline';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { formatDateUS } from '@/lib/utils';

const TalentEventPersonalSchedule = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isMobile = useIsMobile();
  const [event, setEvent] = useState<any>(null);
  const [personalSchedules, setPersonalSchedules] = useState<any[]>([]);
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

      // Fetch personal schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from('talent_personal_schedules')
        .select('*')
        .eq('talent_id', profile.id)
        .eq('event_id', eventId)
        .order('schedule_date', { ascending: true });

      if (schedulesError) throw schedulesError;

      setPersonalSchedules(schedules || []);

      // Generate available dates (event dates + buffer days)
      const dates = generateAvailableDates(businessEvent);
      setAvailableDates(dates);
      
      // Set current date to first available or today
      if (dates.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const startDate = dates.includes(today) ? today : dates[0];
        setCurrentDate(startDate);
      }
    } catch (error) {
      console.error('Error fetching personal schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableDates = (event: any) => {
    if (!event.start_ts) return [];
    
    const dates = [];
    const start = new Date(event.start_ts);
    const end = event.end_ts ? new Date(event.end_ts) : start;
    
    // Add 2 days before event
    for (let i = 2; i >= 1; i--) {
      const date = new Date(start);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Add event days
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    // Add 2 days after event
    for (let i = 1; i <= 2; i++) {
      const date = new Date(end);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const getCurrentDateSchedule = () => {
    if (!currentDate) return [];
    
    return personalSchedules
      .filter(schedule => schedule.schedule_date === currentDate)
      .map(schedule => ({
        time: schedule.time_start.slice(0, 5), // Convert "HH:MM:SS" to "HH:MM"
        title: schedule.title,
        notes: schedule.description
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentIndex = availableDates.indexOf(currentDate);
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentDate(availableDates[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < availableDates.length - 1) {
      setCurrentDate(availableDates[currentIndex + 1]);
    }
  };

  const content = {
    en: {
      backToSchedule: '← Back to Schedule',
      personalSchedule: 'Personal Schedule',
      noScheduleItems: 'No personal schedule items for this day',
      addItem: 'Add Item',
      today: 'Today',
      private: 'Private',
      personalScheduleDesc: 'Your private itinerary and planning'
    },
    es: {
      backToSchedule: '← Volver al Horario',
      personalSchedule: 'Horario Personal',
      noScheduleItems: 'No hay elementos de horario personal para este día',
      addItem: 'Agregar Elemento',
      today: 'Hoy',
      private: 'Privado',
      personalScheduleDesc: 'Tu itinerario privado y planificación'
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
            <div className="p-2 rounded-lg bg-gradient-to-r from-slate-400 to-slate-600">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">{content[language].personalSchedule}</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{content[language].personalScheduleDesc}</p>
          
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
                <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <span>{content[language].private}</span>
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

        {/* Schedule Timeline */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {new Date(currentDate).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {content[language].addItem}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <EventScheduleTimeline 
              schedule={currentDateSchedule}
              language={language}
            />
          </CardContent>
        </Card>
      </div>

      {!isMobile && <Footer language={language} />}
    </div>
  );
};

export default TalentEventPersonalSchedule;