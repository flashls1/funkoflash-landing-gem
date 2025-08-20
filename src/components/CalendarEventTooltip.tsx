import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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

interface CalendarEventTooltipProps {
  event: CalendarEvent;
  language: 'en' | 'es';
  children: React.ReactNode;
}

export const CalendarEventTooltip = ({ event, language, children }: CalendarEventTooltipProps) => {
  const statusLabels = {
    en: {
      available: 'Available',
      hold: 'Hold', 
      tentative: 'Tentative',
      booked: 'Booked',
      cancelled: 'Cancelled',
      not_available: 'Not Available'
    },
    es: {
      available: 'Disponible',
      hold: 'Apartado',
      tentative: 'Tentativo', 
      booked: 'Confirmado',
      cancelled: 'Cancelado',
      not_available: 'No disponible'
    }
  };

  const formatDateRange = () => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    if (event.all_day) {
      if (event.start_date === event.end_date) {
        return format(startDate, 'MMM d, yyyy');
      }
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    } else {
      const startTime = event.start_time || '00:00';
      const endTime = event.end_time || '23:59';
      if (event.start_date === event.end_date) {
        return `${format(startDate, 'MMM d, yyyy')} ${startTime} - ${endTime}`;
      }
      return `${format(startDate, 'MMM d, yyyy')} ${startTime} - ${format(endDate, 'MMM d, yyyy')} ${endTime}`;
    }
  };

  const getLocation = () => {
    const parts = [event.location_city, event.location_state].filter(Boolean);
    return parts.join(', ');
  };

  const truncateNotes = (notes: string, maxLength: number = 120) => {
    if (notes.length <= maxLength) return notes;
    return notes.substring(0, maxLength) + '...';
  };

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" side="top">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm leading-tight">{event.event_title}</h4>
            <Badge 
              className={`
                ${event.status === 'available' ? 'bg-status-available hover:bg-status-available/90 text-white' : ''}
                ${event.status === 'hold' ? 'bg-status-hold hover:bg-status-hold/90 text-white' : ''}
                ${event.status === 'tentative' ? 'bg-status-tentative hover:bg-status-tentative/90 text-black' : ''}
                ${event.status === 'booked' ? 'bg-status-booked hover:bg-status-booked/90 text-white' : ''}
                ${event.status === 'cancelled' ? 'bg-status-cancelled hover:bg-status-cancelled/90 text-white line-through' : ''}
                ${event.status === 'not_available' ? 'bg-status-not-available hover:bg-status-not-available/90 text-white' : ''}
                border-0 text-xs
              `}
            >
              {statusLabels[language][event.status]}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {formatDateRange()}
          </div>
          
          {getLocation() && (
            <div className="text-sm text-muted-foreground">
              📍 {getLocation()}
            </div>
          )}
          
          {event.notes_public && (
            <div className="text-sm text-muted-foreground">
              {truncateNotes(event.notes_public)}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};