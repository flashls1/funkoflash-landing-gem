import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plane, Hotel, DollarSign, Users } from 'lucide-react';
import { businessEventsApi, BusinessEvent, TalentProfile } from './data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import FileUpload from '@/components/FileUpload';

interface TalentFinancialData {
  talent_id: string;
  per_diem_amount: string;
  guarantee_amount: string;
  per_diem_currency: string;
  guarantee_currency: string;
}

interface TravelManagementModuleProps {
  language: 'en' | 'es';
}

export default function TravelManagementModule({ language }: TravelManagementModuleProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<BusinessEvent | null>(null);
  const [assignedTalents, setAssignedTalents] = useState<TalentProfile[]>([]);
  const [financialData, setFinancialData] = useState<TalentFinancialData[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    en: {
      title: "Travel & Financial Management",
      description: "Manage travel arrangements and financial details for your events",
      selectEvent: "Select Event",
      noEvents: "No events available",
      assignedTalents: "Assigned Talents",
      noTalents: "No talents assigned to this event",
      flightInfo: "Flight Information",
      hotelInfo: "Hotel Information", 
      financial: "Financial Details",
      perDiem: "Per Diem (Daily)",
      guarantee: "Guarantee Amount",
      currency: "Currency",
      airline: "Airline",
      flightCode: "Flight Confirmation",
      arrival: "Arrival DateTime",
      departure: "Departure DateTime",
      hotelName: "Hotel Name",
      hotelAddress: "Hotel Address",
      checkin: "Check-in Date",
      checkout: "Check-out Date",
      save: "Save Changes",
      saved: "Saved successfully",
      notes: "Notes",
      status: "Status",
      booked: "Booked",
      notBooked: "Not Booked"
    },
    es: {
      title: "Gestión de Viajes y Finanzas",
      description: "Gestiona arreglos de viaje y detalles financieros para tus eventos",
      selectEvent: "Seleccionar Evento",
      noEvents: "No hay eventos disponibles",
      assignedTalents: "Talentos Asignados",
      noTalents: "No hay talentos asignados a este evento",
      flightInfo: "Información de Vuelo",
      hotelInfo: "Información del Hotel",
      financial: "Detalles Financieros",
      perDiem: "Viáticos (Diarios)",
      guarantee: "Monto Garantizado",
      currency: "Moneda",
      airline: "Aerolínea",
      flightCode: "Confirmación de Vuelo",
      arrival: "Fecha/Hora de Llegada",
      departure: "Fecha/Hora de Salida",
      hotelName: "Nombre del Hotel",
      hotelAddress: "Dirección del Hotel",
      checkin: "Fecha de Entrada",
      checkout: "Fecha de Salida",
      save: "Guardar Cambios",
      saved: "Guardado exitosamente",
      notes: "Notas",
      status: "Estado",
      booked: "Reservado",
      notBooked: "No Reservado"
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadEventTalents();
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await businessEventsApi.getEvents();
      setEvents(eventsData);
      if (eventsData.length > 0) {
        setSelectedEvent(eventsData[0]);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventTalents = async () => {
    if (!selectedEvent?.id) return;
    
    try {
      const eventsData = await businessEventsApi.getEvents();
      const currentEvent = eventsData.find(e => e.id === selectedEvent.id);
      
      if (currentEvent) {
        const talents = (currentEvent as any).business_event_talent?.map((bet: any) => ({
          id: bet.talent_profiles.id,
          name: bet.talent_profiles.name,
          per_diem_amount: bet.per_diem_amount || '',
          guarantee_amount: bet.guarantee_amount || '',
          per_diem_currency: bet.per_diem_currency || 'USD',
          guarantee_currency: bet.guarantee_currency || 'USD'
        })) || [];
        
        setAssignedTalents(talents);
        
        // Initialize financial data
        setFinancialData(talents.map((talent: any) => ({
          talent_id: talent.id,
          per_diem_amount: talent.per_diem_amount || '',
          guarantee_amount: talent.guarantee_amount || '',
          per_diem_currency: talent.per_diem_currency || 'USD',
          guarantee_currency: talent.guarantee_currency || 'USD'
        })));
      }
    } catch (error) {
      console.error('Failed to load event talents:', error);
    }
  };

  const updateFinancialData = (talentId: string, field: keyof TalentFinancialData, value: string) => {
    setFinancialData(prev => {
      const existing = prev.find(f => f.talent_id === talentId);
      if (existing) {
        return prev.map(f => 
          f.talent_id === talentId ? { ...f, [field]: value } : f
        );
      } else {
        return [...prev, {
          talent_id: talentId,
          per_diem_amount: '',
          guarantee_amount: '',
          per_diem_currency: 'USD',
          guarantee_currency: 'USD',
          [field]: value
        }];
      }
    });
  };

  const saveFinancialData = async (talentId: string) => {
    if (!selectedEvent?.id) return;
    
    try {
      const data = financialData.find(f => f.talent_id === talentId);
      if (!data) return;

      // Update the business_event_talent table with financial data
      await businessEventsApi.updateTalentFinancials(selectedEvent.id, talentId, {
        per_diem_amount: data.per_diem_amount ? parseFloat(data.per_diem_amount) : null,
        guarantee_amount: data.guarantee_amount ? parseFloat(data.guarantee_amount) : null,
        per_diem_currency: data.per_diem_currency,
        guarantee_currency: data.guarantee_currency
      });

      toast({
        title: t[language].saved,
        description: t[language].financial
      });
    } catch (error) {
      console.error('Failed to save financial data:', error);
      toast({
        title: "Error",
        description: "Failed to save financial data",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          {t[language].title}
        </CardTitle>
        <CardDescription>
          {t[language].description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Selection */}
        <div className="space-y-2">
          <Label>{t[language].selectEvent}</Label>
          <Select
            value={selectedEvent?.id || ''}
            onValueChange={(value) => {
              const event = events.find(e => e.id === value);
              setSelectedEvent(event || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t[language].selectEvent} />
            </SelectTrigger>
            <SelectContent className="bg-background border z-[100]">
              {events.length > 0 ? (
                events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {event.city}, {event.state}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  {t[language].noEvents}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedEvent && (
          <>
            <Separator />
            
            {/* Talents Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <h3 className="text-lg font-medium">{t[language].assignedTalents}</h3>
                <Badge variant="secondary">{assignedTalents.length}</Badge>
              </div>

              {assignedTalents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t[language].noTalents}
                </p>
              ) : (
                <div className="space-y-4">
                  {assignedTalents.slice(0, 5).map((talent) => {
                    const financialInfo = financialData.find(f => f.talent_id === talent.id);
                    
                    return (
                      <Card key={talent.id} className="border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{talent.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="financial" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="financial" className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {t[language].financial}
                              </TabsTrigger>
                              <TabsTrigger value="flight" className="flex items-center gap-1">
                                <Plane className="h-3 w-3" />
                                {t[language].flightInfo}
                              </TabsTrigger>
                              <TabsTrigger value="hotel" className="flex items-center gap-1">
                                <Hotel className="h-3 w-3" />
                                {t[language].hotelInfo}
                              </TabsTrigger>
                            </TabsList>

                            {/* Financial Tab */}
                            <TabsContent value="financial" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>{t[language].perDiem}</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder="0.00"
                                      value={financialInfo?.per_diem_amount || ''}
                                      onChange={(e) => updateFinancialData(talent.id, 'per_diem_amount', e.target.value)}
                                    />
                                    <Select
                                      value={financialInfo?.per_diem_currency || 'USD'}
                                      onValueChange={(value) => updateFinancialData(talent.id, 'per_diem_currency', value)}
                                    >
                                      <SelectTrigger className="w-20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                        <SelectItem value="CAD">CAD</SelectItem>
                                        <SelectItem value="MXN">MXN</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>{t[language].guarantee}</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder="0.00"
                                      value={financialInfo?.guarantee_amount || ''}
                                      onChange={(e) => updateFinancialData(talent.id, 'guarantee_amount', e.target.value)}
                                    />
                                    <Select
                                      value={financialInfo?.guarantee_currency || 'USD'}
                                      onValueChange={(value) => updateFinancialData(talent.id, 'guarantee_currency', value)}
                                    >
                                      <SelectTrigger className="w-20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                        <SelectItem value="CAD">CAD</SelectItem>
                                        <SelectItem value="MXN">MXN</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                              
                              <Button onClick={() => saveFinancialData(talent.id)}>
                                {t[language].save}
                              </Button>
                            </TabsContent>

                            {/* Flight Tab - Simplified version for display */}
                            <TabsContent value="flight" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>{t[language].airline}</Label>
                                  <Input placeholder="Enter airline name" />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t[language].flightCode}</Label>
                                  <Input placeholder="Enter confirmation code" />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t[language].arrival}</Label>
                                  <Input type="datetime-local" />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t[language].departure}</Label>
                                  <Input type="datetime-local" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>{t[language].notes}</Label>
                                <Textarea placeholder="Flight notes..." maxLength={50} />
                              </div>
                              <Button>{t[language].save}</Button>
                            </TabsContent>

                            {/* Hotel Tab - Simplified version for display */}
                            <TabsContent value="hotel" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>{t[language].hotelName}</Label>
                                  <Input placeholder="Enter hotel name" />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t[language].hotelAddress}</Label>
                                  <Input placeholder="Enter hotel address" />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t[language].checkin}</Label>
                                  <Input type="date" />
                                </div>
                                <div className="space-y-2">
                                  <Label>{t[language].checkout}</Label>
                                  <Input type="date" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>{t[language].notes}</Label>
                                <Textarea placeholder="Hotel notes..." maxLength={50} />
                              </div>
                              <Button>{t[language].save}</Button>
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}