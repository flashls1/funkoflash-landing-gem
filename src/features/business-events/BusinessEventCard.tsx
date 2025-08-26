import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPinIcon, UsersIcon, EditIcon, TrashIcon, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { BusinessEvent } from './data';

interface BusinessEventCardProps {
  event: BusinessEvent;
  onEdit: (event: BusinessEvent) => void;
  onDelete: (eventId: string) => void;
  canEdit?: boolean;
  language?: 'en' | 'es';
}

const BusinessEventCard = ({ 
  event, 
  onEdit, 
  onDelete, 
  canEdit = false,
  language = 'en' 
}: BusinessEventCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      // Handle date-only strings with proper UTC parsing to avoid timezone shifts
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(dateString + 'T12:00:00.000Z');
        return format(date, 'MMM dd, yyyy');
      }
      // Handle full datetime strings
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return null;
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return null;
    }
  };

  const heroImageUrl = event.hero_logo_path && !imageError
    ? `https://gytjgmeoepglbrjrbfie.supabase.co/storage/v1/object/public/business-events/${event.hero_logo_path}`
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Hero Image */}
      {heroImageUrl && (
        <div className="aspect-[16/9] w-full overflow-hidden">
          <img
            src={heroImageUrl}
            alt={event.title || (language === 'es' ? 'Evento sin título' : 'Untitled Event')}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg leading-tight">
            {event.title || (language === 'es' ? 'Evento sin título' : 'Untitled Event')}
          </h3>
          <Badge className={getStatusColor(event.status)}>
            {event.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {/* Date and Time - Show daily schedule if available */}
        {(() => {
          const eventWithSchedule = event as any;
          const hasSchedule = eventWithSchedule.daily_schedule && Array.isArray(eventWithSchedule.daily_schedule) && eventWithSchedule.daily_schedule.length > 0;
          
          if (hasSchedule) {
            return (
              <div className="space-y-1">
                {eventWithSchedule.daily_schedule.map((dayData: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      <strong>Day {dayData.day}:</strong> {formatDate(dayData.date)}
                      {dayData.start_time && dayData.end_time && (
                        <span className="ml-1">({dayData.start_time} - {dayData.end_time})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            );
          }
          
          // Fallback to start_ts/end_ts if no daily schedule
          if (event.start_ts || event.end_ts) {
            return (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {formatDate(event.start_ts)}
                  {event.start_ts && formatTime(event.start_ts) && (
                    <span className="ml-1">at {formatTime(event.start_ts)}</span>
                  )}
                  {event.end_ts && event.end_ts !== event.start_ts && (
                    <span> - {formatDate(event.end_ts)}
                    {formatTime(event.end_ts) && (
                      <span className="ml-1">at {formatTime(event.end_ts)}</span>
                    )}
                    </span>
                  )}
                </span>
              </div>
            );
          }
          
          return null;
        })()}

        {/* Location */}
        {(event.city || event.state || event.address_line) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="h-4 w-4" />
            <span>
              {event.address_line && <span>{event.address_line}, </span>}
              {event.city && <span>{event.city}</span>}
              {event.state && <span>, {event.state}</span>}
              {event.country && event.country !== 'USA' && <span>, {event.country}</span>}
            </span>
          </div>
        )}

        {/* Website */}
        {event.website && (
          <div className="text-sm">
            <a 
              href={event.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {event.website}
            </a>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/admin/business-events/${event.id}`)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          {language === 'es' ? 'Ver detalles' : 'View Details'}
        </Button>
        
        {canEdit && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit(event)}
            >
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(event.id)}
              className="text-destructive hover:text-destructive"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default BusinessEventCard;