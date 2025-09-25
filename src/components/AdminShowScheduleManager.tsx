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
import { formatDateUS } from '@/lib/utils';

interface ShowScheduleEntry {
  id: string;
  day_date: string;
  day_label?: string;
  time_start: string;
  time_end: string;
  title: string;
  details?: string;
  schedule_categories?: {
    name: string;
    color: string;
    icon: string;
  };
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
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('manage');
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [eventDetails, setEventDetails] = useState<{start_ts?: string, end_ts?: string} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (eventId) {
      fetchScheduleEntries();
      fetchEventDetails();
    }
  }, [eventId]);

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

  const fetchScheduleEntries = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('show_schedule_entries')
        .select(`
          *,
          schedule_categories (
            name,
            color,
            icon
          )
        `)
        .eq('event_id', eventId)
        .eq('active', true)
        .order('day_date', { ascending: true })
        .order('time_start', { ascending: true });

      if (error) throw error;

      setScheduleEntries(data || []);
      
      // Get unique dates
      const dates = [...new Set(data?.map(entry => entry.day_date) || [])].sort();
      setAvailableDates(dates);
      
      if (dates.length > 0 && !currentDate) {
        setCurrentDate(dates[0]);
      }
    } catch (error) {
      console.error('Error fetching schedule entries:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule entries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDateEntries = () => {
    return scheduleEntries.filter(entry => entry.day_date === currentDate);
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('show_schedule_entries')
        .update({ active: false })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Schedule entry deleted",
      });

      fetchScheduleEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive"
      });
    }
  };

  const handleAddDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    console.log('handleAddDate called with:', { date, dateStr, availableDates });
    
    if (!availableDates.includes(dateStr) && availableDates.length < 4) {
      const newDates = [...availableDates, dateStr].sort();
      setAvailableDates(newDates);
      setCurrentDate(dateStr);
      console.log('Date added successfully:', { newDates });
      toast({
        title: "Success",
        description: "Date added to schedule",
      });
    } else {
      console.log('Date not added - already exists or limit reached');
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    console.log('handleRemoveDate called with:', { dateToRemove, availableDates });
    
    if (availableDates.length <= 1) {
      console.log('Cannot remove - only one date left');
      toast({
        title: "Error",
        description: "Cannot remove the last date",
        variant: "destructive"
      });
      return;
    }
    
    const newDates = availableDates.filter(date => date !== dateToRemove);
    setAvailableDates(newDates);
    
    if (currentDate === dateToRemove) {
      setCurrentDate(newDates[0] || '');
    }
    
    console.log('Date removed successfully:', { newDates });
    toast({
      title: "Success",
      description: "Date removed from schedule",
    });
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

  // Debug logging
  console.log('AdminShowScheduleManager Debug:', {
    availableDates,
    currentDate,
    availableDatesLength: availableDates.length,
    eventDetails,
    showAddDateButton: availableDates.length < 4,
    showRemoveButtons: availableDates.length > 1
  });

  if (loading) {
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">{content[language].manageSchedule}</TabsTrigger>
          <TabsTrigger value="upload">{content[language].bulkUpload}</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          {/* Date Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Schedule Dates</h4>
              {availableDates.length < 4 && (
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
            
            {availableDates.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {availableDates.map(date => (
                  <div key={date} className="flex items-center gap-1">
                    <Button
                      variant={currentDate === date ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentDate(date)}
                      className="pr-2"
                    >
                      {formatDateUS(date)}
                    </Button>
                    {availableDates.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDate(date)}
                        className="p-1 h-7 w-7 text-muted-foreground hover:text-destructive"
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
                {content[language].scheduleFor} {currentDate ? formatDateUS(currentDate) : ''}
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
                            {entry.schedule_categories && (
                              <>
                                <span className="text-sm">{entry.schedule_categories.icon}</span>
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs"
                                  style={{ 
                                    backgroundColor: entry.schedule_categories.color + '20',
                                    color: entry.schedule_categories.color,
                                    borderColor: entry.schedule_categories.color + '40'
                                  }}
                                >
                                  {entry.schedule_categories.name}
                                </Badge>
                              </>
                            )}
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

        <TabsContent value="upload">
          <ScheduleBulkUploadManager 
            eventId={eventId}
            language={language}
            onSaved={fetchScheduleEntries}
          />
        </TabsContent>
      </Tabs>

      {/* Mobile Preview Modal */}
      <ShowScheduleMobilePreview
        isOpen={showMobilePreview}
        onClose={() => setShowMobilePreview(false)}
        scheduleEntries={scheduleEntries}
        availableDates={availableDates}
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