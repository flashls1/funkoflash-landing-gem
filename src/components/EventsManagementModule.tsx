import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Calendar, 
  Plane, 
  Hotel, 
  User,
  Clock,
  MapPin,
  Info,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EventScheduleTimeline } from './EventScheduleTimeline';
import { formatDateUS, formatTimeUS } from '@/lib/utils';

interface EventsManagementModuleProps {
  language?: 'en' | 'es';
}

export const EventsManagementModule: React.FC<EventsManagementModuleProps> = ({ 
  language = 'en' 
}) => {
  const [businessEvents, setBusinessEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [allTalents, setAllTalents] = useState<any[]>([]);
  const [assignedTalents, setAssignedTalents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('info');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [eventInfo, setEventInfo] = useState({
    title: '',
    start_ts: '',
    end_ts: '',
    venue: '',
    website: '',
    city: '',
    state: ''
  });
  const [scheduleEntry, setScheduleEntry] = useState({
    date: '',
    time: '',
    title: '',
    notes: ''
  });

  const content = {
    en: {
      events: 'Events',
      info: 'Info',
      schedule: 'Schedule',
      travel: 'Travel',
      talent: 'Talent',
      selectEvent: 'Select an event to view details',
      noEvents: 'No events found',
      title: 'Title',
      startDate: 'Start Date',
      endDate: 'End Date',
      venue: 'Venue',
      website: 'Website',
      city: 'City',
      state: 'State',
      saveInfo: 'Save Info',
      addScheduleItem: 'Add Schedule Item',
      saveSchedule: 'Save Schedule',
      saveTravel: 'Save Travel',
      saveAssignments: 'Save Assignments',
      date: 'Date',
      time: 'Time',
      notes: 'Notes',
      flightInfo: 'Flight Information',
      hotelInfo: 'Hotel Information',
      groundTransport: 'Ground Transportation',
      availableTalents: 'Available Talents',
      assignedTalents: 'Assigned Talents',
      assignTalent: 'Assign',
      removeTalent: 'Remove',
      pendingDetails: 'Pending details',
      open: 'Open',
      active: 'Active',
      pending: 'Pending',
      archived: 'Archived',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      replace: 'Replace',
      infoUpdated: 'Event info updated successfully',
      scheduleUpdated: 'Schedule updated successfully',
      travelUpdated: 'Travel details updated successfully',
      assignmentsUpdated: 'Talent assignments updated successfully',
      error: 'An error occurred'
    },
    es: {
      events: 'Eventos',
      info: 'Info',
      schedule: 'Horario',
      travel: 'Viaje',
      talent: 'Talento',
      selectEvent: 'Selecciona un evento para ver detalles',
      noEvents: 'No se encontraron eventos',
      title: 'Título',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Fin',
      venue: 'Lugar',
      website: 'Sitio Web',
      city: 'Ciudad',
      state: 'Estado',
      saveInfo: 'Guardar Info',
      addScheduleItem: 'Agregar Elemento de Horario',
      saveSchedule: 'Guardar Horario',
      saveTravel: 'Guardar Viaje',
      saveAssignments: 'Guardar Asignaciones',
      date: 'Fecha',
      time: 'Hora',
      notes: 'Notas',
      flightInfo: 'Información de Vuelo',
      hotelInfo: 'Información de Hotel',
      groundTransport: 'Transporte Terrestre',
      availableTalents: 'Talentos Disponibles',
      assignedTalents: 'Talentos Asignados',
      assignTalent: 'Asignar',
      removeTalent: 'Remover',
      pendingDetails: 'Detalles pendientes',
      open: 'Abierto',
      active: 'Activo',
      pending: 'Pendiente',
      archived: 'Archivado',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      replace: 'Reemplazar',
      infoUpdated: 'Información del evento actualizada exitosamente',
      scheduleUpdated: 'Horario actualizado exitosamente',
      travelUpdated: 'Detalles de viaje actualizados exitosamente',
      assignmentsUpdated: 'Asignaciones de talento actualizadas exitosamente',
      error: 'Ocurrió un error'
    }
  };

  useEffect(() => {
    fetchBusinessEvents();
    fetchAllTalents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      setEventInfo({
        title: selectedEvent.title || '',
        start_ts: selectedEvent.start_ts || '',
        end_ts: selectedEvent.end_ts || '',
        venue: selectedEvent.venue || '',
        website: selectedEvent.website || '',
        city: selectedEvent.city || '',
        state: selectedEvent.state || ''
      });
      fetchAssignedTalents(selectedEvent.id);
    }
  }, [selectedEvent]);

  const fetchBusinessEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('business_events')
        .select('*')
        .order('start_ts', { ascending: true });

      if (error) throw error;
      setBusinessEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: content[language].error,
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const fetchAllTalents = async () => {
    try {
      const { data, error } = await supabase
        .from('talent_profiles')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setAllTalents(data || []);
    } catch (error) {
      console.error('Error fetching talents:', error);
    }
  };

  const fetchAssignedTalents = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('business_event_talent')
        .select('*, talent_profiles(*)')
        .eq('event_id', eventId);

      if (error) throw error;
      setAssignedTalents(data?.map(item => item.talent_profiles) || []);
    } catch (error) {
      console.error('Error fetching assigned talents:', error);
    }
  };

  const handleSaveEventInfo = async () => {
    if (!selectedEvent) return;

    try {
      const { error } = await supabase
        .from('business_events')
        .update(eventInfo)
        .eq('id', selectedEvent.id);

      if (error) throw error;

      toast({
        title: content[language].infoUpdated,
        description: `${eventInfo.title} information has been updated`
      });

      // Update local state
      setSelectedEvent({ ...selectedEvent, ...eventInfo });
      setBusinessEvents(prev => 
        prev.map(event => 
          event.id === selectedEvent.id ? { ...event, ...eventInfo } : event
        )
      );
    } catch (error) {
      console.error('Error updating event info:', error);
      toast({
        title: content[language].error,
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleAddScheduleEntry = async () => {
    if (!selectedEvent || !scheduleEntry.date || !scheduleEntry.time || !scheduleEntry.title) {
      return;
    }

    try {
      // Get current daily_schedule
      const currentSchedule = selectedEvent.daily_schedule || [];
      
      // Find the day for this date
      const entryDate = new Date(scheduleEntry.date);
      const eventStartDate = new Date(selectedEvent.start_ts);
      const dayNumber = Math.floor((entryDate.getTime() - eventStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Find or create the day entry
      let dayEntry = currentSchedule.find(day => day.day === dayNumber);
      if (!dayEntry) {
        dayEntry = {
          day: dayNumber,
          date: scheduleEntry.date,
          start_time: '08:00:00',
          end_time: '20:00:00',
          schedule: []
        };
        currentSchedule.push(dayEntry);
      }

      // Add the new schedule entry
      const newEntry = {
        time: scheduleEntry.time,
        title: scheduleEntry.title,
        notes: scheduleEntry.notes
      };

      // Replace existing entry at this time or add new one
      const existingIndex = dayEntry.schedule.findIndex(entry => entry.time === scheduleEntry.time);
      if (existingIndex >= 0) {
        dayEntry.schedule[existingIndex] = newEntry;
      } else {
        dayEntry.schedule.push(newEntry);
        dayEntry.schedule.sort((a, b) => a.time.localeCompare(b.time));
      }

      // Update the event
      const { error } = await supabase
        .from('business_events')
        .update({ daily_schedule: currentSchedule })
        .eq('id', selectedEvent.id);

      if (error) throw error;

      toast({
        title: content[language].scheduleUpdated,
        description: `${scheduleEntry.title} scheduled for ${formatDateUS(scheduleEntry.date)}`
      });

      // Reset form and refresh
      setScheduleEntry({ date: '', time: '', title: '', notes: '' });
      setIsScheduleModalOpen(false);
      
      // Update local state
      setSelectedEvent(prev => ({ ...prev, daily_schedule: currentSchedule }));
    } catch (error) {
      console.error('Error adding schedule entry:', error);
      toast({
        title: content[language].error,
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleAssignTalent = async (talentId: string) => {
    if (!selectedEvent) return;

    try {
      const { error } = await supabase
        .from('business_event_talent')
        .insert({
          event_id: selectedEvent.id,
          talent_id: talentId
        });

      if (error) throw error;

      toast({
        title: content[language].assignmentsUpdated,
        description: 'Talent assigned successfully'
      });

      fetchAssignedTalents(selectedEvent.id);
    } catch (error) {
      console.error('Error assigning talent:', error);
      toast({
        title: content[language].error,
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRemoveTalent = async (talentId: string) => {
    if (!selectedEvent) return;

    try {
      const { error } = await supabase
        .from('business_event_talent')
        .delete()
        .eq('event_id', selectedEvent.id)
        .eq('talent_id', talentId);

      if (error) throw error;

      toast({
        title: content[language].assignmentsUpdated,
        description: 'Talent removed successfully'
      });

      fetchAssignedTalents(selectedEvent.id);
    } catch (error) {
      console.error('Error removing talent:', error);
      toast({
        title: content[language].error,
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getEventSchedule = (event: any) => {
    if (!event?.daily_schedule || !Array.isArray(event.daily_schedule)) {
      return [];
    }
    // Return first day's schedule for preview
    const firstDay = event.daily_schedule[0];
    return firstDay?.schedule || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  const availableTalents = allTalents.filter(talent => 
    !assignedTalents.some(assigned => assigned.id === talent.id)
  );

  return (
    <div className="space-y-6">
      {/* Mobile Event Selector */}
      <div className="lg:hidden">
        <Select onValueChange={(value) => {
          const event = businessEvents.find(e => e.id === value);
          setSelectedEvent(event);
        }}>
          <SelectTrigger>
            <SelectValue placeholder={selectedEvent ? selectedEvent.title : content[language].selectEvent} />
          </SelectTrigger>
          <SelectContent>
            {businessEvents.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.title} - {formatDateUS(event.start_ts)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Events List */}
        <div className="hidden lg:block">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {content[language].events}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px] overflow-y-auto p-4 space-y-2">
                {businessEvents.length > 0 ? (
                  businessEvents.map((event) => (
                    <Card 
                      key={event.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedEvent?.id === event.id ? 'bg-primary/10 border-primary' : ''
                      }`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm leading-tight">{event.title}</h4>
                            <Badge variant={getStatusColor(event.status)} className="text-xs">
                              {event.status || content[language].pending}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDateUS(event.start_ts)}
                          </div>
                          {event.city && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {event.city}, {event.state}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {content[language].noEvents}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Event Details Tabs */}
        <div className="lg:col-span-2">
          {selectedEvent ? (
            <Card className="h-[600px]">
              <CardHeader className="pb-2">
                <CardTitle>{selectedEvent.title}</CardTitle>
                <CardDescription>
                  {formatDateUS(selectedEvent.start_ts)} - {selectedEvent.city}, {selectedEvent.state}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4 px-4">
                    <TabsTrigger value="info" className="flex items-center gap-2 text-xs">
                      <Info className="h-3 w-3" />
                      {content[language].info}
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3" />
                      {content[language].schedule}
                    </TabsTrigger>
                    <TabsTrigger value="travel" className="flex items-center gap-2 text-xs">
                      <Plane className="h-3 w-3" />
                      {content[language].travel}
                    </TabsTrigger>
                    <TabsTrigger value="talent" className="flex items-center gap-2 text-xs">
                      <User className="h-3 w-3" />
                      {content[language].talent}
                    </TabsTrigger>
                  </TabsList>

                  <div className="h-[480px] overflow-y-auto p-4">
                    {/* Info Tab */}
                    <TabsContent value="info" className="mt-0 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">{content[language].title}</Label>
                          <Input
                            id="title"
                            value={eventInfo.title}
                            onChange={(e) => setEventInfo(prev => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="venue">{content[language].venue}</Label>
                          <Input
                            id="venue"
                            value={eventInfo.venue}
                            onChange={(e) => setEventInfo(prev => ({ ...prev, venue: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="start_date">{content[language].startDate}</Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={eventInfo.start_ts ? eventInfo.start_ts.split('T')[0] : ''}
                            onChange={(e) => setEventInfo(prev => ({ ...prev, start_ts: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end_date">{content[language].endDate}</Label>
                          <Input
                            id="end_date"
                            type="date"
                            value={eventInfo.end_ts ? eventInfo.end_ts.split('T')[0] : ''}
                            onChange={(e) => setEventInfo(prev => ({ ...prev, end_ts: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">{content[language].city}</Label>
                          <Input
                            id="city"
                            value={eventInfo.city}
                            onChange={(e) => setEventInfo(prev => ({ ...prev, city: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">{content[language].state}</Label>
                          <Input
                            id="state"
                            value={eventInfo.state}
                            onChange={(e) => setEventInfo(prev => ({ ...prev, state: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">{content[language].website}</Label>
                        <Input
                          id="website"
                          value={eventInfo.website}
                          onChange={(e) => setEventInfo(prev => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                      <Button onClick={handleSaveEventInfo} className="w-full">
                        {content[language].saveInfo}
                      </Button>
                    </TabsContent>

                    {/* Schedule Tab */}
                    <TabsContent value="schedule" className="mt-0 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Daily Schedule</h3>
                        <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              {content[language].addScheduleItem}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{content[language].addScheduleItem}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>{content[language].date}</Label>
                                <Input
                                  type="date"
                                  value={scheduleEntry.date}
                                  onChange={(e) => setScheduleEntry(prev => ({ ...prev, date: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>{content[language].time}</Label>
                                <Select onValueChange={(value) => setScheduleEntry(prev => ({ ...prev, time: value }))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select time..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => (
                                      <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                                        {formatTimeUS(`${hour.toString().padStart(2, '0')}:00`)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>{content[language].title}</Label>
                                <Input
                                  value={scheduleEntry.title}
                                  onChange={(e) => setScheduleEntry(prev => ({ ...prev, title: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>{content[language].notes}</Label>
                                <Textarea
                                  value={scheduleEntry.notes}
                                  onChange={(e) => setScheduleEntry(prev => ({ ...prev, notes: e.target.value }))}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
                                  {content[language].cancel}
                                </Button>
                                <Button onClick={handleAddScheduleEntry}>
                                  {content[language].save}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <EventScheduleTimeline 
                        schedule={getEventSchedule(selectedEvent)}
                        language={language}
                      />
                    </TabsContent>

                    {/* Travel Tab */}
                    <TabsContent value="travel" className="mt-0 space-y-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Plane className="h-4 w-4" />
                            {content[language].flightInfo}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Input placeholder="Flight details..." />
                          <Input placeholder="Confirmation number..." />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <Hotel className="h-4 w-4" />
                            {content[language].hotelInfo}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Input placeholder="Hotel name..." />
                          <Input placeholder="Hotel address..." />
                          <Input placeholder="Confirmation number..." />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4" />
                            {content[language].groundTransport}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Input placeholder="Transport type..." />
                          <Input placeholder="Transport details..." />
                          <Input placeholder="Confirmation number..." />
                        </CardContent>
                      </Card>

                      <Button className="w-full">
                        {content[language].saveTravel}
                      </Button>
                    </TabsContent>

                    {/* Talent Tab */}
                    <TabsContent value="talent" className="mt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Available Talents */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{content[language].availableTalents}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                            {availableTalents.map((talent) => (
                              <div key={talent.id} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={talent.headshot_url} alt={talent.name} />
                                    <AvatarFallback className="text-xs">
                                      {talent.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{talent.name}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAssignTalent(talent.id)}
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        {/* Assigned Talents */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{content[language].assignedTalents}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                            {assignedTalents.map((talent) => (
                              <div key={talent.id} className="flex items-center justify-between p-2 border rounded bg-primary/5">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={talent.headshot_url} alt={talent.name} />
                                    <AvatarFallback className="text-xs">
                                      {talent.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{talent.name}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveTalent(talent.id)}
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                      <Button className="w-full">
                        {content[language].saveAssignments}
                      </Button>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent>
                <div className="text-center text-muted-foreground">
                  {content[language].selectEvent}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};