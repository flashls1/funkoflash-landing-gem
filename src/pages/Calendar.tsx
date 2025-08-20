import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Upload, Download, Filter, Search, Calendar as CalendarIconView, Grid, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { hasFeature, FEATURES } from '@/lib/features';
import { AdminThemeProvider } from '@/components/AdminThemeProvider';
import { ComingSoon } from '@/components/ui/ComingSoon';
import { safeLocale } from '@/utils/locale';
import ErrorBoundary from '@/components/ErrorBoundary';
import { CalendarLegend } from '@/components/CalendarLegend';
import { CalendarImportDialog } from '@/components/CalendarImportDialog';
import { CalendarEventForm } from '@/components/CalendarEventForm';
import { TalentSwitcher } from '@/components/TalentSwitcher';
import { YearSelector } from '@/components/YearSelector';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, startOfYear, endOfYear } from 'date-fns';
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
  status: 'booked' | 'hold' | 'available' | 'tentative' | 'cancelled' | 'not_available';
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
  hideNotAvailable: boolean;
}

const Calendar = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [view, setView] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [talents, setTalents] = useState<{ id: string; name: string }[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>({
    status: ['booked', 'hold', 'available', 'tentative', 'cancelled', 'not_available'],
    talent: [],
    dateRange: 'next30',
    hideNotAvailable: false
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear();
  });
  const [talentSearch, setTalentSearch] = useState('');
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

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
      website: 'Website',
      talentSelector: 'Select Talent',
      allTalents: 'All Talents',
      hideNotAvailable: 'Hide Not Available',
      addEvent: 'Add Event',
      blockDay: 'Block this day as Not Available',
      blockWeekend: 'Block this weekend as Not Available',
      blockRange: 'Block date range...'
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
      website: 'Sitio Web',
      talentSelector: 'Seleccionar Talento',
      allTalents: 'Todos los Talentos',
      hideNotAvailable: 'Ocultar No disponible',
      addEvent: 'Agregar Evento',
      blockDay: 'Bloquear este día como No disponible',
      blockWeekend: 'Bloquear este fin de semana como No disponible',
      blockRange: 'Bloquear rango de fechas...'
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

    // Load initial data only once
    loadTalents();
  }, [hasFeature, navigate, authLoading, permissionsLoading, user, hasPermission]);

  const loadEvents = useCallback(async () => {
    // Prevent loading if not ready
    if (!user || !hasPermission('calendar:view') || authLoading || permissionsLoading) {
      return;
    }

    setLoading(true);
    try {
      // For edit_own users, we need at least one talent to be loaded
      if (hasPermission('calendar:edit_own') && !hasPermission('calendar:edit') && talents.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }
      let startDate: Date;
      let endDate: Date;

      // Calculate date range based on selected year and current view
      if (filters.dateRange === 'year') {
        startDate = startOfYear(new Date(selectedYear, 0, 1));
        endDate = endOfYear(new Date(selectedYear, 11, 31));
      } else if (view === 'month') {
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
      if (filters.status.length > 0 && filters.status.length < 6) {
        query = query.in('status', filters.status);
      }

      // Apply hide not available filter
      if (filters.hideNotAvailable) {
        query = query.neq('status', 'not_available');
      }

        // Apply talent filter (Admin/Staff can filter by specific talent, Talent/Business limited to own)
        if (hasPermission('calendar:edit')) {
          // Admin/Staff: apply selected talent filter if one is selected
          if (selectedTalent) {
            query = query.eq('talent_id', selectedTalent);
          }
          if (filters.talent.length > 0) {
            query = query.in('talent_id', filters.talent);
          }
      } else if (hasPermission('calendar:edit_own')) {
        // Talent/Business: only show their own events
        // Get talents owned by current user and filter to those
        const userTalentsQuery = await supabase
          .from('talent_profiles')
          .select('id')
          .eq('user_id', user.id)
          .eq('active', true);
        
        if (userTalentsQuery.data && userTalentsQuery.data.length > 0) {
          const userTalentIds = userTalentsQuery.data.map(t => t.id);
          query = query.in('talent_id', userTalentIds);
        } else {
          // User has no talents, show no events
          setEvents([]);
          setLoading(false);
          return;
        }
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
  }, [
    user?.id,
    authLoading,
    permissionsLoading,
    talents.length,
    filters.dateRange,
    filters.status,
    filters.hideNotAvailable,
    filters.talent.join(','), // Convert array to string for comparison
    selectedYear,
    view,
    currentDate.getTime(),
    selectedTalent,
    toast
  ]);

  // Separate effect for events loading with proper dependencies
  useEffect(() => {
    // Only load events if we have basic setup ready
    if (user && hasPermission('calendar:view') && !authLoading && !permissionsLoading) {
      // Add small delay to prevent rapid calls during initialization
      const timer = setTimeout(() => {
        loadEvents();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    loadEvents, // Now using the memoized function
    user?.id,
    authLoading,
    permissionsLoading,
    hasPermission('calendar:view')
  ]);

  const loadTalents = async () => {
    try {
      const { data, error } = await supabase
        .from('talent_profiles')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      const talentData = data || [];
      setTalents(talentData);
      
      // Auto-select first talent if none selected and user has edit permissions
      if (!selectedTalent && talentData.length > 0 && hasPermission('calendar:edit')) {
        setSelectedTalent(talentData[0].id);
      }
    } catch (error) {
      console.error('Error loading talents:', error);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'hsl(var(--status-available))';
      case 'hold': return 'hsl(var(--status-hold))';
      case 'tentative': return 'hsl(var(--status-tentative))';
      case 'booked': return 'hsl(var(--status-booked))';
      case 'cancelled': return 'hsl(var(--status-cancelled))';
      case 'not_available': return 'hsl(var(--status-not-available))';
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
    if (hasPermission('calendar:edit') || hasPermission('calendar:edit_own')) {
      setEditEvent(event);
      setEventFormOpen(true);
    } else {
      // Show read-only event details
      toast({
        title: event.event_title,
        description: `${event.talent_profiles?.name || 'No talent assigned'} - ${event.status}`,
      });
    }
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

  const handleDateSelect = (selectInfo: any) => {
    if (hasPermission('calendar:edit') || hasPermission('calendar:edit_own')) {
      setSelectedDate(new Date(selectInfo.start));
      setSelectedEndDate(new Date(selectInfo.end || selectInfo.start));
      setEditEvent(null);
      setEventFormOpen(true);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calendar_event')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Event deleted',
        description: 'The event has been successfully deleted.',
      });

      loadEvents();
      setEditEvent(null);
      setEventFormOpen(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error deleting event',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
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

  // Show friendly message if user doesn't have access
  if (!user || !hasPermission('calendar:view') || !hasFeature('calendar')) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation language={language} setLanguage={setLanguage} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-4">Calendar</h1>
            <p className="text-muted-foreground">You don't have access to view the calendar.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AdminThemeProvider>
      <ErrorBoundary fallback={
        <div className="min-h-screen bg-background">
          <Navigation language={language} setLanguage={setLanguage} />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-semibold mb-4">Calendar</h1>
              <p className="text-muted-foreground">Something went wrong. Please refresh or contact an admin.</p>
            </div>
          </main>
        </div>
      }>
        <div className="min-h-screen">
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
              {!FEATURES.googleSync && <ComingSoon locale={safeLocale(language)} />}
              
              {(hasPermission('calendar:edit') || hasPermission('calendar:edit_own')) && (
                <Button 
                  variant="outline" 
                  onClick={() => setEventFormOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t.addEvent}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => setImportDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {t.import}
              </Button>
              
              <Select onValueChange={(value) => value === 'csv' ? exportCSV() : exportICS()}>
                <SelectTrigger className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <SelectValue placeholder={t.export} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">{t.exportCSV}</SelectItem>
                  <SelectItem value="ics">{t.exportICS}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Talent Switcher for Admin/Staff */}
            {hasPermission('calendar:edit') && (
              <div>
                <Label className="text-sm font-medium mb-2 block">{t.talentSelector}</Label>
                <TalentSwitcher
                  selectedTalent={selectedTalent}
                  onTalentChange={setSelectedTalent}
                  language={language}
                />
              </div>
            )}

            {/* Year Selector */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Year</Label>
              <YearSelector
                selectedYear={selectedYear}
                onYearChange={(year) => {
                  setSelectedYear(year);
                  // Preserve current month and day when changing years
                  const newDate = new Date(currentDate);
                  newDate.setFullYear(year);
                  setCurrentDate(newDate);
                }}
                language={language}
              />
            </div>

            {/* View Toggle */}
            <div>
              <Label className="text-sm font-medium mb-2 block">View</Label>
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
            </div>

            <div className="ml-auto">
              <CalendarLegend language={language} />
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
                    {['booked', 'hold', 'available', 'tentative', 'cancelled', 'not_available'].map(status => (
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
                          {status === 'not_available' ? (language === 'en' ? 'Not Available' : 'No disponible') : status}
                        </label>
                      </div>
                    ))}
                    {/* Hide Not Available Toggle */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hide-not-available"
                          checked={filters.hideNotAvailable}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, hideNotAvailable: !!checked }))
                          }
                        />
                        <label htmlFor="hide-not-available" className="text-sm font-medium">
                          {t.hideNotAvailable}
                        </label>
                      </div>
                    </div>
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
                      <SelectItem value="year">Full Year</SelectItem>
                      <SelectItem value="next7">{t.next7}</SelectItem>
                      <SelectItem value="next30">{t.next30}</SelectItem>
                      <SelectItem value="next90">{t.next90}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

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
                selectable={true}
                select={handleDateSelect}
                height="auto"
                eventDisplay="block"
                dayMaxEvents={3}
                weekends={true}
                editable={false}
                selectMirror={false}
                dayHeaders={true}
                allDaySlot={true}
                slotDuration="01:00:00"
                slotLabelInterval="01:00:00"
                locale={language}
                datesSet={(dateInfo) => {
                  // Only update if we're not in the middle of programmatic navigation
                  const newYear = dateInfo.start.getFullYear();
                  if (newYear !== selectedYear) {
                    setSelectedYear(newYear);
                  }
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
        selectedTalent={selectedTalent}
        onImportComplete={() => {
          loadEvents();
          setImportDialogOpen(false);
        }}
      />

      {/* Event Form Dialog */}
      <CalendarEventForm
        open={eventFormOpen}
        onOpenChange={setEventFormOpen}
        language={language}
        selectedDate={selectedDate}
        endDate={selectedEndDate}
        selectedTalent={selectedTalent}
        editEvent={editEvent}
        onSave={() => {
          loadEvents();
          setEventFormOpen(false);
          setEditEvent(null);
        }}
      />
        </div>
      </ErrorBoundary>
    </AdminThemeProvider>
  );
};

export default Calendar;