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
      contact: "Punto de contacto del evento",
      contactName: "Nombre del contacto", 
      phone: "Número de teléfono",
      travel: "Detalles de viaje",
      hotel: "Detalles del hotel",
      transport: "Transporte terrestre",
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
      provider: "Proveedor/Servicio",
      providerOther: "Otro (ingresar proveedor)",
      pickup: "Recogida",
      dropoff: "Destino",
      save: "Guardar",
      saved: "Guardado exitosamente",
      max25: "Máximo 25 caracteres",
      providers: {
        uber: "Uber",
        lyft: "Lyft",
        taxi: "Taxi",
        carService: "Servicio de auto",
        shuttle: "Transporte compartido",
        rental: "Auto de alquiler"
      }
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
      console.log('[TravelHotelSection] Saving travel details', { talentId });
      const existing = travelDetails.find(t => t.talent_id === talentId);
      const payload = existing ?? {
        event_id: eventId,
        talent_id: talentId,
        status: 'Not Booked'
      };

      const { error } = await supabase
        .from('business_event_travel')
        .upsert({ ...payload, updated_at: new Date().toISOString() });

      if (error) throw error;

      toast({
        title: t[language].saved,
        description: t[language].travel
      });
      
      await loadTravelHotelData();
    } catch (error: any) {
      console.error('[TravelHotelSection] Save travel failed', { message: error?.message });
      toast({
        title: "Error",
        description: "Failed to save travel details: " + (error?.message || 'Unknown error'),
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

  const updateTransportDetail = (talentId: string, field: string, value: any) => {
    setTransportDetails(prev => {
      const existing = prev.find(t => t.talent_id === talentId);
      if (existing) {
        return prev.map(t => 
          t.talent_id === talentId ? { ...t, [field]: value } : t
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

  const saveTransportDetails = async (talentId: string) => {
    try {
      const detail = transportDetails.find(t => t.talent_id === talentId);
      if (!detail) return;

      const { error } = await supabase
        .from('business_event_transport')
        .upsert({ ...detail, updated_at: new Date().toISOString() });

      if (error) throw error;

      toast({
        title: t[language].saved,
        description: t[language].transport
      });
      
      await loadTravelHotelData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transport details",
        variant: "destructive"
      });
    }
  };

  const saveEventContact = async () => {
    try {
      if (!eventContact.contact_name.trim() || !eventContact.phone_number.trim()) {
        toast({
          title: "Error",
          description: "Contact name and phone number are required",
          variant: "destructive"
        });
        return;
      }

      if (eventContact.contact_name.length > 25) {
        toast({
          title: "Error",
          description: t[language].max25,
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('business_event_contact')
        .upsert({
          event_id: eventId,
          ...eventContact,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: t[language].saved,
        description: t[language].contact
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to save contact information",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (talentId: string, file: File, section: 'travel' | 'transport') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `business-events/${eventId}/${section}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-events')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-events')
        .getPublicUrl(filePath);

      if (section === 'travel') {
        updateTravelDetail(talentId, 'flight_tickets_url', publicUrl);
      } else {
        updateTransportDetail(talentId, 'transport_documents_url', publicUrl);
      }

      toast({
        title: "Success",
        description: "File uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    }
  };

  const downloadFile = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop() || 'document';
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

  const providerOptions = [
    { value: 'uber', label: t[language].providers.uber },
    { value: 'lyft', label: t[language].providers.lyft },
    { value: 'taxi', label: t[language].providers.taxi },
    { value: 'carService', label: t[language].providers.carService },
    { value: 'shuttle', label: t[language].providers.shuttle },
    { value: 'rental', label: t[language].providers.rental }
  ];

  return (
    <div className="space-y-6">
      {/* Event Point of Contact - only show for non-talent users */}
      {profile?.role !== 'talent' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t[language].contact}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-name">{t[language].contactName}</Label>
                <Input
                  id="contact-name"
                  value={eventContact.contact_name}
                  onChange={(e) => setEventContact(prev => ({ ...prev, contact_name: e.target.value }))}
                  maxLength={25}
                  disabled={!canEdit('')}
                  placeholder={t[language].contactName}
                />
                <p className="text-xs text-muted-foreground mt-1">{t[language].max25}</p>
              </div>
              <div>
                <Label htmlFor="contact-phone">{t[language].phone}</Label>
                <Input
                  id="contact-phone"
                  value={eventContact.phone_number}
                  onChange={(e) => setEventContact(prev => ({ ...prev, phone_number: e.target.value }))}
                  disabled={!canEdit('')}
                  placeholder={t[language].phone}
                />
              </div>
            </div>
            {canEdit('') && (
              <Button onClick={saveEventContact} className="w-fit">
                {t[language].save}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Talent Logistics */}
      {assignedTalents.filter(talent => shouldShowTalent(talent.id)).map(talent => {
        const travelDetail = travelDetails.find(t => t.talent_id === talent.id);
        const hotelDetail = hotelDetails.find(h => h.talent_id === talent.id);
        const transportDetail = transportDetails.find(tr => tr.talent_id === talent.id);
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
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="travel" className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    {t[language].travel}
                  </TabsTrigger>
                  <TabsTrigger value="hotel" className="flex items-center gap-2">
                    <Hotel className="h-4 w-4" />
                    {t[language].hotel}
                  </TabsTrigger>
                  <TabsTrigger value="transport" className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {t[language].transport}
                  </TabsTrigger>
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
                        onFileUploaded={(url) => updateTravelDetail(talent.id, 'flight_tickets_url', url)}
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
                        type="datetime-local"
                        value={hotelDetail?.checkin_date?.slice(0, 16) || ''}
                        onChange={(e) => updateHotelDetail(talent.id, 'checkin_date', e.target.value)}
                        disabled={!editable}
                      />
                    </div>
                    <div>
                      <Label>{t[language].checkout}</Label>
                      <Input
                        type="datetime-local"
                        value={hotelDetail?.checkout_date?.slice(0, 16) || ''}
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

                <TabsContent value="transport" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t[language].provider}</Label>
                      <Select
                        value={transportDetail?.provider_type || ''}
                        onValueChange={(value) => updateTransportDetail(talent.id, 'provider_type', value)}
                        disabled={!editable}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t[language].provider} />
                        </SelectTrigger>
                        <SelectContent>
                          {providerOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">{t[language].providerOther}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {transportDetail?.provider_type === 'other' && (
                      <div>
                        <Label>{t[language].providerOther}</Label>
                        <Input
                          value={transportDetail?.provider_other || ''}
                          onChange={(e) => updateTransportDetail(talent.id, 'provider_other', e.target.value)}
                          disabled={!editable}
                          placeholder={t[language].providerOther}
                        />
                      </div>
                    )}
                    
                    <div>
                      <Label>{t[language].flightCode}</Label>
                      <Input
                        value={transportDetail?.confirmation_code || ''}
                        onChange={(e) => updateTransportDetail(talent.id, 'confirmation_code', e.target.value)}
                        disabled={!editable}
                        placeholder="Confirmation code"
                      />
                    </div>
                    
                    <div>
                      <Label>{t[language].pickup}</Label>
                      <Input
                        type="datetime-local"
                        value={transportDetail?.pickup_datetime?.slice(0, 16) || ''}
                        onChange={(e) => updateTransportDetail(talent.id, 'pickup_datetime', e.target.value)}
                        disabled={!editable}
                      />
                    </div>
                    
                    <div>
                      <Label>{t[language].dropoff}</Label>
                      <Input
                        type="datetime-local"
                        value={transportDetail?.dropoff_datetime?.slice(0, 16) || ''}
                        onChange={(e) => updateTransportDetail(talent.id, 'dropoff_datetime', e.target.value)}
                        disabled={!editable}
                      />
                    </div>
                    
                    <div>
                      <Label>Pickup Location</Label>
                      <Input
                        value={transportDetail?.pickup_location || ''}
                        onChange={(e) => updateTransportDetail(talent.id, 'pickup_location', e.target.value)}
                        disabled={!editable}
                        placeholder="Pickup location"
                      />
                    </div>
                    
                    <div>
                      <Label>Dropoff Location</Label>
                      <Input
                        value={transportDetail?.dropoff_location || ''}
                        onChange={(e) => updateTransportDetail(talent.id, 'dropoff_location', e.target.value)}
                        disabled={!editable}
                        placeholder="Dropoff location"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label>{t[language].notes}</Label>
                      <Textarea
                        value={transportDetail?.notes || ''}
                        onChange={(e) => {
                          if (e.target.value.length <= 50) {
                            updateTransportDetail(talent.id, 'notes', e.target.value);
                          }
                        }}
                        maxLength={50}
                        disabled={!editable}
                        className="resize-none"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {(transportDetail?.notes || '').length}/50
                      </div>
                    </div>
                  </div>
                  
                  {editable && (
                    <div className="space-y-2">
                      <Label>Upload Documents</Label>
                      <FileUpload
                        onFileUploaded={(url) => updateTransportDetail(talent.id, 'transport_documents_url', url)}
                        acceptedTypes={['pdf', 'txt', 'jpg', 'png', 'webp', 'html']}
                        bucket="business-events"
                      />
                    </div>
                  )}
                  
                  {transportDetail?.transport_documents_url && (
                    <Button
                      onClick={() => downloadFile(transportDetail.transport_documents_url!)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Documents
                    </Button>
                  )}
                  
                  {editable && (
                    <Button onClick={() => saveTransportDetails(talent.id)}>
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