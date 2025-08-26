import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CalendarStatusBadgeProps {
  status: 'available' | 'hold' | 'tentative' | 'booked' | 'cancelled' | 'not_available';
  title?: string;
  className?: string;
}

export const CalendarStatusBadge = ({ status, title, className }: CalendarStatusBadgeProps) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-status-available hover:bg-status-available/90 text-white border-0';
      case 'hold':
        return 'bg-status-hold hover:bg-status-hold/90 text-white border-0';
      case 'tentative':
        return 'bg-status-tentative hover:bg-status-tentative/90 text-black border-0';
      case 'booked':
        return 'bg-status-booked hover:bg-status-booked/90 text-white border-0';
      case 'cancelled':
        return 'bg-status-cancelled hover:bg-status-cancelled/90 text-white border-0 line-through';
      case 'not_available':
        return 'bg-status-not-available hover:bg-status-not-available/90 text-white border-0';
      default:
        return 'bg-muted text-muted-foreground border-0';
    }
  };

  return (
    <Badge 
      className={cn(
        getStatusStyles(status),
        status === 'cancelled' && 'line-through',
        className
      )}
    >
      {title && (
        <span className={cn(status === 'cancelled' && 'line-through')}>
          {title}
        </span>
      )}
    </Badge>
  );
};