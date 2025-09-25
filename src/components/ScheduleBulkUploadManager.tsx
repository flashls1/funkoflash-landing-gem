import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  Eye, 
  Save, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface ScheduleEntry {
  timeStart: string;
  timeEnd: string;
  title: string;
  details?: string;
  category: string;
  icon: string;
  color: string;
}

interface ParsedSchedule {
  eventId: string;
  day: string;
  date: string;
  label?: string;
  schedule: ScheduleEntry[];
}

interface ScheduleBulkUploadManagerProps {
  eventId: string;
  language?: 'en' | 'es';
  onSaved?: () => void;
}

export const ScheduleBulkUploadManager: React.FC<ScheduleBulkUploadManagerProps> = ({
  eventId,
  language = 'en',
  onSaved
}) => {
  const [rawText, setRawText] = useState('');
  const [parsedSchedule, setParsedSchedule] = useState<ParsedSchedule | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchCategories();
  }, []);

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

  const parseScheduleText = (text: string): ParsedSchedule | null => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;

    const entries: ScheduleEntry[] = [];
    const parseErrors: string[] = [];
    
    // Parse each line for schedule entries
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Expected format: "11:00 AM – 11:30 AM – Event Title; details here [Category]"
      const timeRegex = /^(\d{1,2}:\d{2}\s*[AP]M?)\s*[–\-]\s*(\d{1,2}:\d{2}\s*[AP]M?)\s*[–\-]\s*(.+?)(?:\s*\[([^\]]+)\])?$/i;
      const match = line.match(timeRegex);
      
      if (!match) {
        parseErrors.push(`Line ${lineNum}: Invalid format. Expected "TIME – TIME – TITLE [CATEGORY]"`);
        return;
      }

      const [, startTime, endTime, content, categoryName] = match;
      
      // Parse title and details
      const [title, ...detailsParts] = content.split(';');
      const details = detailsParts.join(';').trim() || undefined;
      
      // Find category
      const category = categories.find(cat => 
        cat.name.toLowerCase() === (categoryName || 'general').toLowerCase()
      ) || categories.find(cat => cat.name === 'General');
      
      if (!category) {
        parseErrors.push(`Line ${lineNum}: Unknown category "${categoryName || 'General'}"`);
        return;
      }

      // Convert time format
      const convertTime = (time: string) => {
        const cleanTime = time.replace(/\s/g, '');
        const match = cleanTime.match(/^(\d{1,2}):(\d{2})(AM|PM)?$/i);
        if (!match) return time;
        
        let [, hours, minutes, period] = match;
        let hour = parseInt(hours);
        
        if (period) {
          if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
          if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
        }
        
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
      };

      entries.push({
        timeStart: convertTime(startTime),
        timeEnd: convertTime(endTime),
        title: title.trim(),
        details,
        category: category.name,
        icon: category.icon,
        color: category.color
      });
    });

    setErrors(parseErrors);
    
    if (parseErrors.length > 0) {
      return null;
    }

    // Generate a sample parsed schedule
    const today = new Date();
    return {
      eventId,
      day: today.toLocaleDateString('en-US', { weekday: 'long' }),
      date: today.toISOString().split('T')[0],
      label: 'Event Day',
      schedule: entries.sort((a, b) => a.timeStart.localeCompare(b.timeStart))
    };
  };

  const handleParse = () => {
    if (!rawText.trim()) {
      toast({
        title: "Error",
        description: "Please enter schedule text to parse",
        variant: "destructive"
      });
      return;
    }

    const parsed = parseScheduleText(rawText);
    setParsedSchedule(parsed);
    
    if (parsed) {
      setIsPreviewMode(true);
      toast({
        title: "Success",
        description: `Parsed ${parsed.schedule.length} schedule entries`,
      });
    } else {
      toast({
        title: "Parse Failed",
        description: "Please fix the errors and try again",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!parsedSchedule) return;

    setIsLoading(true);
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Save each schedule entry to the database
      const promises = parsedSchedule.schedule.map(entry => {
        const category = categories.find(cat => cat.name === entry.category);
        
        return supabase
          .from('show_schedule_entries')
          .insert({
            event_id: eventId,
            day_date: parsedSchedule.date,
            day_label: parsedSchedule.label,
            time_start: entry.timeStart,
            time_end: entry.timeEnd,
            title: entry.title,
            details: entry.details,
            category_id: category?.id,
            created_by: userId
          });
      });

      const results = await Promise.all(promises);
      const hasErrors = results.some(result => result.error);
      
      if (hasErrors) {
        throw new Error('Some entries failed to save');
      }

      // Save bulk upload record
      await supabase
        .from('schedule_bulk_uploads')
        .insert({
          event_id: eventId,
          upload_type: 'show_schedule',
          raw_text: rawText,
          parsed_json: parsedSchedule as any,
          status: 'completed',
          created_by: userId
        });

      toast({
        title: "Success",
        description: `Saved ${parsedSchedule.schedule.length} schedule entries`,
      });

      // Reset form
      setRawText('');
      setParsedSchedule(null);
      setIsPreviewMode(false);
      setErrors([]);
      
      onSaved?.();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error",
        description: "Failed to save schedule entries",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const content = {
    en: {
      bulkUpload: 'Bulk Upload Schedule',
      instructions: 'Paste schedule text in the format: "11:00 AM – 11:30 AM – Event Title; details [Category]"',
      parseText: 'Parse Text',
      previewSchedule: 'Preview Schedule',
      saveSchedule: 'Save Schedule',
      backToEdit: 'Back to Edit',
      parseErrors: 'Parse Errors',
      scheduleParsed: 'Schedule Parsed Successfully',
      entries: 'entries'
    },
    es: {
      bulkUpload: 'Carga Masiva de Horario',
      instructions: 'Pegue el texto del horario en el formato: "11:00 AM – 11:30 AM – Título del Evento; detalles [Categoría]"',
      parseText: 'Analizar Texto',
      previewSchedule: 'Vista Previa del Horario',
      saveSchedule: 'Guardar Horario',
      backToEdit: 'Volver a Editar',
      parseErrors: 'Errores de Análisis',
      scheduleParsed: 'Horario Analizado Exitosamente',
      entries: 'entradas'
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {content[language].bulkUpload}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPreviewMode ? (
            <>
              <div className="text-sm text-muted-foreground">
                {content[language].instructions}
              </div>
              
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="11:00 AM – 11:30 AM – Doors open; autograph tables active [Autograph]
12:00 PM – 1:00 PM – Voice Actor Panel; Q&A session [Panel]
2:00 PM – 2:30 PM – Photo Op Session; Meet and greet [Photo-Op]"
                rows={10}
                className="font-mono text-sm"
              />
              
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">{content[language].parseErrors}:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              <Button onClick={handleParse} className="gap-2">
                <Eye className="h-4 w-4" />
                {content[language].parseText}
              </Button>
            </>
          ) : (
            <>
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  {content[language].scheduleParsed} - {parsedSchedule?.schedule.length} {content[language].entries}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <h4 className="font-semibold">{content[language].previewSchedule}</h4>
                
                {parsedSchedule?.schedule.map((entry, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0 text-center min-w-[80px]">
                      <div className="font-bold text-sm">
                        {entry.timeStart}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.timeEnd}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h5 className="font-medium">{entry.title}</h5>
                        <div className="flex items-center gap-2">
                          <span>{entry.icon}</span>
                          <Badge 
                            variant="outline"
                            style={{ 
                              backgroundColor: entry.color + '20',
                              borderColor: entry.color,
                              color: entry.color
                            }}
                          >
                            {entry.category}
                          </Badge>
                        </div>
                      </div>
                      
                      {entry.details && (
                        <p className="text-sm text-muted-foreground">
                          {entry.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsPreviewMode(false)}
                >
                  {content[language].backToEdit}
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {content[language].saveSchedule}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};