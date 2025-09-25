import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Plane, 
  Hotel, 
  Car,
  Clock,
  Calendar
} from 'lucide-react';
import { formatDateUS, formatTimeUS } from '@/lib/utils';

const TalentEventTravel = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isMobile = useIsMobile();
  const [event, setEvent] = useState<any>(null);
  const [travelItems, setTravelItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile || profile.role !== 'talent') {
      navigate('/auth');
      return;
    }
    if (eventId) {
      fetchEventAndTravel();
    }
  }, [user, profile, eventId, navigate]);

  const fetchEventAndTravel = async () => {
    if (!eventId || !profile) return;

    try {
      setLoading(true);
      
      // Fetch event details
      const { data: businessEvent, error: eventError } = await supabase
        .from('business_events')
        .select(`
          *,
          business_event_talent!inner(talent_id)
        `)
        .eq('id', eventId)
        .eq('business_event_talent.talent_id', profile.id)
        .single();

      if (eventError) throw eventError;
      setEvent(businessEvent);

      // Fetch travel details
      const { data: transport, error: transportError } = await supabase
        .from('business_event_transport')
        .select('*')
        .eq('event_id', eventId)
        .eq('talent_id', profile.id)
        .order('pickup_datetime', { ascending: true });

      const { data: hotel, error: hotelError } = await supabase
        .from('business_event_hotel')
        .select('*')
        .eq('event_id', eventId)
        .eq('talent_id', profile.id)
        .order('checkin_date', { ascending: true });

      // Combine and sort travel items
      const allTravelItems = [
        ...(transport || []).map((item: any) => ({
          ...item,
          type: 'transport',
          icon: item.provider_type === 'flight' ? Plane : Car,
          datetime: item.pickup_datetime,
          title: `${item.provider_type || 'Transport'} - ${item.pickup_location}`,
          subtitle: item.dropoff_location ? `To: ${item.dropoff_location}` : null,
          details: item.confirmation_code ? `Confirmation: ${item.confirmation_code}` : null
        })),
        ...(hotel || []).map((item: any) => ({
          ...item,
          type: 'hotel',
          icon: Hotel,
          datetime: item.checkin_date,
          title: item.hotel_name || 'Hotel Check-in',
          subtitle: item.hotel_address,
          details: item.confirmation_number ? `Confirmation: ${item.confirmation_number}` : null
        }))
      ].sort((a: any, b: any) => {
        const dateA = new Date(a.datetime);
        const dateB = new Date(b.datetime);
        return dateA.getTime() - dateB.getTime();
      });

      setTravelItems(allTravelItems);
    } catch (error) {
      console.error('Error fetching travel details:', error);
    } finally {
      setLoading(false);
    }
  };

  const content = {
    en: {
      backToSchedule: '← Back to Schedule',
      travel: 'Travel',
      noTravelItems: 'No travel arrangements yet',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      pickup: 'Pickup',
      dropoff: 'Drop-off'
    },
    es: {
      backToSchedule: '← Volver al Horario',
      travel: 'Viaje',
      noTravelItems: 'Aún no hay arreglos de viaje',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      pickup: 'Recogida',
      dropoff: 'Entrega'
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/talent/events/${eventId}/schedule`)}
            className="mb-4 p-0 h-auto text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {content[language].backToSchedule}
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-sky-400 to-blue-500">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">{content[language].travel}</h1>
          </div>
          
          {event && (
            <p className="text-muted-foreground">{event.title}</p>
          )}
        </div>

        {/* Travel Items */}
        {travelItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Plane className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">{content[language].noTravelItems}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {travelItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Card key={`${item.type}-${item.id || index}`} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-sky-400 to-blue-500 p-1">
                      <div className="bg-background p-4 rounded-sm">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-sky-400 to-blue-500 flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1 truncate">{item.title}</h3>
                            
                            {item.subtitle && (
                              <p className="text-sm text-muted-foreground mb-2 truncate">
                                {item.subtitle}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDateUS(item.datetime)}</span>
                              </div>
                              {item.datetime && new Date(item.datetime).getHours() !== 0 && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTimeUS(item.datetime)}</span>
                                </div>
                              )}
                            </div>
                            
                            {item.details && (
                              <p className="text-xs text-muted-foreground">
                                {item.details}
                              </p>
                            )}
                            
                            {item.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.notes}
                              </p>
                            )}
                            
                            {/* Hotel specific details */}
                            {item.type === 'hotel' && (item.checkout_date || item.checkin_date) && (
                              <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                                {item.checkin_date && (
                                  <span>{content[language].checkIn}: {formatDateUS(item.checkin_date)}</span>
                                )}
                                {item.checkout_date && (
                                  <span>{content[language].checkOut}: {formatDateUS(item.checkout_date)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {!isMobile && <Footer language={language} />}
    </div>
  );
};

export default TalentEventTravel;