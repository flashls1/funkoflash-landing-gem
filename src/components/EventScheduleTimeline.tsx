import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { parseTimeSlot } from '@/lib/utils';

interface ScheduleEntry {
  time: string;
  title: string;
  notes?: string;
}

interface EventScheduleTimelineProps {
  schedule?: ScheduleEntry[];
  language?: 'en' | 'es';
}

export const EventScheduleTimeline: React.FC<EventScheduleTimelineProps> = ({ 
  schedule = [], 
  language = 'en' 
}) => {
  const content = {
    en: {
      noSchedule: 'No schedule defined for this day.',
      open: 'Open'
    },
    es: {
      noSchedule: 'No hay horario definido para este día.',
      open: 'Libre'
    }
  };

  // Generate hourly slots from 8 AM to 8 PM
  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    timeSlots.push(timeStr);
  }

  // Create a map of scheduled items by time
  const scheduleMap = new Map();
  schedule.forEach(item => {
    scheduleMap.set(item.time, item);
  });

  if (schedule.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Clock className="h-5 w-5 mr-2" />
        {content[language].noSchedule}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {timeSlots.map((timeSlot) => {
        const scheduledItem = scheduleMap.get(timeSlot);
        const isScheduled = !!scheduledItem;
        
        return (
          <div key={timeSlot} className="flex items-start gap-4">
            {/* Time column */}
            <div className="w-20 flex-shrink-0 text-right">
              <span className="font-bold text-foreground">
                {parseTimeSlot(timeSlot)}
              </span>
            </div>
            
            {/* Content column */}
            <div className="flex-1">
              {isScheduled ? (
                <Card className="bg-card border border-border">
                  <CardContent className="p-3">
                    <h4 className="font-bold text-foreground mb-1">
                      {scheduledItem.title}
                    </h4>
                    {scheduledItem.notes && (
                      <p className="text-sm text-muted-foreground">
                        {scheduledItem.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="py-3 px-4 text-sm text-muted-foreground border border-dashed border-muted rounded-md">
                  {content[language].open}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};