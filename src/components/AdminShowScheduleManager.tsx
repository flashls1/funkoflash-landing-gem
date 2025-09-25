import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScheduleBulkUploadManager } from '@/components/ScheduleBulkUploadManager';
import { ShowScheduleMobilePreview } from '@/components/ShowScheduleMobilePreview';
import { DatePickerDialog } from '@/components/DatePickerDialog';
import { 
  Calendar,
  Upload,
  Eye,
  Trash2,
  Edit,
  Plus,
  X
} from 'lucide-react';
import { IconSelector } from '@/components/IconSelector';
import { formatDateUS } from '@/lib/utils';
import { format } from 'date-fns';

interface ShowScheduleEntry {
  id: string;
  event_id: string;
  day_date: string;
  time_start: string;
  time_end: string;
  title: string;
  details?: string;
  display_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  category_id?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  event_date_id?: string;
  schedule_categories?: {
    name: string;
    color: string;
    icon: string;
  };
}

interface EventDate {
  id: string;
  event_id: string;
  date_value: string;
  date_label?: string;
  display_order: number;
  active: boolean;
}

interface AdminShowScheduleManagerProps {
  eventId: string;
  language?: 'en' | 'es';
}

export const AdminShowScheduleManager: React.FC<AdminShowScheduleManagerProps> = ({
  eventId,
  language = 'en'
}) => {
  const [scheduleEntries, setScheduleEntries] = useState<ShowScheduleEntry[]>([]);
  const [eventDates, setEventDates] = useState<EventDate[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'manage' | 'bulk'>('manage');
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [eventDetails, setEventDetails] = useState<{ start_ts?: string; end_ts?: string } | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchEventDates = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase
        .from('event_dates')
        .select('*')
        .eq('event_id', eventId)
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching event dates:', error);
        return;
      }

      setEventDates(data || []);
      
      if (data && data.length > 0 && !currentDate) {
        setCurrentDate(data[0].date_value);
      }
    } catch (error) {
      console.error('Error in fetchEventDates:', error);
    }
  };

  const fetchScheduleEntries = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase
        .from('show_schedule_entries')
        .select(`
          *,
          schedule_categories!left (
            id,
            name,
            icon,
            color
          )
        `)
        .eq('event_id', eventId)
        .eq('active', true)
        .order('day_date', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching schedule entries:', error);
        return;
      }

      const entries = data?.map(entry => ({
        ...entry,
        category_name: entry.schedule_categories?.name,
        category_icon: entry.schedule_categories?.icon,
        category_color: entry.schedule_categories?.color
      })) || [];

      setScheduleEntries(entries);
    } catch (error) {
      console.error('Error in fetchScheduleEntries:', error);
    }
  };

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('business_events')
        .select('start_ts, end_ts')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      setEventDetails(data);
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_categories')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchEventDates();
      await fetchScheduleEntries();
      await fetchEventDetails();
      await fetchCategories();
      setIsLoading(false);
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const getCurrentDateEntries = () => {
    return scheduleEntries.filter(entry => entry.day_date === currentDate);
  };

  const getCurrentDateLabel = () => {
    const currentEventDate = eventDates.find(date => date.date_value === currentDate);
    if (currentEventDate && currentEventDate.date_label) {
      return currentEventDate.date_label;
    }
    
    // Default formatted date if no custom label exists
    return formatDateUS(currentDate);
  };

  const handleCategoryChange = async (entryId: string, newCategory: any) => {
    try {
      const { error } = await supabase
        .from('show_schedule_entries')
        .update({ 
          category_id: newCategory.id,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated successfully",
      });

      await fetchScheduleEntries();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule entry?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('show_schedule_entries')
        .update({ active: false, updated_by: (await supabase.auth.getUser()).data.user?.id })
        .eq('id', entryId);

      if (error) throw error;

      // Refresh the schedule entries
      await fetchScheduleEntries();
      
      toast({
        title: "Success",
        description: "Schedule entry deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error", 
        description: "Failed to delete schedule entry",
        variant: "destructive"
      });
    }
  };

  const handleAddDate = async (newDate: Date) => {
    const dateString = format(newDate, 'yyyy-MM-dd');
    
    // Check if we already have 4 dates
    if (eventDates.length >= 4) {
      toast({
        title: "Maximum dates reached",
        description: "You can only have up to 4 dates in your schedule",
        variant: "destructive"
      });
      return;
    }
    
    // Check if date already exists
    if (eventDates.some(date => date.date_value === dateString)) {
      toast({
        title: "Date already exists",
        description: "This date is already in your schedule",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('manage_event_date', {
        p_event_id: eventId,
        p_date_value: dateString,
        p_action: 'upsert'
      });

      if (error) throw error;

      // Refresh dates and switch to new date
      await fetchEventDates();
      setCurrentDate(dateString);
      setShowDatePicker(false);
      
      toast({
        title: "Success",
        description: "Date added to schedule",
      });
    } catch (error) {
      console.error('Error adding date:', error);
      toast({
        title: "Error",
        description: "Failed to add date to schedule",
        variant: "destructive"
      });
    }
  };

  const handleRemoveDate = async (dateToRemove: string) => {
    console.log('handleRemoveDate called with:', { dateToRemove, eventDates });
    
    if (eventDates.length <= 1) {
      toast({
        title: "Cannot remove date",
        description: "You must have at least one date in your schedule",
        variant: "destructive"
      });
      return;
    }

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete all schedule entries for ${formatDateUS(dateToRemove)}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Use the database function to delete the date and associated entries
      const { error } = await supabase.rpc('manage_event_date', {
        p_event_id: eventId,
        p_date_value: dateToRemove,
        p_action: 'delete'
      });

      if (error) throw error;

      // Refresh data and update current date if needed
      await fetchEventDates();
      await fetchScheduleEntries();
      
      if (currentDate === dateToRemove) {
        const remainingDates = eventDates.filter(date => date.date_value !== dateToRemove);
        setCurrentDate(remainingDates[0]?.date_value || '');
      }

      console.log('Date and entries removed successfully');
      toast({
        title: "Success",
        description: `Deleted all schedule entries for ${formatDateUS(dateToRemove)}`,
      });
    } catch (error) {
      console.error('Error removing date:', error);
      toast({
        title: "Error",
        description: "Failed to remove date and schedule entries",
        variant: "destructive"
      });
    }
  };

  const formatTime = (time: string) => {
    // Convert 24-hour time to 12-hour format
    const timeOnly = time.slice(0, 5); // Convert "HH:MM:SS" to "HH:MM"
    const [hours, minutes] = timeOnly.split(':');
    const hour24 = parseInt(hours);
    
    if (hour24 === 0) {
      return `12:${minutes} AM`;
    } else if (hour24 < 12) {
      return `${hour24}:${minutes} AM`;
    } else if (hour24 === 12) {
      return `12:${minutes} PM`;
    } else {
      return `${hour24 - 12}:${minutes} PM`;
    }
  };

  const content = {
    en: {
      showScheduleManager: 'Show Schedule Manager',
      manageSchedule: 'Manage Schedule',
      bulkUpload: 'Bulk Upload',
      noEntries: 'No schedule entries for this date',
      deleteEntry: 'Delete Entry',
      editEntry: 'Edit Entry',
      previewMode: 'Preview Mobile View',
      scheduleFor: 'Schedule for',
      addDate: 'Add Date',
      removeDate: 'Remove Date'
    },
    es: {
      showScheduleManager: 'Gestor de Horario de Show',
      manageSchedule: 'Gestionar Horario',
      bulkUpload: 'Carga Masiva',
      noEntries: 'No hay entradas de horario para esta fecha',
      deleteEntry: 'Eliminar Entrada',
      editEntry: 'Editar Entrada',
      previewMode: 'Vista Previa Móvil',
      scheduleFor: 'Horario para',
      addDate: 'Agregar Fecha',
      removeDate: 'Eliminar Fecha'
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  const currentDateEntries = getCurrentDateEntries();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {content[language].showScheduleManager}
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => setShowMobilePreview(true)}
        >
          <Eye className="h-4 w-4" />
          {content[language].previewMode}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'manage' | 'bulk')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">{content[language].manageSchedule}</TabsTrigger>
          <TabsTrigger value="bulk">{content[language].bulkUpload}</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          {/* Date Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Schedule Dates</h4>
              {eventDates.length < 4 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDatePicker(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {content[language].addDate}
                </Button>
              )}
            </div>
            
            {eventDates.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {eventDates.map((eventDate) => (
                  <div key={eventDate.id} className="flex items-center gap-1">
                    <Button
                      variant={currentDate === eventDate.date_value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentDate(eventDate.date_value)}
                      className="h-8"
                    >
                      {eventDate.date_label || formatDateUS(eventDate.date_value)}
                    </Button>
                    {eventDates.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDate(eventDate.date_value)}
                        className="p-1 h-7 w-7 text-muted-foreground hover:text-destructive"
                        title={`Delete all schedule entries for ${eventDate.date_label || formatDateUS(eventDate.date_value)}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Entries for Current Date */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {getCurrentDateLabel()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentDateEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{content[language].noEntries}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentDateEntries.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow"
                      style={{ borderLeftColor: entry.schedule_categories?.color, borderLeftWidth: '4px' }}
                    >
                      {/* Time Block */}
                      <div className="flex-shrink-0 text-center min-w-[80px]">
                        <div className="font-bold text-sm">
                          {formatTime(entry.time_start)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(entry.time_end)}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold leading-tight">{entry.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <IconSelector
                              currentCategory={entry.schedule_categories}
                              categories={categories}
                              onCategoryChange={(newCategory) => handleCategoryChange(entry.id, newCategory)}
                            />
                          </div>
                        </div>
                        
                        {entry.details && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                            {entry.details}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Edit className="h-3 w-3" />
                            {content[language].editEntry}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="gap-1 text-destructive hover:text-destructive"
                            title="Delete this schedule entry"
                          >
                            <Trash2 className="h-3 w-3" />
                            {content[language].deleteEntry}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <ScheduleBulkUploadManager 
            eventId={eventId}
            language={language}
            onSaved={() => {
              fetchEventDates();
              fetchScheduleEntries();
              setActiveTab('manage');
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Mobile Preview Modal */}
      <ShowScheduleMobilePreview
        isOpen={showMobilePreview}
        onClose={() => setShowMobilePreview(false)}
        scheduleEntries={scheduleEntries}
        availableDates={eventDates.map(ed => ed.date_value)}
        language={language}
      />

      {/* Date Picker Dialog */}
      <DatePickerDialog
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleAddDate}
        eventStartDate={eventDetails?.start_ts ? new Date(eventDetails.start_ts) : undefined}
        eventEndDate={eventDetails?.end_ts ? new Date(eventDetails.end_ts) : undefined}
        language={language}
      />
    </div>
  );
};