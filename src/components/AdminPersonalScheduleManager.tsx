import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar,
  Plus,
  Trash2,
  Edit,
  User
} from 'lucide-react';
import { formatDateUS } from '@/lib/utils';

interface PersonalScheduleEntry {
  id: string;
  talent_id: string;
  schedule_date: string;
  time_start: string;
  time_end: string;
  title: string;
  description?: string;
  schedule_type: string;
}

interface Talent {
  id: string;
  name: string;
  headshot_url?: string;
}

interface AdminPersonalScheduleManagerProps {
  eventId: string;
  assignedTalents: Talent[];
  language?: 'en' | 'es';
}

export const AdminPersonalScheduleManager: React.FC<AdminPersonalScheduleManagerProps> = ({
  eventId,
  assignedTalents,
  language = 'en'
}) => {
  const [personalSchedules, setPersonalSchedules] = useState<PersonalScheduleEntry[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time_start: '08:00',
    time_end: '09:00',
    schedule_type: 'personal'
  });

  const { toast } = useToast();

  useEffect(() => {
    if (eventId && assignedTalents.length > 0) {
      if (!selectedTalent) {
        setSelectedTalent(assignedTalents[0].id);
      }
      generateAvailableDates();
      fetchPersonalSchedules();
    }
  }, [eventId, assignedTalents, selectedTalent]);

  const generateAvailableDates = () => {
    // Generate dates for a week around the event (this is a simplified version)
    const dates = [];
    const today = new Date();
    
    for (let i = -2; i <= 4; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    setAvailableDates(dates);
    if (!currentDate && dates.length > 0) {
      setCurrentDate(dates[2]); // Set to "today"
    }
  };

  const fetchPersonalSchedules = async () => {
    if (!selectedTalent) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('talent_personal_schedules')
        .select('*')
        .eq('talent_id', selectedTalent)
        .eq('event_id', eventId)
        .order('schedule_date', { ascending: true })
        .order('time_start', { ascending: true });

      if (error) throw error;
      setPersonalSchedules(data || []);
    } catch (error) {
      console.error('Error fetching personal schedules:', error);
      toast({
        title: "Error",
        description: "Failed to load personal schedules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDateSchedules = () => {
    return personalSchedules.filter(schedule => schedule.schedule_date === currentDate);
  };

  const handleAddScheduleItem = async () => {
    if (!selectedTalent || !currentDate) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('talent_personal_schedules')
        .insert({
          talent_id: selectedTalent,
          event_id: eventId,
          schedule_date: currentDate,
          time_start: formData.time_start,
          time_end: formData.time_end,
          title: formData.title,
          description: formData.description,
          schedule_type: formData.schedule_type,
          created_by: userData.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Personal schedule item added",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        time_start: '08:00',
        time_end: '09:00',
        schedule_type: 'personal'
      });
      
      setIsAddModalOpen(false);
      fetchPersonalSchedules();
    } catch (error) {
      console.error('Error adding schedule item:', error);
      toast({
        title: "Error",
        description: "Failed to add schedule item",
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('talent_personal_schedules')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Schedule item deleted",
      });

      fetchPersonalSchedules();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Convert "HH:MM:SS" to "HH:MM"
  };

  const content = {
    en: {
      personalScheduleManager: 'Personal Schedule Manager',
      selectTalent: 'Select Talent',
      noScheduleItems: 'No personal schedule items for this day',
      addScheduleItem: 'Add Schedule Item',
      title: 'Title',
      description: 'Description',
      startTime: 'Start Time',
      endTime: 'End Time',
      scheduleType: 'Schedule Type',
      personal: 'Personal',
      meeting: 'Meeting',
      meal: 'Meal',
      travel: 'Travel',
      downtime: 'Downtime',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      scheduleFor: 'Schedule for'
    },
    es: {
      personalScheduleManager: 'Gestor de Horario Personal',
      selectTalent: 'Seleccionar Talento',
      noScheduleItems: 'No hay elementos de horario personal para este día',
      addScheduleItem: 'Agregar Elemento de Horario',
      title: 'Título',
      description: 'Descripción',
      startTime: 'Hora de Inicio',
      endTime: 'Hora de Fin',
      scheduleType: 'Tipo de Horario',
      personal: 'Personal',
      meeting: 'Reunión',
      meal: 'Comida',
      travel: 'Viaje',
      downtime: 'Descanso',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      scheduleFor: 'Horario para'
    }
  };

  if (assignedTalents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No talents assigned to this event. Assign talents first to manage their personal schedules.</p>
        </CardContent>
      </Card>
    );
  }

  const currentDateSchedules = getCurrentDateSchedules();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {content[language].personalScheduleManager}
        </h3>
      </div>

      {/* Talent Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{content[language].selectTalent}</Label>
          <Select value={selectedTalent} onValueChange={setSelectedTalent}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignedTalents.map(talent => (
                <SelectItem key={talent.id} value={talent.id}>
                  {talent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Selection */}
      <div className="flex gap-2 flex-wrap">
        {availableDates.map(date => (
          <Button
            key={date}
            variant={currentDate === date ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentDate(date)}
          >
            {formatDateUS(date)}
          </Button>
        ))}
      </div>

      {/* Schedule Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {content[language].scheduleFor} {currentDate ? formatDateUS(currentDate) : ''}
            </CardTitle>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {content[language].addScheduleItem}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{content[language].addScheduleItem}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{content[language].title}</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Meeting with event organizer"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{content[language].description}</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description or notes"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{content[language].startTime}</Label>
                      <Input
                        type="time"
                        value={formData.time_start}
                        onChange={(e) => setFormData(prev => ({ ...prev, time_start: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{content[language].endTime}</Label>
                      <Input
                        type="time"
                        value={formData.time_end}
                        onChange={(e) => setFormData(prev => ({ ...prev, time_end: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{content[language].scheduleType}</Label>
                    <Select 
                      value={formData.schedule_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, schedule_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">{content[language].personal}</SelectItem>
                        <SelectItem value="meeting">{content[language].meeting}</SelectItem>
                        <SelectItem value="meal">{content[language].meal}</SelectItem>
                        <SelectItem value="travel">{content[language].travel}</SelectItem>
                        <SelectItem value="downtime">{content[language].downtime}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                      {content[language].cancel}
                    </Button>
                    <Button onClick={handleAddScheduleItem}>
                      {content[language].save}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {currentDateSchedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{content[language].noScheduleItems}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentDateSchedules.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  {/* Time Block */}
                  <div className="flex-shrink-0 text-center min-w-[80px]">
                    <div className="font-bold text-sm">
                      {formatTime(item.time_start)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(item.time_end)}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold leading-tight">{item.title}</h4>
                      <div className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                        {item.schedule_type}
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                        {item.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Edit className="h-3 w-3" />
                        {content[language].edit}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteItem(item.id)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        {content[language].delete}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};