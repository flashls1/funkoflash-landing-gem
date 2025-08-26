import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { useColorTheme } from '@/hooks/useColorTheme';

interface CalendarWidgetProps {
  language: 'en' | 'es';
}

export const CalendarWidget = ({ language }: CalendarWidgetProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { currentTheme } = useColorTheme();
  const navigate = useNavigate();

  const content = {
    en: {
      calendar: 'Calendar',
      addEvent: 'Add Event',
      viewFull: 'View Full Calendar',
      monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      dayNames: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    },
    es: {
      calendar: 'Calendario',
      addEvent: 'Agregar Evento',
      viewFull: 'Ver Calendario Completo',
      monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      dayNames: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
    }
  };

  const t = content[language];

  const handleAddEvent = () => {
    navigate('/calendar?action=add');
  };

  const handleViewFull = () => {
    navigate('/calendar');
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days - NO dependency on events
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <Card 
      className="h-full border-2 hover:border-primary/50 transition-colors"
      style={{
        backgroundColor: currentTheme.cardBackground,
        borderColor: currentTheme.border,
        color: currentTheme.cardForeground
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: currentTheme.accent }} />
            {t.calendar}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="business"
              size="sm"
              onClick={handleAddEvent}
              className="h-7 px-2"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewFull}
              className="h-7 px-2"
              style={{ color: currentTheme.accent }}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            className="h-6 w-6 p-0"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          
          <h3 className="text-sm font-medium">
            {t.monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="h-6 w-6 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-1">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1">
            {t.dayNames.map((day) => (
              <div key={day} className="text-xs text-muted-foreground text-center py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              
              return (
                <div
                  key={index}
                  className={cn(
                    "relative h-8 text-xs text-center flex items-center justify-center rounded",
                    "hover:bg-accent cursor-pointer transition-colors",
                    isTodayDate && "bg-primary text-primary-foreground font-medium",
                    !isCurrentMonth && "text-muted-foreground/50"
                  )}
                  onClick={() => navigate('/calendar', { state: { selectedDate: day } })}
                >
                  <span>{format(day, 'd')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="h-6 text-xs"
          >
            Today
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};