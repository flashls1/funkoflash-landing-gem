import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, User, Plane, Hotel, Car } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

interface TalentProfile {
  id: string;
  name: string;
  user_id?: string;
}

interface TravelHotelSectionProps {
  eventId: string;
  assignedTalents: TalentProfile[];
  language: 'en' | 'es';
}

export default function TravelHotelSection({ eventId, assignedTalents, language }: TravelHotelSectionProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [eventContact, setEventContact] = useState({ contact_name: '', phone_number: '' });
  const [travelDetails, setTravelDetails] = useState<any[]>([]);
  const [hotelDetails, setHotelDetails] = useState<any[]>([]);
  const [transportDetails, setTransportDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    en: {
      contact: "Event Point of Contact",
      contactName: "Contact Name",
      phone: "Phone Number",
      travel: "Travel Details",
      hotel: "Hotel Details",
      transport: "Ground Transportation",
      airline: "Airline",
      flightCode: "Flight confirmation",
      status: "Status",
      booked: "Booked",
      notBooked: "Not Booked",
      arrival: "Arrival (local)",
      departure: "Departure (local)",
      ticketsUpload: "Upload flight tickets",
      ticketsDownload: "Download flight tickets",
      notes: "Notes (max 50 chars)",
      hotelName: "Hotel name",
      hotelAddress: "Hotel address",
      hotelConf: "Reservation confirmation",
      checkin: "Check-in (local)",
      checkout: "Check-out (local)",
      provider: "Provider/Service",
      providerOther: "Other (enter provider)",
      pickup: "Pickup",
      dropoff: "Dropoff",
      save: "Save",
      saved: "Saved successfully",
      max25: "Maximum 25 characters",
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
      travel: "Detalles de viaje",
      hotel: "Detalles del hotel",
      airline: "Aerolínea",
      flightCode: "Código de confirmación",
      status: "Estado",
      booked: "Reservado",
      notBooked: "No reservado",
      arrival: "Llegada (hora local)",
      departure: "Salida (hora local)",
      ticketsUpload: "Subir boletos",
      ticketsDownload: "Descargar boletos",
      notes: "Notas (máx. 50 caracteres)",
      hotelName: "Nombre del hotel",
      hotelAddress: "Dirección del hotel",
      hotelConf: "Confirmación de reserva",
      checkin: "Check-in (hora local)",
      checkout: "Check-out (hora local)",
      save: "Guardar",
      saved: "Guardado exitosamente"
    }
  };

  const isOwnTalent = (talentId: string) => {
    return assignedTalents.some(talent => 
      talent.id === talentId && 
      profile?.role === 'talent'
    );
  };

  const canEdit = (talentId: string) => {
    return profile?.role === 'admin' || 
           profile?.role === 'staff' || 
           profile?.role === 'business' || 
           isOwnTalent(talentId);
  };

  const shouldShowTalent = (talentId: string) => {
    if (profile?.role === 'talent') {
      return isOwnTalent(talentId);
    }
    return true; // Admin, staff, business see all
  };

  useEffect(() => {
    loadTravelHotelData();
  }, [eventId]);

  const loadTravelHotelData = async () => {
    try {
      setLoading(true);
      
      // Load contact data
      const { data: contactData } = await supabase
        .from('business_event_contact')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (contactData) {
        setEventContact(contactData);
      }

      // Load travel and hotel data
      const [{ data: travel }, { data: hotel }, { data: transport }] = await Promise.all([
        supabase.from('business_event_travel').select('*').eq('event_id', eventId),
        supabase.from('business_event_hotel').select('*').eq('event_id', eventId),
        supabase.from('business_event_transport').select('*').eq('event_id', eventId)
      ]);

      setTravelDetails(travel || []);
      setHotelDetails(hotel || []);
      setTransportDetails(transport || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load logistics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTravelDetail = (talentId: string, field: string, value: any) => {
    setTravelDetails(prev => {
      const existing = prev.find(t => t.talent_id === talentId);
      if (existing) {
        return prev.map(t => 
          t.talent_id === talentId ? { ...t, [field]: value } : t
        );
      } else {
        return [...prev, {
          event_id: eventId,
          talent_id: talentId,
          status: 'Not Booked',
          [field]: value
        }];
      }
    });
  };

  const updateHotelDetail = (talentId: string, field: string, value: any) => {
    setHotelDetails(prev => {
      const existing = prev.find(h => h.talent_id === talentId);
      if (existing) {
        return prev.map(h => 
          h.talent_id === talentId ? { ...h, [field]: value } : h
        );
      } else {
        return [...prev, {
          event_id: eventId,
          talent_id: talentId,
          [field]: value
        }];
      }
    });
  };

  const saveTravelDetails = async (talentId: string) => {
    try {
      const detail = travelDetails.find(t => t.talent_id === talentId);
      if (!detail) return;

      const { error } = await supabase
        .from('business_event_travel')
        .upsert({ ...detail, updated_at: new Date().toISOString() });

      if (error) throw error;

      toast({
        title: t[language].saved,
        description: t[language].travel
      });
      
      await loadTravelHotelData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save travel details",
        variant: "destructive"
      });
    }
  };

  const saveHotelDetails = async (talentId: string) => {
    try {
      const detail = hotelDetails.find(h => h.talent_id === talentId);
      if (!detail) return;

      const { error } = await supabase
        .from('business_event_hotel')
        .upsert({ ...detail, updated_at: new Date().toISOString() });

      if (error) throw error;

      toast({
        title: t[language].saved,
        description: t[language].hotel
      });
      
      await loadTravelHotelData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save hotel details",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (talentId: string, url: string) => {
    updateTravelDetail(talentId, 'flight_tickets_url', url);
  };

  const downloadFile = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop() || 'flight_tickets';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {assignedTalents.filter(talent => shouldShowTalent(talent.id)).map(talent => {
        const travelDetail = travelDetails.find(t => t.talent_id === talent.id);
        const hotelDetail = hotelDetails.find(h => h.talent_id === talent.id);
        const editable = canEdit(talent.id);

        return (
          <Card key={talent.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {talent.name}
                {profile?.role === 'talent' && <Badge variant="secondary">You</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="travel">
                <TabsList>
                  <TabsTrigger value="travel">{t[language].travel}</TabsTrigger>
                  <TabsTrigger value="hotel">{t[language].hotel}</TabsTrigger>
                </TabsList>

                <TabsContent value="travel" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t[language].airline}</Label>
                      <Input
                        value={travelDetail?.airline_name || ''}
                        onChange={(e) => updateTravelDetail(talent.id, 'airline_name', e.target.value)}
                        disabled={!editable}
                      />
                    </div>
                    <div>
                      <Label>{t[language].flightCode}</Label>
                      <Input
                        value={travelDetail?.confirmation_codes || ''}
                        onChange={(e) => updateTravelDetail(talent.id, 'confirmation_codes', e.target.value)}
                        disabled={!editable}
                      />
                    </div>
                    <div>
                      <Label>{t[language].status}</Label>
                      <Select
                        value={travelDetail?.status || 'Not Booked'}
                        onValueChange={(value) => updateTravelDetail(talent.id, 'status', value)}
                        disabled={!editable}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Booked">
                            <Badge variant="default" className="bg-green-500">{t[language].booked}</Badge>
                          </SelectItem>
                          <SelectItem value="Not Booked">
                            <Badge variant="destructive">{t[language].notBooked}</Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t[language].arrival}</Label>
                      <Input
                        type="datetime-local"
                        value={travelDetail?.arrival_datetime?.slice(0, 16) || ''}
                        onChange={(e) => updateTravelDetail(talent.id, 'arrival_datetime', e.target.value)}
                        disabled={!editable}
                      />
                    </div>
                    <div>
                      <Label>{t[language].departure}</Label>
                      <Input
                        type="datetime-local"
                        value={travelDetail?.departure_datetime?.slice(0, 16) || ''}
                        onChange={(e) => updateTravelDetail(talent.id, 'departure_datetime', e.target.value)}
                        disabled={!editable}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>{t[language].notes}</Label>
                    <Textarea
                      value={travelDetail?.notes || ''}
                      onChange={(e) => {
                        if (e.target.value.length <= 50) {
                          updateTravelDetail(talent.id, 'notes', e.target.value);
                        }
                      }}
                      maxLength={50}
                      disabled={!editable}
                      className="resize-none"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {(travelDetail?.notes || '').length}/50
                    </div>
                  </div>

                  {editable && (
                    <div className="space-y-2">
                      <Label>{t[language].ticketsUpload}</Label>
                      <FileUpload
                        onFileUploaded={(url) => handleFileUpload(talent.id, url)}
                        acceptedTypes={['pdf', 'txt', 'jpg', 'png', 'webp', 'html']}
                        bucket="business-events"
                      />
                    </div>
                  )}

                  {travelDetail?.flight_tickets_url && (
                    <Button
                      onClick={() => downloadFile(travelDetail.flight_tickets_url!)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t[language].ticketsDownload}
                    </Button>
                  )}

                  {editable && (
                    <Button onClick={() => saveTravelDetails(talent.id)}>
                      {t[language].save}
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="hotel" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t[language].hotelName}</Label>
                      <Input
                        value={hotelDetail?.hotel_name || ''}
                        onChange={(e) => updateHotelDetail(talent.id, 'hotel_name', e.target.value)}
                        disabled={!editable}
                      />
                    </div>
                    <div>
                      <Label>{t[language].hotelConf}</Label>
                      <Input
                        value={hotelDetail?.confirmation_number || ''}
                        onChange={(e) => updateHotelDetail(talent.id, 'confirmation_number', e.target.value)}
                        disabled={!editable}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t[language].hotelAddress}</Label>
                      <Input
                        value={hotelDetail?.hotel_address || ''}
                        onChange={(e) => updateHotelDetail(talent.id, 'hotel_address', e.target.value)}
                        disabled={!editable}
                      />
                    </div>
                    <div>
                      <Label>{t[language].checkin}</Label>
                      <Input
                        type="date"
                        value={hotelDetail?.checkin_date || ''}
                        onChange={(e) => updateHotelDetail(talent.id, 'checkin_date', e.target.value)}
                        disabled={!editable}
                      />
                    </div>
                    <div>
                      <Label>{t[language].checkout}</Label>
                      <Input
                        type="date"
                        value={hotelDetail?.checkout_date || ''}
                        onChange={(e) => updateHotelDetail(talent.id, 'checkout_date', e.target.value)}
                        disabled={!editable}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>{t[language].notes}</Label>
                    <Textarea
                      value={hotelDetail?.notes || ''}
                      onChange={(e) => {
                        if (e.target.value.length <= 50) {
                          updateHotelDetail(talent.id, 'notes', e.target.value);
                        }
                      }}
                      maxLength={50}
                      disabled={!editable}
                      className="resize-none"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {(hotelDetail?.notes || '').length}/50
                    </div>
                  </div>

                  {editable && (
                    <Button onClick={() => saveHotelDetails(talent.id)}>
                      {t[language].save}
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}