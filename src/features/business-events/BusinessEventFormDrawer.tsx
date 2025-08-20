import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { CalendarIcon, MapPinIcon, LinkIcon, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { BusinessEvent, businessEventsApi } from './data';
import FileUpload from '@/components/FileUpload';
import TravelHotelSection from './TravelHotelSection';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface BusinessEventFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event?: BusinessEvent | null;
  onSave: (event: BusinessEvent) => void;
  language?: 'en' | 'es';
}

const BusinessEventFormDrawer = ({
  isOpen,
  onClose,
  event,
  onSave,
  language = 'en'
}: BusinessEventFormDrawerProps) => {
  const [formData, setFormData] = useState<Partial<BusinessEvent>>({
    status: 'draft'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [businessAccounts, setBusinessAccounts] = useState<any[]>([]);
  const [talentProfiles, setTalentProfiles] = useState<any[]>([]);
  const [assignedTalents, setAssignedTalents] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
    if (event) {
      setFormData({
        ...event,
        start_ts: event.start_ts ? new Date(event.start_ts).toISOString().slice(0, 16) : '',
        end_ts: event.end_ts ? new Date(event.end_ts).toISOString().slice(0, 16) : ''
      });
      loadEventAssignments();
    } else if (isOpen) {
      setFormData({
        status: 'draft'
      });
      setAssignedTalents([]);
      setTeamMembers([]);
    }
  }, [event, isOpen]);

  const loadDropdownData = async () => {
    try {
      const [accounts, talents] = await Promise.all([
        businessEventsApi.getBusinessAccounts(),
        businessEventsApi.getTalentProfiles()
      ]);
      setBusinessAccounts(accounts);
      setTalentProfiles(talents);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dropdown data",
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
    // Extract the path from the full URL for storage
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
      const eventData = {
        ...formData,
        start_ts: formData.start_ts ? new Date(formData.start_ts).toISOString() : null,
        end_ts: formData.end_ts ? new Date(formData.end_ts).toISOString() : null,
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

  const FormContent = () => (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          {language === 'es' ? 'Título' : 'Title'}
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder={language === 'es' ? 'Título del evento' : 'Event title'}
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">
          {language === 'es' ? 'Estado' : 'Status'}
        </Label>
        <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">{language === 'es' ? 'Borrador' : 'Draft'}</SelectItem>
            <SelectItem value="published">{language === 'es' ? 'Publicado' : 'Published'}</SelectItem>
            <SelectItem value="cancelled">{language === 'es' ? 'Cancelado' : 'Cancelled'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_ts">
            <CalendarIcon className="inline h-4 w-4 mr-2" />
            {language === 'es' ? 'Fecha de inicio' : 'Start Date & Time'}
          </Label>
          <Input
            id="start_ts"
            type="datetime-local"
            value={formData.start_ts}
            onChange={(e) => handleInputChange('start_ts', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_ts">
            <CalendarIcon className="inline h-4 w-4 mr-2" />
            {language === 'es' ? 'Fecha de fin' : 'End Date & Time'}
          </Label>
          <Input
            id="end_ts"
            type="datetime-local"
            value={formData.end_ts}
            onChange={(e) => handleInputChange('end_ts', e.target.value)}
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address_line">
            <MapPinIcon className="inline h-4 w-4 mr-2" />
            {language === 'es' ? 'Dirección' : 'Address'}
          </Label>
          <Input
            id="address_line"
            value={formData.address_line}
            onChange={(e) => handleInputChange('address_line', e.target.value)}
            placeholder={language === 'es' ? 'Dirección completa' : 'Full address'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">{language === 'es' ? 'Ciudad' : 'City'}</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder={language === 'es' ? 'Ciudad' : 'City'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">{language === 'es' ? 'Estado' : 'State'}</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder={language === 'es' ? 'Estado' : 'State'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">{language === 'es' ? 'País' : 'Country'}</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder={language === 'es' ? 'País' : 'Country'}
            />
          </div>
        </div>
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="website">
          <LinkIcon className="inline h-4 w-4 mr-2" />
          {language === 'es' ? 'Sitio web' : 'Website'}
        </Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      {/* Assignments */}
      <div className="space-y-4">
        {/* Primary Business */}
        <div className="space-y-2">
          <Label htmlFor="primary_business">
            {language === 'es' ? 'Empresa principal' : 'Primary Business'} *
          </Label>
          <Select 
            value={formData.primary_business_id} 
            onValueChange={(value) => handleInputChange('primary_business_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === 'es' ? 'Seleccionar empresa' : 'Select business'} />
            </SelectTrigger>
            <SelectContent>
              {businessAccounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Team Members */}
        <div className="space-y-2">
          <Label htmlFor="team_members">
            {language === 'es' ? 'Miembros del equipo' : 'Team Members'}
          </Label>
          <Select 
            value={teamMembers.join(',')} 
            onValueChange={(value) => setTeamMembers(value ? value.split(',') : [])}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === 'es' ? 'Seleccionar miembros' : 'Select team members'} />
            </SelectTrigger>
            <SelectContent>
              {businessAccounts
                .filter(account => account.id !== formData.primary_business_id)
                .map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {teamMembers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {teamMembers.map(memberId => {
                const member = businessAccounts.find(a => a.id === memberId);
                return member ? (
                  <span key={memberId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary">
                    {member.name}
                    <button 
                      onClick={() => setTeamMembers(prev => prev.filter(id => id !== memberId))}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Talents */}
        <div className="space-y-2">
          <Label htmlFor="talents">
            {language === 'es' ? 'Talentos' : 'Talents'}
          </Label>
          <Select 
            value={assignedTalents.join(',')} 
            onValueChange={(value) => setAssignedTalents(value ? value.split(',') : [])}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === 'es' ? 'Seleccionar talentos' : 'Select talents'} />
            </SelectTrigger>
            <SelectContent>
              {talentProfiles.map(talent => (
                <SelectItem key={talent.id} value={talent.id}>
                  {talent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {assignedTalents.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {assignedTalents.map(talentId => {
                const talent = talentProfiles.find(t => t.id === talentId);
                return talent ? (
                  <span key={talentId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary text-primary-foreground">
                    {talent.name}
                    <button 
                      onClick={() => setAssignedTalents(prev => prev.filter(id => id !== talentId))}
                      className="ml-1 text-primary-foreground/80 hover:text-primary-foreground"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hero Image Upload */}
      <div className="space-y-2">
        <Label>
          <ImageIcon className="inline h-4 w-4 mr-2" />
          {language === 'es' ? 'Imagen principal' : 'Hero Image'}
        </Label>
        <FileUpload
          onFileUploaded={handleFileUpload}
          acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
          maxSize={5}
          bucket="business-events"
        />
        {formData.hero_logo_path && (
          <div className="text-sm text-muted-foreground">
            {language === 'es' ? 'Imagen cargada' : 'Image uploaded'}: {formData.hero_logo_path.split('/').pop()}
          </div>
        )}
      </div>

      {/* Travel & Hotel Section for existing events */}
      {event?.id && assignedTalents.length > 0 && (
        <div className="space-y-2">
          <Label>
            {language === 'es' ? 'Detalles de viaje y hotel' : 'Travel & Hotel Details'}
          </Label>
          <TravelHotelSection
            eventId={event.id}
            assignedTalents={talentProfiles.filter(t => assignedTalents.includes(t.id))}
            language={language}
          />
        </div>
      )}
    </div>
  );

  const FooterButtons = () => (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        {language === 'es' ? 'Cancelar' : 'Cancel'}
      </Button>
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading 
          ? (language === 'es' ? 'Guardando...' : 'Saving...') 
          : (language === 'es' ? 'Guardar' : 'Save')
        }
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {event 
                ? (language === 'es' ? 'Editar evento' : 'Edit Event')
                : (language === 'es' ? 'Agregar evento' : 'Add Event')
              }
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
            <FormContent />
          </div>
          <DrawerFooter>
            <FooterButtons />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {event 
              ? (language === 'es' ? 'Editar evento' : 'Edit Event')
              : (language === 'es' ? 'Agregar evento' : 'Add Event')
            }
          </SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <FormContent />
        </div>
        <SheetFooter>
          <FooterButtons />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default BusinessEventFormDrawer;