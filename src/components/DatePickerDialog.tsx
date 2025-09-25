import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface DatePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  currentDate?: Date;
  eventStartDate?: Date;
  eventEndDate?: Date;
  language?: 'en' | 'es';
}

export const DatePickerDialog: React.FC<DatePickerDialogProps> = ({
  isOpen,
  onClose,
  onDateSelect,
  currentDate,
  eventStartDate,
  eventEndDate,
  language = 'en'
}) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(currentDate);

  React.useEffect(() => {
    setSelectedDate(currentDate);
  }, [currentDate, isOpen]);

  const handleSelect = () => {
    if (selectedDate) {
      onDateSelect(selectedDate);
      onClose();
    }
  };

  const isDateDisabled = (date: Date) => {
    if (eventStartDate && date < eventStartDate) return true;
    if (eventEndDate && date > eventEndDate) return true;
    return false;
  };

  const content = {
    en: {
      selectDate: 'Select Date',
      cancel: 'Cancel',
      confirm: 'Confirm',
      selectDateForSchedule: 'Select a date for the schedule entries'
    },
    es: {
      selectDate: 'Seleccionar Fecha',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      selectDateForSchedule: 'Selecciona una fecha para las entradas del horario'
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{content[language].selectDate}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {content[language].selectDateForSchedule}
          </p>
          
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={isDateDisabled}
            initialFocus
            className="pointer-events-auto"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {content[language].cancel}
          </Button>
          <Button onClick={handleSelect} disabled={!selectedDate}>
            {content[language].confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};