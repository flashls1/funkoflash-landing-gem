import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, X, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CalendarEventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'es';
  selectedDate?: Date;
  endDate?: Date;
  selectedTalent?: string;
  onSave: () => void;
  editEvent?: CalendarEvent | null;
}

interface CalendarEvent {
  id: string;
  talent_id?: string;
  event_title: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  all_day: boolean;
  status: 'booked' | 'hold' | 'available' | 'tentative' | 'cancelled' | 'not_available';
  venue_name?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  address_line?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notes_public?: string;
  notes_internal?: string;
  url?: string;
  travel_in?: string;
  travel_out?: string;
  timezone?: string;
}

export const CalendarEventForm = ({ 
  open, 
  onOpenChange, 
  language, 
  selectedDate, 
  endDate,
  selectedTalent,
  onSave,
  editEvent
}: CalendarEventFormProps) => {
  const [formData, setFormData] = useState<{
    talent_id: string;
    event_title: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    all_day: boolean;
    status: 'booked' | 'hold' | 'available' | 'tentative' | 'cancelled' | 'not_available';
    venue_name: string;
    location_city: string;
    location_state: string;
    location_country: string;
    address_line: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    notes_public: string;
    notes_internal: string;
    url: string;
    travel_in: string;
    travel_out: string;
    timezone: string;
    is_not_available: boolean;
  }>({
    talent_id: '',
    event_title: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    all_day: true,
    status: 'available',
    venue_name: '',
    location_city: '',
    location_state: '',
    location_country: 'USA',
    address_line: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    notes_public: '',
    notes_internal: '',
    url: '',
    travel_in: '',
    travel_out: '',
    timezone: 'America/Chicago',
    is_not_available: false
  });
  const [talents, setTalents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();

  const content = {
    en: {
      title: 'Add Event',
      editTitle: 'Edit Event',
      talent: 'Talent',
      selectTalent: 'Select talent',
      eventTitle: 'Event Title',
      startDate: 'Start Date',
      endDate: 'End Date',
      startTime: 'Start Time',
      endTime: 'End Time',
      allDay: 'All Day',
      status: 'Status',
      venue: 'Venue',
      city: 'City',
      state: 'State',
      notes: 'Public Notes',
      website: 'Website URL',
      notAvailable: 'Not Available',
      notAvailableDesc: 'Create a quick blocking event',
      save: 'Save Event',
      cancel: 'Cancel',
      creating: 'Creating...',
      updating: 'Updating...',
      eventCreated: 'Event created successfully',
      eventUpdated: 'Event updated successfully',
      blockDay: 'Block this day as Not Available',
      blockWeekend: 'Block this weekend as Not Available',
      blockRange: 'Block date range...'
    },
    es: {
      title: 'Agregar Evento',
      editTitle: 'Editar Evento',
      talent: 'Talento',
      selectTalent: 'Seleccionar talento',
      eventTitle: 'Título del Evento',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Fin',
      startTime: 'Hora de Inicio',
      endTime: 'Hora de Fin',
      allDay: 'Todo el Día',
      status: 'Estado',
      venue: 'Lugar',
      city: 'Ciudad',
      state: 'Estado',
      notes: 'Notas Públicas',
      website: 'URL del Sitio Web',
      notAvailable: 'No disponible',
      notAvailableDesc: 'Crear un evento de bloqueo rápido',
      save: 'Guardar Evento',
      cancel: 'Cancelar',
      creating: 'Creando...',
      updating: 'Actualizando...',
      eventCreated: 'Evento creado exitosamente',
      eventUpdated: 'Evento actualizado exitosamente',
      blockDay: 'Bloquear este día como No disponible',
      blockWeekend: 'Bloquear este fin de semana como No disponible',
      blockRange: 'Bloquear rango de fechas...'
    }
  };

  const t = content[language];

  useEffect(() => {
    if (open) {
      loadTalents();
      
      if (editEvent) {
        // Populate form with existing event data
        setFormData({
          talent_id: editEvent.talent_id || '',
          event_title: editEvent.event_title,
          start_date: editEvent.start_date,
          end_date: editEvent.end_date,
          start_time: editEvent.start_time || '',
          end_time: editEvent.end_time || '',
          all_day: editEvent.all_day,
          status: editEvent.status,
          venue_name: editEvent.venue_name || '',
          location_city: editEvent.location_city || '',
          location_state: editEvent.location_state || '',
          location_country: editEvent.location_country || 'USA',
          address_line: editEvent.address_line || '',
          contact_name: editEvent.contact_name || '',
          contact_email: editEvent.contact_email || '',
          contact_phone: editEvent.contact_phone || '',
          notes_public: editEvent.notes_public || '',
          notes_internal: editEvent.notes_internal || '',
          url: editEvent.url || '',
          travel_in: editEvent.travel_in || '',
          travel_out: editEvent.travel_out || '',
          timezone: editEvent.timezone || 'America/Chicago',
          is_not_available: editEvent.status === 'not_available'
        });
      } else {
        // Set defaults for new event
        setFormData(prev => ({
          ...prev,
          talent_id: selectedTalent || '',
          start_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
          end_date: endDate ? format(endDate, 'yyyy-MM-dd') : selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
          event_title: '',
          start_time: '',
          end_time: '',
          all_day: true,
          status: 'available',
          venue_name: '',
          location_city: '',
          location_state: '',
          location_country: 'USA',
          address_line: '',
          contact_name: '',
          contact_email: '',
          contact_phone: '',
          notes_public: '',
          notes_internal: '',
          url: '',
          travel_in: '',
          travel_out: '',
          timezone: 'America/Chicago',
          is_not_available: false
        }));
      }
    }
  }, [open, selectedDate, endDate, selectedTalent, editEvent]);

  const loadTalents = async () => {
    try {
      const { data, error } = await supabase
        .from('talent_profiles')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setTalents(data || []);
    } catch (error) {
      console.error('Error loading talents:', error);
    }
  };

  const handleNotAvailableChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_not_available: checked,
      event_title: checked ? (language === 'en' ? 'Not Available' : 'No disponible') : '',
      all_day: checked ? true : prev.all_day,
      status: checked ? 'not_available' : 'available',
      start_time: checked ? '' : prev.start_time,
      end_time: checked ? '' : prev.end_time
    }));
  };

  const canEditForTalent = (talentId: string): boolean => {
    // Admin/Staff can edit for any talent
    if (hasPermission('calendar:edit')) return true;
    
    // Talent/Business can only edit their own events
    if (hasPermission('calendar:edit_own')) {
      // Check if the talent belongs to the current user
      return profile?.role === 'talent' || profile?.role === 'business';
    }
    
    return false;
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validation
    if (!formData.talent_id || !formData.event_title || !formData.start_date || !formData.end_date) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    // Check permissions
    if (!canEditForTalent(formData.talent_id)) {
      toast({
        title: 'Permission denied',
        description: 'You do not have permission to create events for this talent.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        talent_id: formData.talent_id,
        event_title: formData.event_title,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.all_day ? null : formData.start_time || null,
        end_time: formData.all_day ? null : formData.end_time || null,
        all_day: formData.all_day,
        status: formData.status,
        venue_name: formData.venue_name || null,
        location_city: formData.location_city || null,
        location_state: formData.location_state || null,
        notes_public: formData.notes_public || null,
        url: formData.url || null,
        updated_by: user.id
      };

      if (editEvent) {
        // Update existing event
        const { error } = await supabase
          .from('calendar_event')
          .update(eventData)
          .eq('id', editEvent.id);

        if (error) throw error;

        toast({
          title: t.eventUpdated,
          description: `Event "${formData.event_title}" has been updated.`
        });
      } else {
        // Create new event
        const { error } = await supabase
          .from('calendar_event')
          .insert({
            ...eventData,
            created_by: user.id
          });

        if (error) throw error;

        toast({
          title: t.eventCreated,
          description: `Event "${formData.event_title}" has been created.`
        });
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error saving event',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      talent_id: '',
      event_title: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      all_day: true,
      status: 'available',
      venue_name: '',
      location_city: '',
      location_state: '',
      location_country: 'USA',
      address_line: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      notes_public: '',
      notes_internal: '',
      url: '',
      travel_in: '',
      travel_out: '',
      timezone: 'America/Chicago',
      is_not_available: false
    });
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEvent ? t.editTitle : t.title}</DialogTitle>
          <DialogDescription>
            {formData.is_not_available ? t.notAvailableDesc : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Not Available Quick Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t.notAvailable}
              </CardTitle>
              <CardDescription>{t.notAvailableDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="not-available"
                  checked={formData.is_not_available}
                  onCheckedChange={handleNotAvailableChange}
                />
                <Label htmlFor="not-available">{t.notAvailable}</Label>
              </div>
            </CardContent>
          </Card>

          {/* Basic Event Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Talent Selection */}
            <div className="md:col-span-2">
              <Label htmlFor="talent">{t.talent} *</Label>
              <Select
                value={formData.talent_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, talent_id: value }))}
                disabled={!hasPermission('calendar:edit')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.selectTalent} />
                </SelectTrigger>
                <SelectContent>
                  {talents.map(talent => (
                    <SelectItem key={talent.id} value={talent.id}>
                      {talent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Title */}
            <div className="md:col-span-2">
              <Label htmlFor="title">{t.eventTitle} *</Label>
              <Input
                id="title"
                value={formData.event_title}
                onChange={(e) => setFormData(prev => ({ ...prev, event_title: e.target.value }))}
                disabled={formData.is_not_available}
                placeholder={formData.is_not_available ? (language === 'en' ? 'Not Available' : 'No disponible') : ''}
              />
            </div>

            {/* Date Fields */}
            <div>
              <Label htmlFor="start-date">{t.startDate} *</Label>
              <Input
                id="start-date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="end-date">{t.endDate} *</Label>
              <Input
                id="end-date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                min={formData.start_date}
              />
            </div>

            {/* All Day Toggle */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all-day"
                  checked={formData.all_day}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, all_day: !!checked }))}
                  disabled={formData.is_not_available}
                />
                <Label htmlFor="all-day">{t.allDay}</Label>
              </div>
            </div>

            {/* Time Fields (only if not all day) */}
            {!formData.all_day && !formData.is_not_available && (
              <>
                <div>
                  <Label htmlFor="start-time">{t.startTime}</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="end-time">{t.endTime}</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </>
            )}

            {/* Status */}
            {!formData.is_not_available && (
              <div>
                <Label htmlFor="status">{t.status}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                    <SelectItem value="tentative">Tentative</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Optional Fields (hidden for Not Available) */}
          {!formData.is_not_available && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="venue">{t.venue}</Label>
                  <Input
                    id="venue"
                    value={formData.venue_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, venue_name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="city">{t.city}</Label>
                  <Input
                    id="city"
                    value={formData.location_city}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_city: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="state">{t.state}</Label>
                  <Input
                    id="state"
                    value={formData.location_state}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_state: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="url">{t.website}</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">{t.notes}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes_public}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes_public: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (editEvent ? t.updating : t.creating) : t.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};