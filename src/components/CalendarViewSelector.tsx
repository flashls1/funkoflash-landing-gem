import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, CalendarDays } from 'lucide-react';

interface CalendarViewSelectorProps {
  view: 'month' | 'week' | 'weekend';
  onViewChange: (view: 'month' | 'week' | 'weekend') => void;
  language: 'en' | 'es';
}

export const CalendarViewSelector = ({ view, onViewChange, language }: CalendarViewSelectorProps) => {
  const content = {
    en: {
      month: 'Month',
      week: 'Week', 
      weekend: 'Weekend'
    },
    es: {
      month: 'Mes',
      week: 'Semana',
      weekend: 'Fin de semana'
    }
  };

  const t = content[language];

  return (
    <Tabs value={view} onValueChange={(value) => onViewChange(value as 'month' | 'week' | 'weekend')}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="month" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">{t.month}</span>
        </TabsTrigger>
        <TabsTrigger value="week" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">{t.week}</span>
        </TabsTrigger>
        <TabsTrigger value="weekend" className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span className="hidden sm:inline">{t.weekend}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};