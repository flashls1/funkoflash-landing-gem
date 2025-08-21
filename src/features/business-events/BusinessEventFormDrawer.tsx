import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CalendarIcon, MapPinIcon, LinkIcon, ImageIcon, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import { BusinessEvent, businessEventsApi } from './data';
import FileUpload from '@/components/FileUpload';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BusinessEventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event?: BusinessEvent | null;
  onSave: (event: BusinessEvent) => void;
  language?: 'en' | 'es';
}

const BusinessEventFormDialog = ({
  isOpen,
  onClose,
  event,
  onSave,
  language = 'en'
}: BusinessEventFormDialogProps) => {
  const [formData, setFormData] = useState<Partial<BusinessEvent>>({
    status: 'draft',
    title: '',
    venue: '',
    city: '',
    state: '',
    country: 'USA',
    address_line: '',
    website: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [businessAccounts, setBusinessAccounts] = useState<any[]>([]);
  const [talentProfiles, setTalentProfiles] = useState<any[]>([]);
  const [assignedTalents, setAssignedTalents] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
      if (event) {
        // Populate form with existing event data
        setFormData({
          ...event,
          title: event.title || '',
          venue: event.venue || '',
          city: event.city || '',
          state: event.state || '',
          country: event.country || 'USA',
          address_line: event.address_line || '',
          website: event.website || ''
        });
        
        // Set dates and times
        if (event.start_ts) {
          const start = new Date(event.start_ts);
          setStartDate(start);
          setStartTime(start.toTimeString().slice(0, 5));
        }
        if (event.end_ts) {
          const end = new Date(event.end_ts);
          setEndDate(end);
          setEndTime(end.toTimeString().slice(0, 5));
        }
        
        loadEventAssignments();
      } else {
        // Reset form for new event
        setFormData({
          status: 'draft',
          title: '',
          venue: '',
          city: '',
          state: '',
          country: 'USA',
          address_line: '',
          website: ''
        });
        setStartDate(undefined);
        setEndDate(undefined);
        setStartTime('');
        setEndTime('');
        setAssignedTalents([]);
        setTeamMembers([]);
      }
    }
  }, [event, isOpen]);

  const loadDropdownData = async () => {
    try {
      const [accounts, talents] = await Promise.all([
        businessEventsApi.getBusinessAccounts(),
        businessEventsApi.getTalentProfiles()
      ]);
      setBusinessAccounts(accounts || []);
      setTalentProfiles(talents || []);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' ? 'Error al cargar datos' : 'Failed to load data',
        variant: "destructive"
      });
    }
  };

  const loadEventAssignments = async () => {
    if (!event?.id) return;
    
    try {
      const eventData = await businessEventsApi.getEvents();
      const currentEvent = eventData.find(e => e.id === event.id);
      
      if (currentEvent) {
        // Extract assigned talents
        const talents = (currentEvent as any).business_event_talent?.map((bet: any) => bet.talent_profiles.id) || [];
        setAssignedTalents(talents);
        
        // Extract team members (all business accounts except primary)
        const accounts = (currentEvent as any).business_event_account?.map((bea: any) => bea.business_account.id) || [];
        const teamAccounts = accounts.filter((id: string) => id !== formData.primary_business_id);
        setTeamMembers(teamAccounts);
      }
    } catch (error) {
      console.error('Failed to load event assignments:', error);
    }
  };

  const handleInputChange = (field: keyof BusinessEvent, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (url: string, fileName: string, fileType: string) => {
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'business-events');
    if (bucketIndex > -1) {
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      setFormData(prev => ({
        ...prev,
        hero_logo_path: filePath
      }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let start_ts = null;
      let end_ts = null;
      
      // Create start timestamp
      if (startDate && startTime) {
        const start = new Date(startDate);
        const [hours, minutes] = startTime.split(':');
        start.setHours(parseInt(hours), parseInt(minutes));
        start_ts = start.toISOString();
      }
      
      // Create end timestamp  
      if (endDate && endTime) {
        const end = new Date(endDate);
        const [endHours, endMinutes] = endTime.split(':');
        end.setHours(parseInt(endHours), parseInt(endMinutes));
        end_ts = end.toISOString();
      } else if (startDate && endTime) {
        // Same day end time
        const end = new Date(startDate);
        const [endHours, endMinutes] = endTime.split(':');
        end.setHours(parseInt(endHours), parseInt(endMinutes));
        end_ts = end.toISOString();
      }

      const eventData = {
        ...formData,
        start_ts,
        end_ts,
      };

      let savedEvent: BusinessEvent;
      if (event) {
        savedEvent = await businessEventsApi.updateEvent(event.id, eventData);
      } else {
        savedEvent = await businessEventsApi.createEvent(eventData);
      }

      // Handle assignments
      await handleAssignments(savedEvent.id);

      onSave(savedEvent);
      onClose();
      
      toast({
        title: language === 'es' ? 'Guardado' : 'Saved',
        description: language === 'es' 
          ? 'El evento se guardó correctamente.' 
          : 'Event saved successfully.',
      });
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' 
          ? 'Error al guardar el evento.' 
          : 'Failed to save event.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignments = async (eventId: string) => {
    try {
      // Clear existing assignments
      const existingEvent = await businessEventsApi.getEvents().then(events => 
        events.find(e => e.id === eventId)
      );

      if (existingEvent) {
        const existingTalents = (existingEvent as any).business_event_talent || [];
        const existingAccounts = (existingEvent as any).business_event_account || [];

        // Remove old talent assignments
        for (const talent of existingTalents) {
          await businessEventsApi.removeTalent(eventId, talent.talent_profiles.id);
        }

        // Remove old business account assignments
        for (const account of existingAccounts) {
          await businessEventsApi.removeBusinessAccount(eventId, account.business_account.id);
        }
      }

      // Add new talent assignments
      for (const talentId of assignedTalents) {
        await businessEventsApi.assignTalent(eventId, talentId);
      }

      // Add primary business assignment
      if (formData.primary_business_id) {
        await businessEventsApi.assignBusinessAccount(eventId, formData.primary_business_id);
      }

      // Add team member assignments
      for (const teamMemberId of teamMembers) {
        await businessEventsApi.assignBusinessAccount(eventId, teamMemberId);
      }
    } catch (error) {
      console.error('Failed to handle assignments:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {event 
              ? (language === 'es' ? 'Editar evento' : 'Edit Event')
              : (language === 'es' ? 'Crear evento' : 'Create Event')
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                {language === 'es' ? 'Título del evento' : 'Event Title'}
              </Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={language === 'es' ? 'Ingrese el título del evento' : 'Enter event title'}
                className="w-full"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                {language === 'es' ? 'Estado' : 'Status'}
              </Label>
              <Select value={formData.status || 'draft'} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-[100]">
                  <SelectItem value="draft">{language === 'es' ? 'Borrador' : 'Draft'}</SelectItem>
                  <SelectItem value="published">{language === 'es' ? 'Publicado' : 'Published'}</SelectItem>
                  <SelectItem value="cancelled">{language === 'es' ? 'Cancelado' : 'Cancelled'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Time Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">
              {language === 'es' ? 'Fecha y Hora' : 'Date & Time'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === 'es' ? 'Fecha de inicio' : 'Start Date'}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : 
                        (language === 'es' ? 'Seleccionar fecha' : 'Pick a date')
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Start Time */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === 'es' ? 'Hora de inicio' : 'Start Time'}
                </Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === 'es' ? 'Fecha de fin' : 'End Date'}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : 
                        (language === 'es' ? 'Opcional' : 'Optional')
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* End Time */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === 'es' ? 'Hora de fin' : 'End Time'}
                </Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">
              <MapPinIcon className="inline h-5 w-5 mr-2" />
              {language === 'es' ? 'Ubicación' : 'Location'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Venue */}
              <div className="space-y-2">
                <Label htmlFor="venue" className="text-sm font-medium">
                  {language === 'es' ? 'Lugar/Venue' : 'Venue'}
                </Label>
                <Input
                  id="venue"
                  value={formData.venue || ''}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  placeholder={language === 'es' ? 'Nombre del lugar' : 'Venue name'}
                  className="w-full"
                />
              </div>
              
              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address_line" className="text-sm font-medium">
                  {language === 'es' ? 'Dirección' : 'Address'}
                </Label>
                <Input
                  id="address_line"
                  value={formData.address_line || ''}
                  onChange={(e) => handleInputChange('address_line', e.target.value)}
                  placeholder={language === 'es' ? 'Dirección completa' : 'Full address'}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  {language === 'es' ? 'Ciudad' : 'City'}
                </Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder={language === 'es' ? 'Ciudad' : 'City'}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">
                  {language === 'es' ? 'Estado/Provincia' : 'State/Province'}
                </Label>
                <Input
                  id="state"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder={language === 'es' ? 'Estado' : 'State'}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium">
                  {language === 'es' ? 'País' : 'Country'}
                </Label>
                <Input
                  id="country"
                  value={formData.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder={language === 'es' ? 'País' : 'Country'}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">
              {language === 'es' ? 'Información Adicional' : 'Additional Information'}
            </h3>
            
            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">
                <LinkIcon className="inline h-4 w-4 mr-2" />
                {language === 'es' ? 'Sitio web' : 'Website'}
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
                className="w-full"
              />
            </div>

            {/* Primary Business */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {language === 'es' ? 'Empresa principal' : 'Primary Business'}
              </Label>
              <Select 
                value={formData.primary_business_id || ''} 
                onValueChange={(value) => handleInputChange('primary_business_id', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={language === 'es' ? 'Seleccionar empresa' : 'Select business'} />
                </SelectTrigger>
                <SelectContent className="bg-background border z-[100]">
                  {businessAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Talent Assignment Section */}
            <div className="space-y-4">
              <h4 className="text-md font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                {language === 'es' ? 'Asignar Talento (máximo 5)' : 'Assign Talent (max 5)'}
              </h4>
              
              {/* Available Talents */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === 'es' ? 'Talentos disponibles' : 'Available Talents'}
                </Label>
                <Select 
                  onValueChange={(value) => {
                    if (assignedTalents.length < 5 && !assignedTalents.includes(value)) {
                      setAssignedTalents(prev => [...prev, value]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar talento' : 'Select talent'} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-[100]">
                    {talentProfiles
                      .filter(talent => !assignedTalents.includes(talent.id))
                      .map((talent) => (
                      <SelectItem key={talent.id} value={talent.id}>
                        {talent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned Talents Display */}
              {assignedTalents.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {language === 'es' ? 'Talentos asignados' : 'Assigned Talents'} ({assignedTalents.length}/5)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {assignedTalents.map((talentId) => {
                      const talent = talentProfiles.find(t => t.id === talentId);
                      return (
                        <div key={talentId} className="flex items-center gap-2 bg-secondary rounded-md px-3 py-1">
                          <span className="text-sm">{talent?.name}</span>
                          <button
                            type="button"
                            onClick={() => setAssignedTalents(prev => prev.filter(id => id !== talentId))}
                            className="text-destructive hover:text-destructive/80 text-sm font-medium"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Hero Image */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <ImageIcon className="inline h-4 w-4 mr-2" />
                {language === 'es' ? 'Imagen principal' : 'Hero Image'}
              </Label>
              <FileUpload
                bucket="business-events"
                onFileUploaded={handleFileUpload}
                acceptedTypes={['image/*']}
                maxSize={10}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {language === 'es' ? 'Guardando...' : 'Saving...'}
              </>
            ) : (
              language === 'es' ? 'Guardar' : 'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessEventFormDialog;