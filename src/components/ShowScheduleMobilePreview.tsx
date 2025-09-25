import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface ShowScheduleMobilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleEntries: ShowScheduleEntry[];
  availableDates: string[];
  language?: 'en' | 'es';
}

export const ShowScheduleMobilePreview: React.FC<ShowScheduleMobilePreviewProps> = ({
  isOpen,
  onClose,
  scheduleEntries,
  availableDates,
  language = 'en'
}) => {
  const [currentDate, setCurrentDate] = React.useState<string>(availableDates[0] || '');

  React.useEffect(() => {
    if (availableDates.length > 0 && !currentDate) {
      setCurrentDate(availableDates[0]);
    }
  }, [availableDates, currentDate]);

  const getCurrentDateSchedule = () => {
    return scheduleEntries.filter(entry => entry.day_date === currentDate);
  };

  const getCurrentDateLabel = () => {
    const currentSchedule = scheduleEntries.find(s => s.day_date === currentDate);
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
    return time.slice(0, 5);
  };

  const content = {
    en: {
      mobilePreview: 'Mobile Preview - Show Schedule',
      showSchedule: 'Show Schedule',
      noScheduleItems: 'No programming scheduled for this day',
      officialProgramming: 'Official event programming & activities'
    },
    es: {
      mobilePreview: 'Vista Móvil - Horario del Show',
      showSchedule: 'Horario del Show',
      noScheduleItems: 'No hay programación programada para este día',
      officialProgramming: 'Programación oficial del evento y actividades'
    }
  };

  const currentDateSchedule = getCurrentDateSchedule();
  const currentIndex = availableDates.indexOf(currentDate);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < availableDates.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-base">{content[language].mobilePreview}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Mobile Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                <CalendarDays className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-bold">{content[language].showSchedule}</h1>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{content[language].officialProgramming}</p>
          </div>

          {/* Date Navigation */}
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateDate('prev')}
                  disabled={!canGoPrev}
                  className="p-1 h-8 w-8"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                
                <div className="text-center">
                  <div className="font-semibold text-sm">{formatDateUS(currentDate)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getCurrentDateLabel()}
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateDate('next')}
                  disabled={!canGoNext}
                  className="p-1 h-8 w-8"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Entries */}
          {currentDateSchedule.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <CalendarDays className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{content[language].noScheduleItems}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {currentDateSchedule.map((entry) => (
                <Card 
                  key={entry.id} 
                  className="overflow-hidden"
                  style={{ borderLeftColor: entry.schedule_categories?.color, borderLeftWidth: '3px' }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Time Block */}
                      <div className="flex-shrink-0 text-center min-w-[60px]">
                        <div className="font-bold text-sm leading-tight">
                          {formatTime(entry.time_start)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(entry.time_end)}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm leading-tight">{entry.title}</h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {entry.schedule_categories && (
                              <>
                                <span className="text-sm">{entry.schedule_categories.icon}</span>
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs px-1.5 py-0.5"
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
                          <p className="text-xs text-muted-foreground leading-relaxed">
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
      </DialogContent>
    </Dialog>
  );
};