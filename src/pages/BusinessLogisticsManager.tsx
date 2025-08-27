import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { useOptimisticConcurrency } from '@/hooks/useOptimisticConcurrency';
import { supabase } from '@/integrations/supabase/client';
import { Plane, Hotel, Car, User, Upload, Download, Save } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

interface BusinessEvent {
  id: string;
  title: string;
  start_ts: string;
  end_ts: string;
  city: string;
  state: string;
  venue: string;
  status: string;
}

interface TalentProfile {
  id: string;
  name: string;
  user_id?: string;
}

interface LogisticsData {
  travel?: any;
  hotel?: any;
  transport?: any;
  contact?: any;
}

interface BusinessLogisticsManagerProps {
  eventId: string;
  onClose: () => void;
}

export default function BusinessLogisticsManager({ eventId, onClose }: BusinessLogisticsManagerProps) {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { handleConflict, checkConcurrency, conflictData, showConflictDialog, resolveConflict } = useOptimisticConcurrency();
  
  const [event, setEvent] = useState<BusinessEvent | null>(null);
  const [assignedTalents, setAssignedTalents] = useState<TalentProfile[]>([]);
  const [logistics, setLogistics] = useState<Record<string, LogisticsData>>({});
  const [eventContact, setEventContact] = useState({ contact_name: '', phone_number: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const content = {
    en: {
      title: "Event Logistics Management",
      contact: "Event Point of Contact",
      contactName: "Contact Name",
      phone: "Phone Number",
      travel: "Travel Details",
      hotel: "Hotel Details",
      transport: "Ground Transportation",
      airline: "Airline",
      flightCode: "Flight Confirmation",
      status: "Status",
      booked: "Booked",
      notBooked: "Not Booked",
      arrival: "Arrival (local)",
      departure: "Departure (local)",
      ticketsUpload: "Upload Flight Tickets",
      hotelName: "Hotel Name",
      hotelAddress: "Hotel Address",
      hotelConf: "Reservation Confirmation",
      checkin: "Check-in Date",
      checkout: "Check-out Date",
      provider: "Provider/Service",
      pickup: "Pickup Location",
      dropoff: "Drop-off Location",
      confirmation: "Confirmation Code",
      notes: "Notes",
      save: "Save",
      close: "Close",
      saved: "Saved successfully",
      error: "Error saving data",
      providers: {
        uber: "Uber",
        lyft: "Lyft",
        taxi: "Taxi",
        carService: "Car Service",
        shuttle: "Shuttle",
        rental: "Rental Car"
      }
    },
    es: {
      title: "Gestión de Logística del Evento",
      contact: "Punto de Contacto del Evento",
      contactName: "Nombre del Contacto",
      phone: "Número de Teléfono",
      travel: "Detalles de Viaje",
      hotel: "Detalles del Hotel",
      transport: "Transporte Terrestre",
      airline: "Aerolínea",
      flightCode: "Confirmación de Vuelo",
      status: "Estado",
      booked: "Reservado",
      notBooked: "No Reservado",
      arrival: "Llegada (hora local)",
      departure: "Salida (hora local)",
      ticketsUpload: "Subir Boletos de Vuelo",
      hotelName: "Nombre del Hotel",
      hotelAddress: "Dirección del Hotel",
      hotelConf: "Confirmación de Reserva",
      checkin: "Fecha de Check-in",
      checkout: "Fecha de Check-out",
      provider: "Proveedor/Servicio",
      pickup: "Ubicación de Recogida",
      dropoff: "Ubicación de Destino",
      confirmation: "Código de Confirmación",
      notes: "Notas",
      save: "Guardar",
      close: "Cerrar",
      saved: "Guardado exitosamente",
      error: "Error al guardar datos",
      providers: {
        uber: "Uber",
        lyft: "Lyft",
        taxi: "Taxi",
        carService: "Servicio de Auto",
        shuttle: "Transporte Compartido",
        rental: "Auto de Alquiler"
      }
    }
  };

  const t = content[language];

  useEffect(() => {
    loadEventData();
    
    // Set up real-time subscriptions
    const channel = supabase
      .channel(`logistics-${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'business_event_travel',
        filter: `event_id=eq.${eventId}`
      }, () => {
        loadEventData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'business_event_hotel',
        filter: `event_id=eq.${eventId}`
      }, () => {
        loadEventData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'business_event_transport',
        filter: `event_id=eq.${eventId}`
      }, () => {
        loadEventData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'business_event_contact',
        filter: `event_id=eq.${eventId}`
      }, () => {
        loadEventData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      
      // Load event details
      const { data: eventData } = await supabase
        .from('business_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventData) {
        setEvent(eventData);
      }

      // Load assigned talents
      const { data: talentsData } = await supabase
        .from('business_event_talent')
        .select(`
          talent_id,
          talent_profiles!inner(id, name, user_id)
        `)
        .eq('event_id', eventId);

      const talents = talentsData?.map(t => t.talent_profiles).filter(Boolean) || [];
      setAssignedTalents(talents);

      // Load contact information
      const { data: contactData } = await supabase
        .from('business_event_contact')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (contactData) {
        setEventContact(contactData);
      }

      // Load logistics for each talent
      const logisticsPromises = talents.map(async (talent) => {
        const [travelData, hotelData, transportData] = await Promise.all([
          supabase
            .from('business_event_travel')
            .select('*')
            .eq('event_id', eventId)
            .eq('talent_id', talent.id)
            .maybeSingle(),
          supabase
            .from('business_event_hotel')
            .select('*')
            .eq('event_id', eventId)
            .eq('talent_id', talent.id)
            .maybeSingle(),
          supabase
            .from('business_event_transport')
            .select('*')
            .eq('event_id', eventId)
            .eq('talent_id', talent.id)
            .maybeSingle()
        ]);

        return {
          talentId: talent.id,
          travel: travelData.data,
          hotel: hotelData.data,
          transport: transportData.data
        };
      });

      const logisticsResults = await Promise.all(logisticsPromises);
      const logisticsMap: Record<string, LogisticsData> = {};
      
      logisticsResults.forEach((result) => {
        logisticsMap[result.talentId] = {
          travel: result.travel,
          hotel: result.hotel,
          transport: result.transport
        };
      });

      setLogistics(logisticsMap);
    } catch (error) {
      console.error('Error loading event data:', error);
      toast({
        title: t.error,
        description: 'Failed to load event data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveContactInfo = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('business_event_contact')
        .upsert({
          event_id: eventId,
          contact_name: eventContact.contact_name,
          phone_number: eventContact.phone_number,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: t.saved,
        description: t.contact
      });
    } catch (error) {
      toast({
        title: t.error,
        description: 'Failed to save contact information',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const saveTalentLogistics = async (talentId: string, section: 'travel' | 'hotel' | 'transport') => {
    try {
      setSaving(true);
      
      const data = logistics[talentId]?.[section];
      if (!data) return;

      const tableNames = {
        travel: 'business_event_travel' as const,
        hotel: 'business_event_hotel' as const,
        transport: 'business_event_transport' as const
      };

      const tableName = tableNames[section];

      const { error } = await supabase
        .from(tableName)
        .upsert({
          ...data,
          event_id: eventId,
          talent_id: talentId,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: t.saved,
        description: t[section]
      });
    } catch (error) {
      toast({
        title: t.error,
        description: `Failed to save ${section} details`,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateLogistics = (talentId: string, section: 'travel' | 'hotel' | 'transport', field: string, value: any) => {
    setLogistics(prev => ({
      ...prev,
      [talentId]: {
        ...prev[talentId],
        [section]: {
          ...prev[talentId]?.[section],
          [field]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          {event && (
            <p className="text-muted-foreground">
              {event.title} - {event.venue}, {event.city}, {event.state}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={onClose}>
          {t.close}
        </Button>
      </div>

      {/* Event Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t.contact}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact-name">{t.contactName}</Label>
              <Input
                id="contact-name"
                value={eventContact.contact_name}
                onChange={(e) => setEventContact(prev => ({ ...prev, contact_name: e.target.value }))}
                placeholder={t.contactName}
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">{t.phone}</Label>
              <Input
                id="contact-phone"
                value={eventContact.phone_number}
                onChange={(e) => setEventContact(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder={t.phone}
              />
            </div>
          </div>
          <Button onClick={saveContactInfo} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {t.save}
          </Button>
        </CardContent>
      </Card>

      {/* Talent Logistics */}
      {assignedTalents.map(talent => {
        const talentLogistics = logistics[talent.id] || {};
        
        return (
          <Card key={talent.id}>
            <CardHeader>
              <CardTitle>{talent.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="travel">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="travel" className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    {t.travel}
                  </TabsTrigger>
                  <TabsTrigger value="hotel" className="flex items-center gap-2">
                    <Hotel className="h-4 w-4" />
                    {t.hotel}
                  </TabsTrigger>
                  <TabsTrigger value="transport" className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {t.transport}
                  </TabsTrigger>
                </TabsList>

                {/* Travel Tab */}
                <TabsContent value="travel" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t.airline}</Label>
                      <Input
                        value={talentLogistics.travel?.airline_name || ''}
                        onChange={(e) => updateLogistics(talent.id, 'travel', 'airline_name', e.target.value)}
                        placeholder={t.airline}
                      />
                    </div>
                    <div>
                      <Label>{t.flightCode}</Label>
                      <Input
                        value={talentLogistics.travel?.confirmation_codes || ''}
                        onChange={(e) => updateLogistics(talent.id, 'travel', 'confirmation_codes', e.target.value)}
                        placeholder={t.flightCode}
                      />
                    </div>
                    <div>
                      <Label>{t.arrival}</Label>
                      <Input
                        type="datetime-local"
                        value={talentLogistics.travel?.arrival_datetime ? new Date(talentLogistics.travel.arrival_datetime).toISOString().slice(0, 16) : ''}
                        onChange={(e) => updateLogistics(talent.id, 'travel', 'arrival_datetime', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>{t.departure}</Label>
                      <Input
                        type="datetime-local"
                        value={talentLogistics.travel?.departure_datetime ? new Date(talentLogistics.travel.departure_datetime).toISOString().slice(0, 16) : ''}
                        onChange={(e) => updateLogistics(talent.id, 'travel', 'departure_datetime', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t.notes}</Label>
                    <Textarea
                      value={talentLogistics.travel?.notes || ''}
                      onChange={(e) => updateLogistics(talent.id, 'travel', 'notes', e.target.value)}
                      placeholder={t.notes}
                    />
                  </div>
                  <Button onClick={() => saveTalentLogistics(talent.id, 'travel')} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {t.save}
                  </Button>
                </TabsContent>

                {/* Hotel Tab */}
                <TabsContent value="hotel" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t.hotelName}</Label>
                      <Input
                        value={talentLogistics.hotel?.hotel_name || ''}
                        onChange={(e) => updateLogistics(talent.id, 'hotel', 'hotel_name', e.target.value)}
                        placeholder={t.hotelName}
                      />
                    </div>
                    <div>
                      <Label>{t.hotelConf}</Label>
                      <Input
                        value={talentLogistics.hotel?.confirmation_number || ''}
                        onChange={(e) => updateLogistics(talent.id, 'hotel', 'confirmation_number', e.target.value)}
                        placeholder={t.hotelConf}
                      />
                    </div>
                    <div>
                      <Label>{t.checkin}</Label>
                      <Input
                        type="date"
                        value={talentLogistics.hotel?.checkin_date || ''}
                        onChange={(e) => updateLogistics(talent.id, 'hotel', 'checkin_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>{t.checkout}</Label>
                      <Input
                        type="date"
                        value={talentLogistics.hotel?.checkout_date || ''}
                        onChange={(e) => updateLogistics(talent.id, 'hotel', 'checkout_date', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t.hotelAddress}</Label>
                    <Textarea
                      value={talentLogistics.hotel?.hotel_address || ''}
                      onChange={(e) => updateLogistics(talent.id, 'hotel', 'hotel_address', e.target.value)}
                      placeholder={t.hotelAddress}
                    />
                  </div>
                  <Button onClick={() => saveTalentLogistics(talent.id, 'hotel')} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {t.save}
                  </Button>
                </TabsContent>

                {/* Transport Tab */}
                <TabsContent value="transport" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t.provider}</Label>
                      <Select
                        value={talentLogistics.transport?.provider_type || ''}
                        onValueChange={(value) => updateLogistics(talent.id, 'transport', 'provider_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t.provider} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uber">{t.providers.uber}</SelectItem>
                          <SelectItem value="lyft">{t.providers.lyft}</SelectItem>
                          <SelectItem value="taxi">{t.providers.taxi}</SelectItem>
                          <SelectItem value="carService">{t.providers.carService}</SelectItem>
                          <SelectItem value="shuttle">{t.providers.shuttle}</SelectItem>
                          <SelectItem value="rental">{t.providers.rental}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t.confirmation}</Label>
                      <Input
                        value={talentLogistics.transport?.confirmation_code || ''}
                        onChange={(e) => updateLogistics(talent.id, 'transport', 'confirmation_code', e.target.value)}
                        placeholder={t.confirmation}
                      />
                    </div>
                    <div>
                      <Label>{t.pickup}</Label>
                      <Input
                        value={talentLogistics.transport?.pickup_location || ''}
                        onChange={(e) => updateLogistics(talent.id, 'transport', 'pickup_location', e.target.value)}
                        placeholder={t.pickup}
                      />
                    </div>
                    <div>
                      <Label>{t.dropoff}</Label>
                      <Input
                        value={talentLogistics.transport?.dropoff_location || ''}
                        onChange={(e) => updateLogistics(talent.id, 'transport', 'dropoff_location', e.target.value)}
                        placeholder={t.dropoff}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t.notes}</Label>
                    <Textarea
                      value={talentLogistics.transport?.notes || ''}
                      onChange={(e) => updateLogistics(talent.id, 'transport', 'notes', e.target.value)}
                      placeholder={t.notes}
                    />
                  </div>
                  <Button onClick={() => saveTalentLogistics(talent.id, 'transport')} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {t.save}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}