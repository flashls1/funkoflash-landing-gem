import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Upload, Download, Filter, Search, Calendar as CalendarIconView, Grid, Plus, Trash2, CheckCircle, PauseCircle, Clock3, Clock, CircleDashed, XCircle, MinusCircle, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { CalendarEventTooltip } from '@/components/CalendarEventTooltip';
import { CalendarSkeleton } from '@/components/CalendarSkeleton';
import { CalendarKeyboardHelp } from '@/components/CalendarKeyboardHelp';
import { CalendarFilterChips } from '@/components/CalendarFilterChips';
import { CalendarViewSelector } from '@/components/CalendarViewSelector';
import { CalendarStatusBadge } from '@/components/CalendarStatusBadge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, startOfYear, endOfYear, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

// Add custom CSS for calendar styling - Remove background override to let AdminThemeProvider handle it
const calendarStyles = `
  .fc, .fc-view-harness, .fc-view-harness-active {
    background: transparent !important;
  }

  /* FullCalendar comprehensive styling with high contrast */
  .fc {
    font-family: var(--font-sans);
    font-size: 14px;
  }

  /* Grid and borders */
  .fc-theme-standard .fc-scrollgrid {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }
  .fc-theme-standard .fc-scrollgrid td,
  .fc-theme-standard .fc-scrollgrid th {
    border-color: #e5e7eb;
  }

  /* Header styling with high contrast */
  .fc-theme-standard .fc-col-header-cell {
    background-color: #f8fafc;
    border-bottom: 2px solid #e5e7eb;
    padding: 12px 8px;
  }
  .fc-col-header-cell .fc-col-header-cell-cushion {
    color: hsl(var(--funko-orange)) !important;
    font-weight: 600 !important;
    font-size: 13px !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Day cells with proper contrast */
  .fc-theme-standard .fc-daygrid-day {
    background-color: #ffffff;
    min-height: 100px;
  }
  .fc-theme-standard .fc-daygrid-day:hover {
    background-color: #f1f5f9;
    cursor: pointer;
  }
  .fc-daygrid-day-number {
    color: #374151 !important;
    font-weight: 500 !important;
    font-size: 14px !important;
    padding: 8px !important;
  }

  /* Today highlighting */
  .fc-theme-standard .fc-day-today {
    background-color: #dbeafe !important;
    border: 2px solid #3b82f6 !important;
  }
  .fc-day-today .fc-daygrid-day-number {
    background-color: #3b82f6 !important;
    color: #ffffff !important;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex !important;
    align-items: center;
    justify-content: center;
    margin: 4px;
  }

  /* Weekend styling */
  .fc-day-weekend {
    background-color: #f9fafb !important;
  }

  /* Time grid styling for day view */
  .fc-timegrid-slot {
    height: 60px;
    border-bottom: 1px solid #f3f4f6;
  }
  .fc-timegrid-slot-label {
    color: #6b7280 !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    border-right: 1px solid #e5e7eb;
    background-color: #f9fafb;
  }
  .fc-timegrid-axis {
    background-color: #f9fafb;
  }

  /* Event styling with high contrast */
  .fc-theme-standard .fc-event {
    border: 1px solid #3b82f6;
    background-color: #3b82f6;
    color: #ffffff !important;
    font-weight: 500;
    font-size: 12px;
    border-radius: 4px;
    padding: 2px 4px;
    margin: 1px;
  }
  .fc-event-title {
    color: #ffffff !important;
    font-weight: 500 !important;
  }
  .fc-event-time {
    color: #ffffff !important;
    font-weight: 400 !important;
  }

  /* Event status colors */
  .fc-event.status-confirmed {
    border-color: #10b981;
    background-color: #10b981;
  }
  .fc-event.status-tentative {
    border-color: #f59e0b;
    background-color: #f59e0b;
  }
  .fc-event.status-cancelled {
    border-color: #ef4444;
    background-color: #ef4444;
  }
  .fc-event.status-not_available {
    border-color: #6b7280;
    background-color: #6b7280;
  }

  /* Button styling */
  .fc-theme-standard .fc-button-primary {
    background-color: #3b82f6;
    border-color: #3b82f6;
    color: #ffffff;
    font-weight: 500;
    border-radius: 6px;
    padding: 8px 16px;
  }
  .fc-theme-standard .fc-button-primary:hover {
    background-color: #2563eb;
    border-color: #2563eb;
  }
  .fc-theme-standard .fc-button-primary:not(:disabled):active,
  .fc-theme-standard .fc-button-primary:not(:disabled).fc-button-active {
    background-color: #1d4ed8;
    border-color: #1d4ed8;
  }

  /* Toolbar styling with ORANGE text for month/headers */
  .fc-toolbar {
    margin-bottom: 16px;
  }
  .fc-toolbar-title {
    color: hsl(var(--funko-orange)) !important;
    font-weight: 700 !important;
    font-size: 24px !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  /* Custom today styling */
  .fc-day-today-custom {
    position: relative;
  }
  .fc-today-pill {
    position: absolute;
    top: 4px;
    right: 4px;
    background-color: #3b82f6;
    color: #ffffff;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: bold;
    z-index: 1;
  }
  .fc-event-today {
    border: 2px solid #3b82f6 !important;
    background-color: #3b82f6 !important;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }

  /* Responsive improvements */
  @media (max-width: 768px) {
    .fc-col-header-cell .fc-col-header-cell-cushion {
      font-size: 11px !important;
    }
    .fc-daygrid-day-number {
      font-size: 12px !important;
    }
    .fc-event {
      font-size: 11px !important;
    }
  }
`;

// Inject styles only once
if (typeof document !== 'undefined') {
  const existingStyle = document.querySelector('#calendar-custom-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'calendar-custom-styles';
    styleSheet.type = 'text/css';
    styleSheet.innerText = calendarStyles;
    document.head.appendChild(styleSheet);
  }
}

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
  const [view, setView] = useState<'month' | 'week' | 'weekend'>(() => {
    return (localStorage.getItem('ffCal.viewMode') as 'month' | 'week' | 'weekend') || 'week';
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [talents, setTalents] = useState<{ id: string; name: string; user_id?: string }[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>({
    status: ['booked', 'hold', 'available', 'tentative', 'cancelled', 'not_available'],
    talent: [],
    dateRange: 'year', // Default to yearly view to see all events
    hideNotAvailable: false
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('ffCal.year');
    const year = saved ? parseInt(saved) : new Date().getFullYear();
    // Clamp to bounds 2025-2030
    return Math.max(2025, Math.min(2030, year));
  });
  const [talentSearch, setTalentSearch] = useState('');
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    return (localStorage.getItem('calendar-density') as 'comfortable' | 'compact') || 'comfortable';
  });
  
  // Simple loading state
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Hybrid calendar state - ALWAYS DEFAULT TO SIMPLE VIEW
  const [calendarMode, setCalendarMode] = useState<'simple' | 'detailed'>('simple');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [detailedView, setDetailedView] = useState<'week' | 'day'>('week');

  const { user, profile, loading: authLoading } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if we should start with a specific date from navigation state
  useEffect(() => {
    if (location.state?.selectedDate) {
      const navDate = new Date(location.state.selectedDate);
      setCurrentDate(navDate);
      setSelectedYear(navDate.getFullYear());
    }
  }, [location.state]);

  // Simple calendar navigation functions
  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Function to handle date clicks in simple view
  const handleSimpleDateClick = (date: Date) => {
    setCurrentDate(date);
    setSelectedDate(date);
    setCalendarMode('detailed');
    setDetailedView('week'); // When clicking a specific date, show week view by default
  };

  // Function to get the dynamic initial date for FullCalendar
  const getInitialDate = () => {
    // If we have date range filters applied, use appropriate date
    if (filters.dateRange === 'next7' || filters.dateRange === 'next30' || filters.dateRange === 'next90') {
      return new Date(); // Current date for future range filters
    }
    
    // If we have a selected date, use that
    if (selectedDate) {
      return selectedDate;
    }
    
    // Default to current date instead of January 1st
    return new Date();
  };

  // Save view mode and year to localStorage
  useEffect(() => {
    localStorage.setItem('ffCal.viewMode', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('ffCal.year', selectedYear.toString());
  }, [selectedYear]);

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
      blockRange: 'Block date range...',
      backTalent: 'Back to Talent Dashboard',
      simpleView: 'Simple View',
      detailView: 'Detail View',
      monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      dayNames: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      calendarUi: {
        density: { comfortable: 'Comfortable', compact: 'Compact' },
        quickRanges: { next7: 'Next 7 days', next30: 'Next 30 days', next90: 'Next 90 days' },
        help: 'Keyboard shortcuts',
        today: 'Today'
      }
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
      blockRange: 'Bloquear rango de fechas...',
      backTalent: 'Volver al panel de Talento',
      simpleView: 'Vista Simple',
      detailView: 'Vista Detallada',
      monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      dayNames: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
      calendarUi: {
        density: { comfortable: 'Cómodo', compact: 'Compacto' },
        quickRanges: { next7: 'Próximos 7 días', next30: 'Próximos 30 días', next90: 'Próximos 90 días' },
        help: 'Atajos de teclado',
        today: 'Hoy'
      }
    }
  };

  const t = content[language];

  // Initialize calendar data
  useEffect(() => {
    const initializeCalendar = async () => {
      // Wait for auth and permissions to load
      if (authLoading || permissionsLoading) {
        return;
      }

      // Check authentication and permissions
      if (!user || !hasPermission('calendar:view') || !hasFeature('calendar')) {
        setIsInitializing(false);
        return;
      }

      try {
        // Sequential data loading to prevent conflicts
        await loadTalents();
        
      } catch (error) {
        console.error('Error initializing calendar:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize calendar. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeCalendar();
  }, [hasFeature, navigate, authLoading, permissionsLoading, user, hasPermission]);

  const loadEvents = useCallback(async () => {
    // Prevent loading if not ready
    if (!user || !hasPermission('calendar:view') || authLoading || permissionsLoading) {
      return;
    }

    setLoading(true);
    try {
      // Calendar should always be viewable for all roles
      let startDate: Date;
      let endDate: Date;

      // Primary date filtering logic - prioritize date range filter
      if (filters.dateRange === 'next7') {
        startDate = new Date();
        endDate = addDays(new Date(), 7);
      } else if (filters.dateRange === 'next30') {
        startDate = new Date();
        endDate = addDays(new Date(), 30);
      } else if (filters.dateRange === 'next90') {
        startDate = new Date();
        endDate = addDays(new Date(), 90);
      } else {
        // For 'year' or any other filter, use the selected year
        startDate = startOfYear(new Date(selectedYear, 0, 1));
        endDate = endOfYear(new Date(selectedYear, 11, 31));
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

        // Apply talent filter - always include unassigned events (talent_id IS NULL)
        if (hasPermission('calendar:edit')) {
          // Admin/Staff: show all events by default, filter by talent if selected
          if (selectedTalent) {
            // Show selected talent's events + unassigned events
            query = query.or(`talent_id.eq.${selectedTalent},talent_id.is.null`);
          }
          if (filters.talent.length > 0) {
            // Show filtered talents' events + unassigned events
            const talentFilter = filters.talent.map(id => `talent_id.eq.${id}`).join(',');
            query = query.or(`${talentFilter},talent_id.is.null`);
          }
          // If no talent filter applied, show all events (including unassigned)
        } else if (hasPermission('calendar:edit_own')) {
          // Talent/Business: show their own events + unassigned events
          const userTalentsQuery = await supabase
            .from('talent_profiles')
            .select('id')
            .eq('user_id', user.id)
            .eq('active', true);
          
          if (userTalentsQuery.data && userTalentsQuery.data.length > 0) {
            const userTalentIds = userTalentsQuery.data.map(t => t.id);
            const talentFilter = userTalentIds.map(id => `talent_id.eq.${id}`).join(',');
            // Show user's talent events + unassigned events
            query = query.or(`${talentFilter},talent_id.is.null`);
          } else {
            // User has no talents, but still show unassigned events
            query = query.is('talent_id', null);
          }
        }

      const { data, error } = await query.order('start_date');

      if (error) throw error;
      
      console.log(`Calendar query executed: Found ${data?.length || 0} events for year ${selectedYear}, date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
      if (data && data.length > 0) {
        console.log('Sample events:', data.slice(0, 3).map(e => ({ title: e.event_title, date: e.start_date, talent: e.talent_profiles?.name })));
      }
      
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
      // Remove transition timer that causes rendering glitches
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
    selectedTalent,
    toast
  ]);

  // Load events when data is ready
  useEffect(() => {
    if (user && hasPermission('calendar:view') && !authLoading && !permissionsLoading) {
      loadEvents();
    }
  }, [
    loadEvents,
    user?.id,
    authLoading,
    permissionsLoading,
    hasPermission('calendar:view')
  ]);


  const loadTalents = async () => {
    try {
      const { data, error } = await supabase
        .from('talent_profiles')
        .select('id, name, user_id')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      const talentData = data || [];
      setTalents(talentData);
      
      // Auto-select first talent if none selected and user has appropriate permissions
      if (!selectedTalent && talentData.length > 0) {
        if (hasPermission('calendar:edit')) {
          // Admin/Staff: auto-select first talent
          setSelectedTalent(talentData[0].id);
        } else if (hasPermission('calendar:edit_own')) {
          // Find user's own talent
          const userTalent = talentData.find(t => t.user_id === user?.id);
          if (userTalent) {
            setSelectedTalent(userTalent.id);
          }
        }
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
    return events.map(event => {
      const getStatusIcon = (status: string) => {
        switch (status) {
          case 'booked': return '✓';
          case 'hold': return '⏸';
          case 'tentative': return '⏰';
          case 'available': return '○';
          case 'cancelled': return '✕';
          case 'not_available': return '−';
          default: return '';
        }
      };

      const getLocation = () => {
        const parts = [event.location_city, event.location_state].filter(Boolean);
        return parts.length > 0 ? `, ${parts.join(', ')}` : '';
      };

      const truncateTitle = (title: string, maxLength: number = 25) => {
        if (title.length <= maxLength) return title;
        return title.substring(0, maxLength) + '...';
      };

      const displayTitle = `${getStatusIcon(event.status)} ${truncateTitle(event.event_title)}${getLocation()}`;

      return {
        id: event.id,
        title: displayTitle,
        start: event.all_day ? event.start_date : `${event.start_date}T${event.start_time || '00:00'}`,
        end: event.all_day ? event.end_date : `${event.end_date}T${event.end_time || '23:59'}`,
        allDay: event.all_day,
        backgroundColor: getStatusColor(event.status),
        borderColor: getStatusColor(event.status),
        textColor: event.status === 'tentative' ? '#000000' : '#ffffff',
        classNames: [
          'transition-all duration-200 hover:scale-105',
          event.status === 'cancelled' ? 'line-through opacity-70' : '',
          event.status === 'not_available' ? 'opacity-60' : ''
        ].filter(Boolean),
        extendedProps: event
      };
    });
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
        description: `${event.talent_profiles?.name || talents.find(t => t.id === event.talent_id)?.name || 'No talent assigned'} - ${event.status}`,
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

  // Helper functions for filter management
  const handleClearAllFilters = () => {
    setFilters({
      status: ['booked', 'hold', 'available', 'tentative', 'cancelled', 'not_available'],
      talent: [],
      dateRange: 'year',
      hideNotAvailable: false
    });
  };

  const handleRemoveStatusFilter = (status: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: prev.status.filter(s => s !== status) 
    }));
  };

  const handleRemoveTalentFilter = (talentId: string) => {
    setFilters(prev => ({ 
      ...prev, 
      talent: prev.talent.filter(t => t !== talentId) 
    }));
  };

  const handleRemoveDateRangeFilter = () => {
    setFilters(prev => ({ ...prev, dateRange: 'year' }));
  };

  const toggleDensity = () => {
    const newDensity = density === 'comfortable' ? 'compact' : 'comfortable';
    setDensity(newDensity);
    localStorage.setItem('calendar-density', newDensity);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with form inputs
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          // FullCalendar will handle navigation
          break;
        case 'ArrowRight':
          event.preventDefault();
          // FullCalendar will handle navigation
          break;
        case 'Escape':
          event.preventDefault();
          if (eventFormOpen) setEventFormOpen(false);
          if (importDialogOpen) setImportDialogOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [eventFormOpen, importDialogOpen]);

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
              {/* Back to Talent Dashboard - Only for Talent Role */}
              {profile?.role === 'talent' && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (window.history.length > 1) {
                      navigate(-1);
                    } else {
                      navigate('/dashboard/talent');
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t.backTalent}
                </Button>
              )}
              <CalendarIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 items-center">
              {/* Density Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDensity}
                className="flex items-center gap-2"
                title={t.calendarUi.density[density]}
              >
                {density === 'comfortable' ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                <span className="hidden sm:inline">{t.calendarUi.density[density]}</span>
              </Button>

              {/* Keyboard Help */}
              <CalendarKeyboardHelp language={language} />

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
                 onYearChange={setSelectedYear}
                language={language}
              />
            </div>

            {/* View Toggle */}
            <div>
              <Label className="text-sm font-medium mb-2 block">View</Label>
              <CalendarViewSelector
                view={view}
                onViewChange={setView}
                language={language}
              />
            </div>

            <div className="ml-auto flex items-center gap-4">
              {/* Quick Date Range Buttons */}
              <div className="flex gap-1">
                <Button
                  variant={filters.dateRange === 'next7' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, dateRange: 'next7' }))}
                >
                  {t.calendarUi.quickRanges.next7}
                </Button>
                <Button
                  variant={filters.dateRange === 'next30' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, dateRange: 'next30' }))}
                >
                  {t.calendarUi.quickRanges.next30}
                </Button>
                <Button
                  variant={filters.dateRange === 'next90' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, dateRange: 'next90' }))}
                >
                  {t.calendarUi.quickRanges.next90}
                </Button>
              </div>
              
              <CalendarLegend language={language} />
            </div>
          </div>

          {/* Filter Chips */}
          <div className="mb-4">
            <CalendarFilterChips
              filters={filters}
              talents={talents}
              language={language}
              onClearAll={handleClearAllFilters}
              onRemoveStatusFilter={handleRemoveStatusFilter}
              onRemoveTalentFilter={handleRemoveTalentFilter}
              onRemoveDateRangeFilter={handleRemoveDateRangeFilter}
            />
          </div>

          {/* Filters - Compact Design */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-4 w-4" />
                {t.filters}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Status Filter - Compact with Color Codes */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">{t.status}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'booked', color: '#10b981', label: 'Booked' },
                      { key: 'hold', color: '#f59e0b', label: 'Hold' },
                      { key: 'available', color: '#3b82f6', label: 'Available' },
                      { key: 'tentative', color: '#f59e0b', label: 'Tentative' },
                      { key: 'cancelled', color: '#ef4444', label: 'Cancelled' },
                      { key: 'not_available', color: '#6b7280', label: 'Not Available' }
                    ].map(status => (
                      <div key={status.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={status.key}
                          checked={filters.status.includes(status.key)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters(prev => ({ ...prev, status: [...prev.status, status.key] }));
                            } else {
                              setFilters(prev => ({ ...prev, status: prev.status.filter(s => s !== status.key) }));
                            }
                          }}
                        />
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-3 h-3 rounded-full border border-gray-300" 
                            style={{ backgroundColor: status.color }}
                          />
                          <label htmlFor={status.key} className="text-xs font-medium">
                            {status.label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Hide Not Available Toggle */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hide-not-available"
                        checked={filters.hideNotAvailable}
                        onCheckedChange={(checked) => 
                          setFilters(prev => ({ ...prev, hideNotAvailable: !!checked }))
                        }
                      />
                      <label htmlFor="hide-not-available" className="text-xs font-medium text-muted-foreground">
                        {t.hideNotAvailable}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Combined Talent & Date Range Filters */}
                <div className="space-y-3">
                  {/* Date Range Filter */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">{t.dateRange}</label>
                    <Select value={filters.dateRange} onValueChange={(value) => 
                      setFilters(prev => ({ ...prev, dateRange: value }))
                    }>
                      <SelectTrigger className="h-9">
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

                  {/* Talent Filter - Only visible to Admin/Staff */}
                  {hasPermission('calendar:edit') && (
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1 block">{t.talent}</label>
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                          <Input
                            placeholder={t.searchTalent}
                            value={talentSearch}
                            onChange={(e) => setTalentSearch(e.target.value)}
                            className="pl-7 h-8 text-xs"
                          />
                        </div>
                        <div className="max-h-24 overflow-y-auto space-y-1 bg-muted/30 rounded p-2">
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
                              <label htmlFor={talent.id} className="text-xs">
                                {talent.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Calendar View - Moved closer to filters */}
        <div className={`transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          {loading ? (
            <CalendarSkeleton view={view} />
          ) : (
            <Card className="border-funko-blue border-2">
              <CardContent className="p-6">
                {/* Calendar Mode Toggle - Moved inside calendar box and centered */}
                <div className="flex justify-center mb-6">
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <Button
                      variant={calendarMode === 'simple' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCalendarMode('simple')}
                      className={`px-4 flex items-center justify-center min-w-0 transition-all ${
                        calendarMode === 'simple'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : '!text-blue-600 hover:!bg-blue-50 hover:!text-blue-700'
                      }`}
                    >
                      <Grid className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="whitespace-nowrap">{t.simpleView}</span>
                    </Button>
                    <Button
                      variant={calendarMode === 'detailed' ? 'default' : 'ghost'}
                      size="sm"
                       onClick={() => {
                         setCalendarMode('detailed');
                         setDetailedView('week'); // Always default to week view when switching to detailed
                       }}
                      className={`px-4 flex items-center justify-center min-w-0 transition-all ${
                        calendarMode === 'detailed'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : '!text-blue-600 hover:!bg-blue-50 hover:!text-blue-700'
                      }`}
                    >
                      <CalendarIconView className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="whitespace-nowrap">{t.detailView}</span>
                    </Button>
                  </div>
                </div>

                 {calendarMode === 'simple' ? (
                   /* Simple Calendar Grid */
                   <div>
                     {/* Month Navigation */}
                     <div className="flex items-center justify-between mb-6">
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={handlePrevMonth}
                         className="h-8 w-8 p-0"
                       >
                         <ChevronLeft className="h-4 w-4" />
                       </Button>
                       
                        <h3 className="text-xl font-bold text-funko-orange">
                          {t.monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h3>
                     
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={handleNextMonth}
                       className="h-8 w-8 p-0"
                     >
                       <ChevronRight className="h-4 w-4" />
                     </Button>
                   </div>

                   {/* Calendar Grid */}
                   <div className="space-y-2">
                     {/* Day Headers */}
                     <div className="grid grid-cols-7 gap-1">
                        {t.dayNames.map((day) => (
                          <div key={day} className="text-sm font-medium text-funko-orange text-center py-2">
                            {day}
                          </div>
                        ))}
                     </div>
                     
                     {/* Calendar Days */}
                     <div className="grid grid-cols-7 gap-1">
                       {(() => {
                         const monthStart = startOfMonth(currentDate);
                         const monthEnd = endOfMonth(currentDate);
                         const startDate = startOfWeek(monthStart);
                         const endDate = endOfWeek(monthEnd);
                         const days = eachDayOfInterval({ start: startDate, end: endDate });
                         
                         return days.map((day, index) => {
                           const isCurrentMonth = isSameMonth(day, currentDate);
                           const isTodayDate = isToday(day);
                           
                           return (
                             <div
                               key={index}
                               className={cn(
                                 "relative h-12 text-sm text-center flex items-center justify-center rounded border border-border/50",
                                 "hover:bg-accent cursor-pointer transition-colors",
                                 isTodayDate && "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold border-blue-500",
                                 !isCurrentMonth && "text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800"
                               )}
                               onClick={() => handleSimpleDateClick(day)}
                             >
                               <span className="font-medium">{format(day, 'd')}</span>
                             </div>
                           );
                         });
                       })()}
                     </div>
                   </div>

                   {/* Today Button */}
                   <div className="flex justify-center mt-4">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={handleToday}
                       className="text-sm"
                     >
                       {t.calendarUi.today}
                     </Button>
                   </div>
                   </div>
                  ) : (
                   /* Detailed FullCalendar View */
                   <div>
                     {/* Week/Day Toggle for Detailed View */}
                     <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                           <Button
                             variant={detailedView === 'week' ? 'default' : 'ghost'}
                             size="sm"
                             onClick={() => setDetailedView('week')}
                             className={`text-sm font-medium transition-all ${
                               detailedView === 'week' 
                                 ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                 : '!text-blue-600 hover:!bg-blue-50 hover:!text-blue-700'
                             }`}
                           >
                             <CalendarIcon className="h-4 w-4 mr-1" />
                             Week
                           </Button>
                           <Button
                             variant={detailedView === 'day' ? 'default' : 'ghost'}
                             size="sm"
                             onClick={() => setDetailedView('day')}
                             className={`text-sm font-medium transition-all ${
                               detailedView === 'day' 
                                 ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                 : '!text-blue-600 hover:!bg-blue-50 hover:!text-blue-700'
                             }`}
                           >
                             <Clock className="h-4 w-4 mr-1" />
                             Day
                           </Button>
                         </div>
                       </div>
                       
                       <div className="text-sm text-muted-foreground">
                         {detailedView === 'week' 
                           ? 'Click a date to view day schedule'
                           : 'Hourly schedule view'
                         }
                       </div>
                     </div>

                      {/* Render FullCalendar once data is ready */}
                      {!isInitializing && (
                   <div className="calendar-container">
                     <FullCalendar
                       plugins={[dayGridPlugin, timeGridPlugin]}
                       initialView={
                         detailedView === 'week' ? 'timeGridWeek' : 'timeGridDay'
                       }
                       initialDate={getInitialDate()}
                       headerToolbar={{
                         left: 'prev,next today',
                         center: 'title',
                         right: ''
                       }}
                       weekends={view !== 'weekend'}
                       hiddenDays={view === 'weekend' ? [0, 1, 2, 3, 4] : []}
                       events={formatEventsForFullCalendar(events)}
                       eventClick={handleEventClick}
                       selectable={true}
                       select={handleDateSelect}
                       height="auto"
                       eventDisplay="block"
                       dayMaxEvents={density === 'compact' ? 2 : 3}
                       editable={false}
                       selectMirror={false}
                       dayHeaders={true}
                       allDaySlot={detailedView === 'day'}
                       slotDuration="01:00:00"
                       slotLabelInterval="01:00:00"
                       slotMinTime="06:00:00"
                       slotMaxTime="24:00:00"
                       locale={language}
                    eventDidMount={(info) => {
                      const event = info.event.extendedProps as CalendarEvent;
                      
                      // Add status-based styling
                      if (event.status) {
                        info.el.classList.add(`status-${event.status}`);
                      }
                      
                      // Add custom styling for today
                      const today = new Date().toISOString().split('T')[0];
                      if (event.start_date === today) {
                        info.el.classList.add('fc-event-today');
                      }
                    }}
                    datesSet={(dateInfo) => {
                      const newYear = dateInfo.start.getFullYear();
                      if (newYear !== selectedYear) {
                        setSelectedYear(newYear);
                      }
                      
                      // Announce date changes for accessibility
                      const announcement = `${language === 'en' ? 'Viewing' : 'Viendo'} ${format(dateInfo.start, detailedView === 'day' ? 'EEEE, MMMM d, yyyy' : 'MMMM yyyy')}`;
                      const ariaLive = document.getElementById('calendar-aria-live');
                      if (ariaLive) {
                        ariaLive.textContent = announcement;
                      }
                    }}
                    viewDidMount={(viewInfo) => {
                      // Calendar view has mounted, ensure our state is in sync
                      console.log('Calendar view mounted:', viewInfo.view.type);
                    }}
                    dayCellDidMount={(info) => {
                      const today = new Date().toISOString().split('T')[0];
                      const cellDate = info.date.toISOString().split('T')[0];
                      
                      // Add today styling
                      if (cellDate === today) {
                        info.el.classList.add('fc-day-today-custom');
                        const todayPill = document.createElement('div');
                        todayPill.className = 'fc-today-pill';
                        todayPill.textContent = t.calendarUi.today;
                        info.el.appendChild(todayPill);
                      }
                      
                      // Add weekend shading
                      const dayOfWeek = info.date.getDay();
                      if (dayOfWeek === 0 || dayOfWeek === 6) {
                        info.el.classList.add('fc-day-weekend');
                      }
                      
                      // Add click handler for week view to switch to day view
                      if (detailedView === 'week') {
                        info.el.style.cursor = 'pointer';
                        info.el.addEventListener('click', () => {
                          setCurrentDate(new Date(info.date));
                          setSelectedDate(new Date(info.date));
                          setDetailedView('day');
                        });
                      }
                    }}
                  />
                  
                       {/* Aria live region for screen readers */}
                       <div
                         id="calendar-aria-live"
                         aria-live="polite"
                         aria-atomic="true"
                         className="sr-only"
                       />
                     </div>
                     )}
                   </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
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