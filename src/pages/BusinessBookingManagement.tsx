import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import PageLayout from '@/components/PageLayout';

interface BusinessEventBooking {
  id: string;
  title: string;
  start_ts: string;
  end_ts: string;
  venue?: string;
  city?: string;
  state?: string;
  country?: string;
  status: string;
  talent_count: number;
  talent_names: string[];
  daily_schedule?: any;
}

const BusinessBookingManagement = () => {
  const [events, setEvents] = useState<BusinessEventBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const content = {
    en: {
      title: 'Business Booking Management',
      subtitle: 'Manage your business events and bookings',
      backToDashboard: 'Back to Dashboard',
      noBookings: 'No business events found',
      noBookingsDesc: 'You haven\'t created any business events yet.',
      createEvent: 'Create New Event',
      viewDetails: 'View Details',
      status: 'Status',
      talents: 'Talents',
      venue: 'Venue',
      dates: 'Dates',
      loading: 'Loading your business events...',
      draft: 'Draft',
      published: 'Published',
      cancelled: 'Cancelled'
    },
    es: {
      title: 'Gestión de Reservas Empresariales',
      subtitle: 'Gestiona tus eventos empresariales y reservas',
      backToDashboard: 'Volver al Panel',
      noBookings: 'No se encontraron eventos empresariales',
      noBookingsDesc: 'Aún no has creado ningún evento empresarial.',
      createEvent: 'Crear Nuevo Evento',
      viewDetails: 'Ver Detalles',
      status: 'Estado',
      talents: 'Talentos',
      venue: 'Lugar',
      dates: 'Fechas',
      loading: 'Cargando tus eventos empresariales...',
      draft: 'Borrador',
      published: 'Publicado',
      cancelled: 'Cancelado'
    }
  };

  const t = content[language];

  useEffect(() => {
    if (user && profile) {
      loadEvents();
    }
  }, [user, profile]);

  const loadEvents = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);

      // Use standardized business account lookup
      const { data: businessAccountId } = await supabase
        .rpc('get_business_account_for_user', { p_user_id: user.id });

      if (!businessAccountId) {
        console.log('No business account found for user:', user.id);
        setEvents([]);
        return;
      }

      // Get event IDs from business_event_account table
      const { data: eventIds } = await supabase
        .from('business_event_account')
        .select('event_id')
        .eq('business_account_id', businessAccountId);

      if (!eventIds || eventIds.length === 0) {
        setEvents([]);
        return;
      }

      // Get business events with talent assignments
      const { data: businessEvents, error } = await supabase
        .from('business_events')
        .select(`
          *,
          business_event_talent(
            talent_id,
            talent_profiles(name)
          )
        `)
        .in('id', eventIds.map(item => item.event_id))
        .order('start_ts', { ascending: true });

      if (error) throw error;

      // Transform the data
      const transformedEvents: BusinessEventBooking[] = businessEvents.map(event => ({
        id: event.id,
        title: event.title || 'Untitled Event',
        start_ts: event.start_ts || '',
        end_ts: event.end_ts || '',
        venue: event.venue,
        city: event.city,
        state: event.state,
        country: event.country,
        status: event.status || 'draft',
        talent_count: event.business_event_talent?.length || 0,
        talent_names: event.business_event_talent?.map((t: any) => t.talent_profiles?.name).filter(Boolean) || [],
        daily_schedule: event.daily_schedule
      }));

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error loading business events:', error);
      toast({
        title: language === 'en' ? 'Error' : 'Error',
        description: language === 'en' ? 'Failed to load business events' : 'Error al cargar eventos empresariales',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLocation = (event: BusinessEventBooking): string => {
    const parts = [event.venue, event.city, event.state, event.country].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/business')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToDashboard}
          </Button>
          
          <div>
            <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
            <p className="text-muted-foreground text-lg">{t.subtitle}</p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t.loading}</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t.noBookings}</h3>
                <p className="text-muted-foreground mb-6">{t.noBookingsDesc}</p>
                <Button 
                  onClick={() => navigate('/business/events')}
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  {t.createEvent}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {events.map(event => (
              <Card key={event.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.start_ts)}
                          {event.end_ts && event.end_ts !== event.start_ts && (
                            <span> - {formatDate(event.end_ts)}</span>
                          )}
                        </div>
                        {formatLocation(event) && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {formatLocation(event)}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(event.status)}>
                      {t[event.status as keyof typeof t] || event.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {event.talent_count} {t.talents}
                        </span>
                        {event.talent_names.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({event.talent_names.slice(0, 2).join(', ')}
                            {event.talent_names.length > 2 && ` +${event.talent_names.length - 2}`})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/business/events/${event.id}`)}
                    >
                      {t.viewDetails}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default BusinessBookingManagement;