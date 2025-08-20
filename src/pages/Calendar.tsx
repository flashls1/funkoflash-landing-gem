import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Upload, Download, Filter, Search, Calendar as CalendarIconView, Grid } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { hasFeature } from '@/lib/features';
import { CalendarLegend } from '@/components/CalendarLegend';
import { CalendarImportDialog } from '@/components/CalendarImportDialog';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

interface CalendarEvent {
  id: string;
  talent_id?: string;
  event_title: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  all_day: boolean;
  status: 'booked' | 'hold' | 'available' | 'tentative' | 'cancelled';
  venue_name?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  notes_public?: string;
  url?: string;
  talent_profiles?: { name: string };
}

interface CalendarFilters {
  status: string[];
  talent: string[];
  dateRange: string;
}

const Calendar = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [view, setView] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [talents, setTalents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({
    status: ['booked', 'hold', 'available', 'tentative', 'cancelled'],
    talent: [],
    dateRange: 'next30'
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [talentSearch, setTalentSearch] = useState('');

  const { user, profile, loading: authLoading } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();
  const { toast } = useToast();

  const content = {
    en: {
      title: 'Calendar',
      subtitle: 'Manage schedules and events',
      monthView: 'Month',
      weekView: 'Week',
      import: 'Import',
      export: 'Export',
      filters: 'Filters',
      status: 'Status',
      talent: 'Talent',
      dateRange: 'Date Range',
      searchTalent: 'Search talent...',
      next7: 'Next 7 days',
      next30: 'Next 30 days',
      next90: 'Next 90 days',
      exportCSV: 'Export CSV',
      exportICS: 'Export ICS',
      noEvents: 'No events found',
      loadingEvents: 'Loading events...',
      eventDetails: 'Event Details',
      venue: 'Venue',
      location: 'Location',
      notes: 'Notes',
      website: 'Website'
    },
    es: {
      title: 'Calendario',
      subtitle: 'Gestiona horarios y eventos',
      monthView: 'Mes',
      weekView: 'Semana',
      import: 'Importar',
      export: 'Exportar',
      filters: 'Filtros',
      status: 'Estado',
      talent: 'Talento',
      dateRange: 'Rango de Fechas',
      searchTalent: 'Buscar talento...',
      next7: 'Próximos 7 días',
      next30: 'Próximos 30 días',
      next90: 'Próximos 90 días',
      exportCSV: 'Exportar CSV',
      exportICS: 'Exportar ICS',
      noEvents: 'No se encontraron eventos',
      loadingEvents: 'Cargando eventos...',
      eventDetails: 'Detalles del Evento',
      venue: 'Lugar',
      location: 'Ubicación',
      notes: 'Notas',
      website: 'Sitio Web'
    }
  };

  const t = content[language];

  useEffect(() => {
    // Check feature flag first
    if (!hasFeature('calendar')) {
      navigate('/');
      return;
    }

    // Wait for auth and permissions to load
    if (authLoading || permissionsLoading) return;

    // Check authentication
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check calendar:view permission
    if (!hasPermission('calendar:view')) {
      navigate('/');
      return;
    }

    // Load initial data
    loadTalents();
    loadEvents();
  }, [user, hasPermission, authLoading, permissionsLoading, navigate]);

  useEffect(() => {
    loadEvents();
  }, [filters, currentDate, view]);

  const loadTalents = async () => {
    try {
      const { data, error } = await supabase
        .from('talent_profiles')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setTalents(data || []);
    } catch (error) {
      console.error('Error loading talents:', error);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      // Calculate date range based on current view and filters
      if (view === 'month') {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      } else {
        startDate = startOfWeek(currentDate);
        endDate = endOfWeek(currentDate);
      }

      // Apply date range filter
      if (filters.dateRange === 'next7') {
        startDate = new Date();
        endDate = addDays(new Date(), 7);
      } else if (filters.dateRange === 'next30') {
        startDate = new Date();
        endDate = addDays(new Date(), 30);
      } else if (filters.dateRange === 'next90') {
        startDate = new Date();
        endDate = addDays(new Date(), 90);
      }

      let query = supabase
        .from('calendar_event')
        .select(`
          *,
          talent_profiles(name)
        `)
        .gte('start_date', format(startDate, 'yyyy-MM-dd'))
        .lte('end_date', format(endDate, 'yyyy-MM-dd'));

      // Apply status filter
      if (filters.status.length > 0 && filters.status.length < 5) {
        query = query.in('status', filters.status);
      }

      // Apply talent filter
      if (filters.talent.length > 0) {
        query = query.in('talent_id', filters.talent);
      }

      const { data, error } = await query.order('start_date');

      if (error) throw error;
      setEvents((data as CalendarEvent[]) || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: 'Error loading events',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'hsl(var(--status-available))';
      case 'hold': return 'hsl(var(--status-hold))';
      case 'tentative': return 'hsl(var(--status-tentative))';
      case 'booked': return 'hsl(var(--status-booked))';
      case 'cancelled': return 'hsl(var(--status-cancelled))';
      default: return 'hsl(var(--muted))';
    }
  };

  const formatEventsForFullCalendar = (events: CalendarEvent[]) => {
    return events.map(event => ({
      id: event.id,
      title: event.event_title,
      start: event.all_day ? event.start_date : `${event.start_date}T${event.start_time || '00:00'}`,
      end: event.all_day ? event.end_date : `${event.end_date}T${event.end_time || '23:59'}`,
      allDay: event.all_day,
      backgroundColor: getStatusColor(event.status),
      borderColor: getStatusColor(event.status),
      extendedProps: event
    }));
  };

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event.extendedProps as CalendarEvent;
    // Show event details in a popup - simplified for now
    toast({
      title: event.event_title,
      description: `${event.talent_profiles?.name || 'No talent assigned'} - ${event.status}`,
    });
  };

  const exportCSV = () => {
    const csvData = events.map(event => ({
      'Event Title': event.event_title,
      'Talent': event.talent_profiles?.name || '',
      'Start Date': event.start_date,
      'End Date': event.end_date,
      'Start Time': event.start_time || '',
      'End Time': event.end_time || '',
      'All Day': event.all_day ? 'Yes' : 'No',
      'Status': event.status,
      'Venue': event.venue_name || '',
      'City': event.location_city || '',
      'State': event.location_state || '',
      'Country': event.location_country || '',
      'Public Notes': event.notes_public || '',
      'URL': event.url || ''
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-events-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportICS = () => {
    const icsEvents = events.map(event => {
      const startDate = event.all_day 
        ? event.start_date.replace(/-/g, '')
        : `${event.start_date.replace(/-/g, '')}T${(event.start_time || '00:00').replace(':', '')}00`;
      
      const endDate = event.all_day 
        ? format(addDays(new Date(event.end_date), 1), 'yyyyMMdd')
        : `${event.end_date.replace(/-/g, '')}T${(event.end_time || '23:59').replace(':', '')}00`;

      const location = [event.venue_name, event.location_city, event.location_state, event.location_country]
        .filter(Boolean).join(', ');

      return [
        'BEGIN:VEVENT',
        `UID:${event.id}`,
        `DTSTART${event.all_day ? ';VALUE=DATE' : ''}:${startDate}`,
        `DTEND${event.all_day ? ';VALUE=DATE' : ''}:${endDate}`,
        `SUMMARY:${event.event_title}`,
        location ? `LOCATION:${location}` : '',
        event.notes_public ? `DESCRIPTION:${event.notes_public}` : '',
        event.url ? `URL:${event.url}` : '',
        'END:VEVENT'
      ].filter(Boolean).join('\r\n');
    }).join('\r\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FunkoFlash//Calendar//EN',
      icsEvents,
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-events-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTalents = talents.filter(talent => 
    talent.name.toLowerCase().includes(talentSearch.toLowerCase())
  );

  // Show loading while checking auth and permissions
  if (authLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading calendar...</p>
        </div>
      </div>
    );
  }

  // Don't render if user doesn't have access
  if (!user || !hasPermission('calendar:view') || !hasFeature('calendar')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setImportDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {t.import}
              </Button>
              
              <Select onValueChange={(value) => value === 'csv' ? exportCSV() : exportICS()}>
                <SelectTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    {t.export}
                  </Button>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">{t.exportCSV}</SelectItem>
                  <SelectItem value="ics">{t.exportICS}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t.filters}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t.status}</label>
                  <div className="space-y-2">
                    {['booked', 'hold', 'available', 'tentative', 'cancelled'].map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={status}
                          checked={filters.status.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters(prev => ({ ...prev, status: [...prev.status, status] }));
                            } else {
                              setFilters(prev => ({ ...prev, status: prev.status.filter(s => s !== status) }));
                            }
                          }}
                        />
                        <label htmlFor={status} className="capitalize text-sm">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Talent Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t.talent}</label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t.searchTalent}
                        value={talentSearch}
                        onChange={(e) => setTalentSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {filteredTalents.map(talent => (
                        <div key={talent.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={talent.id}
                            checked={filters.talent.includes(talent.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters(prev => ({ ...prev, talent: [...prev.talent, talent.id] }));
                              } else {
                                setFilters(prev => ({ ...prev, talent: prev.talent.filter(t => t !== talent.id) }));
                              }
                            }}
                          />
                          <label htmlFor={talent.id} className="text-sm">
                            {talent.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t.dateRange}</label>
                  <Select value={filters.dateRange} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, dateRange: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="next7">{t.next7}</SelectItem>
                      <SelectItem value="next30">{t.next30}</SelectItem>
                      <SelectItem value="next90">{t.next90}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View Toggle */}
          <div className="flex items-center justify-between mb-4">
            <Tabs value={view} onValueChange={(value: any) => setView(value)}>
              <TabsList>
                <TabsTrigger value="month" className="flex items-center gap-2">
                  <Grid className="h-4 w-4" />
                  {t.monthView}
                </TabsTrigger>
                <TabsTrigger value="week" className="flex items-center gap-2">
                  <CalendarIconView className="h-4 w-4" />
                  {t.weekView}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <CalendarLegend language={language} />
          </div>
        </div>

        {/* Calendar View */}
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>{t.loadingEvents}</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p>{t.noEvents}</p>
              </div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin]}
                initialView={view === 'month' ? 'dayGridMonth' : 'timeGridWeek'}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: view === 'month' ? 'dayGridMonth' : 'timeGridWeek'
                }}
                events={formatEventsForFullCalendar(events)}
                eventClick={handleEventClick}
                height="auto"
                eventDisplay="block"
                dayMaxEvents={3}
                weekends={true}
                editable={false}
                selectable={false}
                selectMirror={false}
                dayHeaders={true}
                allDaySlot={true}
                slotDuration="01:00:00"
                slotLabelInterval="01:00:00"
                locale={language}
                datesSet={(dateInfo) => {
                  setCurrentDate(dateInfo.start);
                }}
              />
            )}
          </CardContent>
        </Card>
      </main>

      <Footer language={language} />

      {/* Import Dialog */}
      <CalendarImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        language={language}
        onImportComplete={() => {
          loadEvents();
          setImportDialogOpen(false);
        }}
      />
    </div>
  );
};

export default Calendar;