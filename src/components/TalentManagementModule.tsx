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
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Plane, 
  Hotel, 
  User,
  FileText,
  Clock,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TalentAssetsManager } from '@/features/talent-assets/TalentAssetsManager';
import { EventScheduleTimeline } from './EventScheduleTimeline';
import { formatDateUS, formatTimeUS } from '@/lib/utils';

interface TalentManagementModuleProps {
  language?: 'en' | 'es';
}

export const TalentManagementModule: React.FC<TalentManagementModuleProps> = ({ 
  language = 'en' 
}) => {
  const [talents, setTalents] = useState<any[]>([]);
  const [businessEvents, setBusinessEvents] = useState<any[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleEntry, setScheduleEntry] = useState({
    date: '',
    time: '',
    title: '',
    notes: ''
  });
  const [activeTab, setActiveTab] = useState('profiles');

  const content = {
    en: {
      talentManagement: 'Talent Management',
      profiles: 'Profiles',
      assets: 'Assets',
      events: 'Events',
      travel: 'Travel',
      scheduleManager: 'Schedule Manager',
      manageTalents: 'Manage Talents',
      viewAssets: 'View Assets',
      assignEvents: 'Assign Events',
      manageTravel: 'Manage Travel',
      addScheduleEntry: 'Add Schedule Entry',
      date: 'Date',
      time: 'Time',
      title: 'Title',
      notes: 'Notes',
      save: 'Save',
      cancel: 'Cancel',
      selectTalent: 'Select a talent to view their assets',
      selectEvent: 'Select an event to manage schedule',
      noTalents: 'No talents found',
      noEvents: 'No events found',
      scheduleAdded: 'Schedule entry added successfully',
      error: 'An error occurred'
    },
    es: {
      talentManagement: 'Gestión de Talentos',
      profiles: 'Perfiles',
      assets: 'Recursos',
      events: 'Eventos',
      travel: 'Viaje',
      scheduleManager: 'Gestor de Horarios',
      manageTalents: 'Gestionar Talentos',
      viewAssets: 'Ver Recursos',
      assignEvents: 'Asignar Eventos',
      manageTravel: 'Gestionar Viajes',
      addScheduleEntry: 'Agregar Entrada de Horario',
      date: 'Fecha',
      time: 'Hora',
      title: 'Título',
      notes: 'Notas',
      save: 'Guardar',
      cancel: 'Cancelar',
      selectTalent: 'Selecciona un talento para ver sus recursos',
      selectEvent: 'Selecciona un evento para gestionar el horario',
      noTalents: 'No se encontraron talentos',
      noEvents: 'No se encontraron eventos',
      scheduleAdded: 'Entrada de horario agregada exitosamente',
      error: 'Ocurrió un error'
    }
  };

  useEffect(() => {
    fetchTalents();
    fetchBusinessEvents();
  }, []);

  const fetchTalents = async () => {
    try {
      const { data, error } = await supabase
        .from('talent_profiles')
        .select('*')
        .eq('active', true)
        .order('sort_rank', { ascending: true });

      if (error) throw error;
      setTalents(data || []);
    } catch (error) {
      console.error('Error fetching talents:', error);
      toast({
        title: content[language].error,
        description: error.message,
        variant: 'destructive'
      });
    }
  };

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
    }
  };

  const handleAddScheduleEntry = async () => {
    if (!selectedEvent || !scheduleEntry.date || !scheduleEntry.time || !scheduleEntry.title) {
      toast({
        title: content[language].error,
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
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
        title: content[language].scheduleAdded,
        description: `Added ${scheduleEntry.title} at ${scheduleEntry.time}`
      });

      // Reset form and refresh
      setScheduleEntry({ date: '', time: '', title: '', notes: '' });
      setIsScheduleModalOpen(false);
      fetchBusinessEvents();
    } catch (error) {
      console.error('Error adding schedule entry:', error);
      toast({
        title: content[language].error,
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getEventSchedule = (event: any) => {
    if (!event.daily_schedule || !Array.isArray(event.daily_schedule)) {
      return [];
    }
    // Return first day's schedule for preview
    const firstDay = event.daily_schedule[0];
    return firstDay?.schedule || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          {content[language].talentManagement}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {content[language].profiles}
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {content[language].assets}
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {content[language].events}
          </TabsTrigger>
          <TabsTrigger value="travel" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            {content[language].travel}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{content[language].manageTalents}</CardTitle>
              <CardDescription>
                View and manage talent profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {talents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {talents.map((talent) => (
                    <Card key={talent.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={talent.headshot_url} alt={talent.name} />
                            <AvatarFallback>
                              {talent.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{talent.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {talent.slug}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={talent.public_visibility ? 'default' : 'secondary'}>
                                {talent.public_visibility ? 'Public' : 'Private'}
                              </Badge>
                              <Badge variant="outline">
                                Rank: {talent.sort_rank}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {content[language].noTalents}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{content[language].viewAssets}</CardTitle>
              <CardDescription>
                Manage talent assets and portfolio items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select onValueChange={(value) => setSelectedTalent(talents.find(t => t.id === value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a talent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {talents.map((talent) => (
                      <SelectItem key={talent.id} value={talent.id}>
                        {talent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTalent ? (
                  <TalentAssetsManager talentId={selectedTalent.id} locale={language} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {content[language].selectTalent}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{content[language].scheduleManager}</CardTitle>
                  <CardDescription>
                    Manage event schedules and assignments
                  </CardDescription>
                </div>
                <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedEvent}>
                      <Plus className="h-4 w-4 mr-2" />
                      {content[language].addScheduleEntry}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{content[language].addScheduleEntry}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">{content[language].date}</label>
                        <Input
                          type="date"
                          value={scheduleEntry.date}
                          onChange={(e) => setScheduleEntry(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{content[language].time}</label>
                        <Select onValueChange={(value) => setScheduleEntry(prev => ({ ...prev, time: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => (
                              <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                                {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">{content[language].title}</label>
                        <Input
                          value={scheduleEntry.title}
                          onChange={(e) => setScheduleEntry(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Event title..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{content[language].notes}</label>
                        <Textarea
                          value={scheduleEntry.notes}
                          onChange={(e) => setScheduleEntry(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Additional notes..."
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
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Events List */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Business Events</h3>
                  {businessEvents.length > 0 ? (
                    <div className="space-y-2">
                      {businessEvents.map((event) => (
                        <Card 
                          key={event.id}
                          className={`cursor-pointer transition-colors ${
                            selectedEvent?.id === event.id ? 'bg-primary/10 border-primary' : ''
                          }`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{event.title}</h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatDateUS(event.start_ts)}
                                  {event.city && (
                                    <>
                                      <MapPin className="h-3 w-3 ml-2" />
                                      {event.city}
                                    </>
                                  )}
                                </div>
                              </div>
                              <Badge>{event.status}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {content[language].noEvents}
                    </div>
                  )}
                </div>

                {/* Schedule Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Schedule Preview</h3>
                  {selectedEvent ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{selectedEvent.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <EventScheduleTimeline 
                          schedule={getEventSchedule(selectedEvent)}
                          language={language}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {content[language].selectEvent}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                {content[language].manageTravel}
              </CardTitle>
              <CardDescription>
                Manage travel and logistics for events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Travel management functionality coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};