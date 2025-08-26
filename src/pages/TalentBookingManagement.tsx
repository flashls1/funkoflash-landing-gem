import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, MapPin, Clock, DollarSign, Plane, Hotel, Car, Phone, User, FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import PageLayout from '@/components/PageLayout';
import { BusinessEvent, businessEventsApi } from '@/features/business-events/data';
import { supabase } from '@/integrations/supabase/client';

interface EventWithDetails extends BusinessEvent {
  business_event_talent?: any[];
  business_event_travel?: any[];
  business_event_hotel?: any[];
  business_event_transport?: any[];
  business_event_contact?: any[];
}

const TalentBookingManagement = () => {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Get the talent profile ID for the current user
      const { data: talentProfile } = await supabase
        .from('talent_profiles')
        .select('id')
        .eq('user_id', profile?.user_id)
        .single();

      if (!talentProfile) {
        setEvents([]);
        return;
      }

      // Get business events assigned to the talent
      const { data: eventsData, error } = await supabase
        .from('business_events')
        .select(`
          *,
          business_event_talent!inner(
            talent_id,
            per_diem_amount,
            guarantee_amount,
            per_diem_currency,
            guarantee_currency
          )
        `)
        .eq('business_event_talent.talent_id', talentProfile.id)
        .order('start_ts', { ascending: true });

      if (error) throw error;

      // Get related logistics data for each event
      const eventsWithDetails = await Promise.all(
        (eventsData || []).map(async (event) => {
          const [travelData, hotelData, transportData, contactData] = await Promise.all([
            supabase
              .from('business_event_travel')
              .select('*')
              .eq('event_id', event.id)
              .eq('talent_id', talentProfile.id),
            supabase
              .from('business_event_hotel')
              .select('*')
              .eq('event_id', event.id)
              .eq('talent_id', talentProfile.id),
            supabase
              .from('business_event_transport')
              .select('*')
              .eq('event_id', event.id)
              .eq('talent_id', talentProfile.id),
            supabase
              .from('business_event_contact')
              .select('*')
              .eq('event_id', event.id)
          ]);

          return {
            ...event,
            business_event_travel: travelData.data || [],
            business_event_hotel: hotelData.data || [],
            business_event_transport: transportData.data || [],
            business_event_contact: contactData.data || []
          };
        })
      );

      setEvents(eventsWithDetails as EventWithDetails[]);
    } catch (error) {
      console.error('Error loading talent bookings:', error);
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' 
          ? 'Error al cargar las reservas.' 
          : 'Failed to load bookings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const content = {
    en: {
      title: "Booking Management",
      description: "View and manage your event bookings",
      backToDashboard: profile?.role === 'admin' ? "Back to Admin Dashboard" : "Back to Dashboard",
      noBookings: "No bookings found",
      noBookingsDesc: "You don't have any event bookings at this time.",
      status: "Status",
      location: "Location",
      date: "Date",
      earnings: "Earnings",
      travel: "Travel",
      hotel: "Hotel",
      transport: "Transport",
      contact: "Contact",
      overview: "Overview",
      logistics: "Logistics",
      airline: "Airline",
      flightConfirmation: "Flight Confirmation",
      arrival: "Arrival",
      departure: "Departure",
      hotelName: "Hotel",
      hotelAddress: "Address",
      checkin: "Check-in",
      checkout: "Check-out",
      provider: "Provider",
      pickup: "Pickup",
      dropoff: "Drop-off",
      confirmation: "Confirmation",
      contactPerson: "Contact Person",
      phone: "Phone",
      guarantee: "Guarantee",
      perDiem: "Per Diem",
      venue: "Venue",
      notAvailable: "Not available",
      viewDetails: "View Details"
    },
    es: {
      title: "Gestión de Reservas",
      description: "Ver y gestionar tus reservas de eventos",
      backToDashboard: profile?.role === 'admin' ? "Volver al Panel de Administración" : "Volver al Panel",
      noBookings: "No se encontraron reservas",
      noBookingsDesc: "No tienes reservas de eventos en este momento.",
      status: "Estado",
      location: "Ubicación",
      date: "Fecha",
      earnings: "Ganancias",
      travel: "Viaje",
      hotel: "Hotel",
      transport: "Transporte",
      contact: "Contacto",
      overview: "Resumen",
      logistics: "Logística",
      airline: "Aerolínea",
      flightConfirmation: "Confirmación de vuelo",
      arrival: "Llegada",
      departure: "Salida",
      hotelName: "Hotel",
      hotelAddress: "Dirección",
      checkin: "Check-in",
      checkout: "Check-out",
      provider: "Proveedor",
      pickup: "Recogida",
      dropoff: "Destino",
      confirmation: "Confirmación",
      contactPerson: "Persona de contacto",
      phone: "Teléfono",
      guarantee: "Garantía",
      perDiem: "Viáticos",
      venue: "Lugar",
      notAvailable: "No disponible",
      viewDetails: "Ver detalles"
    }
  };

  const t = content[language];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500';
      case 'draft':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null, currency: string = 'USD') => {
    if (!amount) return t.notAvailable;
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return t.notAvailable;
    return new Date(dateString).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderEventCard = (event: EventWithDetails) => {
    const talentAssignment = event.business_event_talent?.[0];
    const travelDetails = event.business_event_travel?.[0];
    const hotelDetails = event.business_event_hotel?.[0];
    const transportDetails = event.business_event_transport?.[0];
    const contactDetails = event.business_event_contact?.[0];

    return (
      <Card key={event.id} className="w-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-bold leading-tight">
              {event.title || t.notAvailable}
            </CardTitle>
            <Badge className={`${getStatusColor(event.status || 'draft')} text-white shrink-0`}>
              {event.status === 'published' 
                ? (language === 'es' ? 'Publicado' : 'Published')
                : event.status === 'draft'
                ? (language === 'es' ? 'Borrador' : 'Draft')
                : event.status === 'cancelled'
                ? (language === 'es' ? 'Cancelado' : 'Cancelled')
                : event.status
              }
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <TabsTrigger value="overview" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                {t.overview}
              </TabsTrigger>
              <TabsTrigger value="logistics" className="text-xs">
                <Car className="h-3 w-3 mr-1" />
                {t.logistics}
              </TabsTrigger>
              {!isMobile && (
                <TabsTrigger value="contact" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  {t.contact}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-3 mt-3">
              {/* Date */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{formatDate(event.start_ts)}</span>
              </div>

              {/* Location */}
              {(event.city || event.state) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{[event.city, event.state].filter(Boolean).join(', ')}</span>
                </div>
              )}

              {/* Venue */}
              {event.venue && (
                <div className="text-sm">
                  <span className="font-medium">{t.venue}:</span> {event.venue}
                </div>
              )}

              {/* Earnings */}
              {talentAssignment && (
                <div className="space-y-2 border-t pt-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {t.earnings}
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {talentAssignment.guarantee_amount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.guarantee}:</span>
                        <span className="font-medium">
                          {formatCurrency(talentAssignment.guarantee_amount, talentAssignment.guarantee_currency)}
                        </span>
                      </div>
                    )}
                    {talentAssignment.per_diem_amount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.perDiem}:</span>
                        <span className="font-medium">
                          {formatCurrency(talentAssignment.per_diem_amount, talentAssignment.per_diem_currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="logistics" className="space-y-4 mt-3">
              {/* Travel */}
              {travelDetails && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    {t.travel}
                  </h4>
                  <div className="text-xs space-y-1 pl-6">
                    {travelDetails.airline_name && (
                      <div><span className="text-muted-foreground">{t.airline}:</span> {travelDetails.airline_name}</div>
                    )}
                    {travelDetails.confirmation_codes && (
                      <div><span className="text-muted-foreground">{t.confirmation}:</span> {travelDetails.confirmation_codes}</div>
                    )}
                    {travelDetails.arrival_datetime && (
                      <div><span className="text-muted-foreground">{t.arrival}:</span> {formatDateTime(travelDetails.arrival_datetime)}</div>
                    )}
                    {travelDetails.departure_datetime && (
                      <div><span className="text-muted-foreground">{t.departure}:</span> {formatDateTime(travelDetails.departure_datetime)}</div>
                    )}
                    {travelDetails.flight_tickets_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(travelDetails.flight_tickets_url, '_blank')}
                        className="h-6 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {t.viewDetails}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Hotel */}
              {hotelDetails && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Hotel className="h-4 w-4" />
                    {t.hotel}
                  </h4>
                  <div className="text-xs space-y-1 pl-6">
                    {hotelDetails.hotel_name && (
                      <div><span className="text-muted-foreground">{t.hotelName}:</span> {hotelDetails.hotel_name}</div>
                    )}
                    {hotelDetails.hotel_address && (
                      <div><span className="text-muted-foreground">{t.hotelAddress}:</span> {hotelDetails.hotel_address}</div>
                    )}
                    {hotelDetails.checkin_date && (
                      <div><span className="text-muted-foreground">{t.checkin}:</span> {formatDate(hotelDetails.checkin_date)}</div>
                    )}
                    {hotelDetails.checkout_date && (
                      <div><span className="text-muted-foreground">{t.checkout}:</span> {formatDate(hotelDetails.checkout_date)}</div>
                    )}
                    {hotelDetails.confirmation_number && (
                      <div><span className="text-muted-foreground">{t.confirmation}:</span> {hotelDetails.confirmation_number}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Transport */}
              {transportDetails && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {t.transport}
                  </h4>
                  <div className="text-xs space-y-1 pl-6">
                    {transportDetails.provider_type && (
                      <div><span className="text-muted-foreground">{t.provider}:</span> {transportDetails.provider_type}</div>
                    )}
                    {transportDetails.pickup_location && (
                      <div><span className="text-muted-foreground">{t.pickup}:</span> {transportDetails.pickup_location}</div>
                    )}
                    {transportDetails.dropoff_location && (
                      <div><span className="text-muted-foreground">{t.dropoff}:</span> {transportDetails.dropoff_location}</div>
                    )}
                    {transportDetails.confirmation_code && (
                      <div><span className="text-muted-foreground">{t.confirmation}:</span> {transportDetails.confirmation_code}</div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {!isMobile && (
              <TabsContent value="contact" className="space-y-3 mt-3">
                {contactDetails ? (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t.contact}
                    </h4>
                    <div className="text-xs space-y-1 pl-6">
                      {contactDetails.contact_name && (
                        <div><span className="text-muted-foreground">{t.contactPerson}:</span> {contactDetails.contact_name}</div>
                      )}
                      {contactDetails.phone_number && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{t.phone}:</span>
                          <a href={`tel:${contactDetails.phone_number}`} className="text-primary hover:underline">
                            {contactDetails.phone_number}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">{t.notAvailable}</div>
                )}
              </TabsContent>
            )}

            {/* Mobile contact info */}
            {isMobile && contactDetails && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t.contact}
                </h4>
                <div className="text-xs space-y-1">
                  {contactDetails.contact_name && (
                    <div><span className="text-muted-foreground">{t.contactPerson}:</span> {contactDetails.contact_name}</div>
                  )}
                  {contactDetails.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <a href={`tel:${contactDetails.phone_number}`} className="text-primary hover:underline">
                        {contactDetails.phone_number}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageLayout language={language}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard/talent')}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToDashboard}
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {t.title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.description}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {language === 'es' ? 'Cargando reservas...' : 'Loading bookings...'}
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t.noBookings}</h3>
            <p className="text-muted-foreground">{t.noBookingsDesc}</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'}`}>
            {events.map(renderEventCard)}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TalentBookingManagement;