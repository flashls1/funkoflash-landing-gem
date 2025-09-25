import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, MapPin, Globe, Plane, Hotel, User, Clock } from 'lucide-react';
import { formatDateUS, formatTimeUS } from '@/lib/utils';
import { EventScheduleTimeline } from './EventScheduleTimeline';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  language?: 'en' | 'es';
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  language = 'en'
}) => {
  const [activeTab, setActiveTab] = useState('info');

  const content = {
    en: {
      eventInfo: 'Event Info',
      eventSchedule: 'Event Schedule',
      travel: 'Travel',
      reserved: 'Reserved',
      comingSoon: 'Coming Soon',
      eventDetails: 'Event Details',
      location: 'Location',
      website: 'Website',
      status: 'Status',
      dates: 'Dates',
      noSchedule: 'No schedule available for this event.',
      travelInfo: 'Travel & Logistics',
      noTravelInfo: 'No travel information available.',
      reservedPlaceholder: 'Reserved features will be available soon.'
    },
    es: {
      eventInfo: 'Info del Evento',
      eventSchedule: 'Horario del Evento',
      travel: 'Viaje',
      reserved: 'Reservado',
      comingSoon: 'Próximamente',
      eventDetails: 'Detalles del Evento',
      location: 'Ubicación',
      website: 'Sitio Web',
      status: 'Estado',
      dates: 'Fechas',
      noSchedule: 'No hay horario disponible para este evento.',
      travelInfo: 'Viaje y Logística',
      noTravelInfo: 'No hay información de viaje disponible.',
      reservedPlaceholder: 'Las funciones reservadas estarán disponibles pronto.'
    }
  };

  if (!event) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Extract schedule for current day or first available day
  const getDailySchedule = () => {
    if (!event.daily_schedule || !Array.isArray(event.daily_schedule)) {
      return [];
    }
    
    // For now, show the first day's schedule
    const firstDay = event.daily_schedule[0];
    return firstDay?.schedule || [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {event.title || event.event_title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">{content[language].eventInfo}</TabsTrigger>
            <TabsTrigger value="schedule">{content[language].eventSchedule}</TabsTrigger>
            <TabsTrigger value="travel">{content[language].travel}</TabsTrigger>
            <TabsTrigger value="reserved">{content[language].reserved}</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {content[language].eventDetails}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {content[language].dates}
                      </h4>
                      <p className="text-sm">
                        {event.start_ts && formatDateUS(event.start_ts)}
                        {event.end_ts && event.start_ts !== event.end_ts && 
                          ` - ${formatDateUS(event.end_ts)}`
                        }
                      </p>
                      {event.start_ts && (
                        <p className="text-sm text-muted-foreground">
                          {formatTimeUS(event.start_ts)}
                          {event.end_ts && ` - ${formatTimeUS(event.end_ts)}`}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">
                        {content[language].status}
                      </h4>
                      <Badge className={`${getStatusColor(event.status)} text-white`}>
                        {event.status || 'Draft'}
                      </Badge>
                    </div>
                  </div>

                  {(event.city || event.venue) && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {content[language].location}
                      </h4>
                      <p className="text-sm">
                        {event.venue && `${event.venue}, `}
                        {event.city && `${event.city}`}
                        {event.state && `, ${event.state}`}
                        {event.country && ` ${event.country}`}
                      </p>
                      {event.address_line && (
                        <p className="text-sm text-muted-foreground">
                          {event.address_line}
                        </p>
                      )}
                    </div>
                  )}

                  {event.website && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {content[language].website}
                      </h4>
                      <a 
                        href={event.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {event.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{content[language].eventSchedule}</CardTitle>
                  <CardDescription>
                    Daily timeline view (8:00 AM - 8:00 PM)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EventScheduleTimeline 
                    schedule={getDailySchedule()} 
                    language={language}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="travel" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5" />
                    {content[language].travelInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    {content[language].noTravelInfo}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reserved" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{content[language].reserved}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="mb-4">
                      <User className="h-12 w-12 mx-auto opacity-50" />
                    </div>
                    <p>{content[language].reservedPlaceholder}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};