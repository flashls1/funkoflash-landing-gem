import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PageLayout from '@/components/PageLayout';
import { BusinessEvent, businessEventsApi } from '@/features/business-events/data';

interface TalentBookingManagementProps {
  language?: 'en' | 'es';
}

const TalentBookingManagement = ({ language = 'en' }: TalentBookingManagementProps) => {
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await businessEventsApi.getEvents();
      // Filter events that this talent is assigned to
      const talentEvents = data.filter(event => 
        (event as any).business_event_talent?.some((assignment: any) => 
          assignment.talent_profiles?.some((tp: any) => 
            tp.user_id === profile?.user_id
          )
        )
      );
      setEvents(talentEvents);
    } catch (error) {
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
      backToDashboard: "Back to Dashboard",
      noBookings: "No bookings found",
      noBookingsDesc: "You don't have any event bookings at this time.",
      status: "Status",
      location: "Location",
      date: "Date",
      earnings: "Earnings"
    },
    es: {
      title: "Gestión de Reservas",
      description: "Ver y gestionar tus reservas de eventos",
      backToDashboard: "Volver al Panel",
      noBookings: "No se encontraron reservas",
      noBookingsDesc: "No tienes reservas de eventos en este momento.",
      status: "Estado",
      location: "Ubicación",
      date: "Fecha",
      earnings: "Ganancias"
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
    if (!amount) return 'TBD';
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const talentAssignment = (event as any).business_event_talent?.find((assignment: any) => 
                assignment.talent_profiles?.some((tp: any) => tp.user_id === profile?.user_id)
              );
              
              return (
                <Card key={event.id} className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold">
                        {event.title || 'Untitled Event'}
                      </CardTitle>
                      <Badge className={`${getStatusColor(event.status || 'draft')} text-white`}>
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
                    {/* Date */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(event.start_ts)}
                      </span>
                    </div>

                    {/* Location */}
                    {(event.city || event.state) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {[event.city, event.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Venue */}
                    {event.venue && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Venue:</strong> {event.venue}
                      </div>
                    )}

                    {/* Earnings */}
                    {talentAssignment && (
                      <div className="space-y-2 border-t pt-4">
                        <h4 className="font-semibold text-sm">{t.earnings}</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {talentAssignment.guarantee_amount && (
                            <div>
                              <span className="text-muted-foreground">Guarantee:</span>
                              <div className="font-medium">
                                {formatCurrency(talentAssignment.guarantee_amount, talentAssignment.guarantee_currency)}
                              </div>
                            </div>
                          )}
                          {talentAssignment.per_diem_amount && (
                            <div>
                              <span className="text-muted-foreground">Per Diem:</span>
                              <div className="font-medium">
                                {formatCurrency(talentAssignment.per_diem_amount, talentAssignment.per_diem_currency)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TalentBookingManagement;