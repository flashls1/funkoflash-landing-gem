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
    title: '',
    start_ts: '',
    end_ts: '',
    city: '',
    state: '',
    country: 'USA',
    address_line: '',
    website: '',
    hero_logo_path: '',
    status: 'draft'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        start_ts: event.start_ts ? new Date(event.start_ts).toISOString().slice(0, 16) : '',
        end_ts: event.end_ts ? new Date(event.end_ts).toISOString().slice(0, 16) : '',
        city: event.city || '',
        state: event.state || '',
        country: event.country || 'USA',
        address_line: event.address_line || '',
        website: event.website || '',
        hero_logo_path: event.hero_logo_path || '',
        status: event.status || 'draft'
      });
    } else {
      setFormData({
        title: '',
        start_ts: '',
        end_ts: '',
        city: '',
        state: '',
        country: 'USA',
        address_line: '',
        website: '',
        hero_logo_path: '',
        status: 'draft'
      });
    }
  }, [event, isOpen]);

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