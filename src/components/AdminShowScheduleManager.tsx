import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScheduleBulkUploadManager } from '@/components/ScheduleBulkUploadManager';
import { 
  Calendar,
  Upload,
  Eye,
  Trash2,
  Edit
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
  const { toast } = useToast();

  useEffect(() => {
    if (eventId) {
      fetchScheduleEntries();
    }
  }, [eventId]);

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

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Convert "HH:MM:SS" to "HH:MM"
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
      scheduleFor: 'Schedule for'
    },
    es: {
      showScheduleManager: 'Gestor de Horario de Show',
      manageSchedule: 'Gestionar Horario',
      bulkUpload: 'Carga Masiva',
      noEntries: 'No hay entradas de horario para esta fecha',
      deleteEntry: 'Eliminar Entrada',
      editEntry: 'Editar Entrada',
      previewMode: 'Vista Previa Móvil',
      scheduleFor: 'Horario para'
    }
  };

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
        <Button variant="outline" size="sm" className="gap-2">
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
          {availableDates.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {availableDates.map(date => (
                <Button
                  key={date}
                  variant={currentDate === date ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentDate(date)}
                >
                  {formatDateUS(date)}
                </Button>
              ))}
            </div>
          )}

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
    </div>
  );
};