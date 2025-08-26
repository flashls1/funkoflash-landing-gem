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
    zipcode: '',
    website: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [businessAccounts, setBusinessAccounts] = useState<any[]>([]);
  const [talentProfiles, setTalentProfiles] = useState<any[]>([]);
  const [assignedTalents, setAssignedTalents] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  
  // Day-based date and time management
  const [day1Date, setDay1Date] = useState<Date | undefined>(undefined);
  const [day1StartTime, setDay1StartTime] = useState('');
  const [day1EndTime, setDay1EndTime] = useState('');
  const [day2Date, setDay2Date] = useState<Date | undefined>(undefined);
  const [day2StartTime, setDay2StartTime] = useState('');
  const [day2EndTime, setDay2EndTime] = useState('');
  const [day3Date, setDay3Date] = useState<Date | undefined>(undefined);
  const [day3StartTime, setDay3StartTime] = useState('');
  const [day3EndTime, setDay3EndTime] = useState('');
  
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
          zipcode: event.zipcode || '',
          website: event.website || ''
        });
        
        // Set dates and times for Day 1 (use start_ts)
        if (event.start_ts) {
          const start = new Date(event.start_ts);
          setDay1Date(start);
          setDay1StartTime(start.toTimeString().slice(0, 5));
        }
        // For editing existing events, set Day 1 end time from end_ts if available
        if (event.end_ts) {
          const end = new Date(event.end_ts);
          setDay1EndTime(end.toTimeString().slice(0, 5));
        }
        
        // Load daily schedule if available - this takes priority over start_ts/end_ts
        const eventWithSchedule = event as any;
        console.log('🔍 Loading event data for editing:', event);
        console.log('🗓️ Daily schedule data:', eventWithSchedule.daily_schedule);
        
        if (eventWithSchedule.daily_schedule && Array.isArray(eventWithSchedule.daily_schedule)) {
          // Reset all day states first
          setDay1Date(undefined);
          setDay1StartTime('');
          setDay1EndTime('');
          setDay2Date(undefined);
          setDay2StartTime('');
          setDay2EndTime('');
          setDay3Date(undefined);
          setDay3StartTime('');
          setDay3EndTime('');
          
          eventWithSchedule.daily_schedule.forEach((dayData: any) => {
            console.log(`📅 Processing day ${dayData.day}:`, dayData);
            if (dayData.day === 1) {
              if (dayData.date) {
                // Use UTC parsing to avoid timezone shifts
                const day1 = new Date(dayData.date + 'T12:00:00.000Z');
                setDay1Date(day1);
                console.log('✅ Set Day 1 date (UTC):', day1, 'from string:', dayData.date);
              }
              if (dayData.start_time) setDay1StartTime(dayData.start_time);
              if (dayData.end_time) setDay1EndTime(dayData.end_time);
            } else if (dayData.day === 2) {
              if (dayData.date) {
                // Use UTC parsing to avoid timezone shifts
                const day2 = new Date(dayData.date + 'T12:00:00.000Z');
                setDay2Date(day2);
                console.log('✅ Set Day 2 date (UTC):', day2, 'from string:', dayData.date);
              }
              if (dayData.start_time) setDay2StartTime(dayData.start_time);
              if (dayData.end_time) setDay2EndTime(dayData.end_time);
            } else if (dayData.day === 3) {
              if (dayData.date) {
                // Use UTC parsing to avoid timezone shifts
                const day3 = new Date(dayData.date + 'T12:00:00.000Z');
                setDay3Date(day3);
                console.log('✅ Set Day 3 date (UTC):', day3, 'from string:', dayData.date);
              }
              if (dayData.start_time) setDay3StartTime(dayData.start_time);
              if (dayData.end_time) setDay3EndTime(dayData.end_time);
            }
          });
        } else {
          // Fallback to start_ts/end_ts if no daily_schedule
          console.log('📝 No daily schedule found, using start_ts/end_ts as fallback');
          if (event.start_ts) {
            const start = new Date(event.start_ts);
            setDay1Date(start);
            setDay1StartTime(start.toTimeString().slice(0, 5));
            console.log('📅 Fallback Day 1 from start_ts:', start);
          }
          if (event.end_ts) {
            const end = new Date(event.end_ts);
            setDay1EndTime(end.toTimeString().slice(0, 5));
          }
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
          zipcode: '',
          website: ''
        });
        // Reset all day dates and times for new event
        setDay1Date(undefined);
        setDay1StartTime('');
        setDay1EndTime('');
        setDay2Date(undefined);
        setDay2StartTime('');
        setDay2EndTime('');
        setDay3Date(undefined);
        setDay3StartTime('');
        setDay3EndTime('');
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
    // Store the full URL for hero_logo_path
    setFormData(prev => ({
      ...prev,
      hero_logo_path: url
    }));
    
    toast({
      title: language === 'es' ? 'Imagen subida' : 'Image uploaded',
      description: language === 'es' ? 'La imagen se subió correctamente.' : 'Image uploaded successfully.',
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      console.log('=== Starting event save process ===');
      console.log('Form data:', formData);
      console.log('Is editing existing event:', !!event);
      
      let start_ts = null;
      let end_ts = null;
      
      // Use Day 1 as the primary start date/time for compatibility
      if (day1Date && day1StartTime) {
        const start = new Date(day1Date);
        const [hours, minutes] = day1StartTime.split(':');
        start.setHours(parseInt(hours), parseInt(minutes));
        start_ts = start.toISOString();
      } else if (day1Date) {
        // Just date without time
        const start = new Date(day1Date);
        start_ts = start.toISOString();
      }
      
      // Use Day 1 end time or Day 3 date as overall end for compatibility
      if (day1Date && day1EndTime) {
        const end = new Date(day1Date);
        const [endHours, endMinutes] = day1EndTime.split(':');
        end.setHours(parseInt(endHours), parseInt(endMinutes));
        end_ts = end.toISOString();
      } else if (day3Date && day3EndTime) {
        // Use Day 3 as overall end if specified
        const end = new Date(day3Date);
        const [endHours, endMinutes] = day3EndTime.split(':');
        end.setHours(parseInt(endHours), parseInt(endMinutes));
        end_ts = end.toISOString();
      } else if (day3Date) {
        // Just Day 3 date without time
        const end = new Date(day3Date);
        end_ts = end.toISOString();
      }

      // Create clean event data with only business_events table columns
      const eventData = {
        title: formData.title || 'Untitled Event',
        venue: formData.venue || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        address_line: formData.address_line || null,
        zipcode: formData.zipcode || null,
        website: formData.website || null,
        hero_logo_path: formData.hero_logo_path || null,
        status: formData.status || 'draft',
        primary_business_id: formData.primary_business_id || null,
        start_ts,
        end_ts,
        // Store daily schedule with our three days
        daily_schedule: [
          ...(day1Date ? [{
            day: 1,
            date: day1Date.toISOString().split('T')[0],
            start_time: day1StartTime || null,
            end_time: day1EndTime || null
          }] : []),
          ...(day2Date ? [{
            day: 2,
            date: day2Date.toISOString().split('T')[0],
            start_time: day2StartTime || null,
            end_time: day2EndTime || null
          }] : []),
          ...(day3Date ? [{
            day: 3,
            date: day3Date.toISOString().split('T')[0],
            start_time: day3StartTime || null,
            end_time: day3EndTime || null
          }] : [])
        ]
      };

      console.log('Prepared event data for save:', eventData);

      let savedEvent: BusinessEvent;
      try {
        if (event) {
          console.log('Updating existing event with ID:', event.id);
          savedEvent = await businessEventsApi.updateEvent(event.id, eventData);
          console.log('Event updated successfully:', savedEvent);
        } else {
          console.log('Creating new event');
          savedEvent = await businessEventsApi.createEvent(eventData);
          console.log('Event created successfully:', savedEvent);
        }
      } catch (eventSaveError) {
        console.error('Error during event save/update:', eventSaveError);
        throw new Error(`Failed to ${event ? 'update' : 'create'} event: ${eventSaveError.message}`);
      }

      // Handle assignments
      try {
        console.log('Starting assignment process for event:', savedEvent.id);
        await handleAssignments(savedEvent.id);
        console.log('Assignments completed successfully');
      } catch (assignmentError) {
        console.error('Error during assignments:', assignmentError);
        throw new Error(`Event saved but failed to assign talent: ${assignmentError.message}`);
      }

      console.log('=== Event save process completed successfully ===');
      onSave(savedEvent);
      onClose();
      
      toast({
        title: language === 'es' ? 'Guardado' : 'Saved',
        description: language === 'es' 
          ? 'El evento se guardó correctamente.' 
          : 'Event saved successfully.',
      });
    } catch (error) {
      console.error('=== FULL ERROR DETAILS ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      console.error('=== END ERROR DETAILS ===');
      
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' 
          ? `Error al guardar el evento: ${error.message}` 
          : `Failed to save event: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignments = async (eventId: string) => {
    try {
      console.log('Starting assignments for event:', eventId);
      console.log('Assigned talents:', assignedTalents);
      console.log('Primary business ID:', formData.primary_business_id);
      console.log('Team members:', teamMembers);

      // Clear existing assignments only if event exists and we need to update
      if (event) {
        console.log('Clearing existing assignments for event update');
        const existingEvent = await businessEventsApi.getEvents().then(events => 
          events.find(e => e.id === eventId)
        );

        if (existingEvent) {
          const existingTalents = (existingEvent as any).business_event_talent || [];
          const existingAccounts = (existingEvent as any).business_event_account || [];

          // Remove old talent assignments
          for (const talent of existingTalents) {
            try {
              await businessEventsApi.removeTalent(eventId, talent.talent_profiles.id);
              console.log('Removed talent assignment:', talent.talent_profiles.id);
            } catch (removeError) {
              console.warn('Failed to remove talent assignment:', removeError);
            }
          }

          // Remove old business account assignments (including primary)
          for (const account of existingAccounts) {
            try {
              await businessEventsApi.removeBusinessAccount(eventId, account.business_account.id);
              console.log('Removed business account assignment:', account.business_account.id);
            } catch (removeError) {
              console.warn('Failed to remove business account assignment:', removeError);
            }
          }
        }
      }

      // Create a comprehensive list of all business accounts to assign
      const allBusinessAccountsToAssign = new Set<string>();
      
      // Add primary business account
      if (formData.primary_business_id) {
        allBusinessAccountsToAssign.add(formData.primary_business_id);
      }
      
      // Add team member accounts
      teamMembers.forEach(memberId => {
        allBusinessAccountsToAssign.add(memberId);
      });

      console.log('Business accounts to assign:', Array.from(allBusinessAccountsToAssign));

      // Assign all business accounts (ensures all have access to the event)
      for (const businessAccountId of allBusinessAccountsToAssign) {
        try {
          await businessEventsApi.assignBusinessAccount(eventId, businessAccountId);
          console.log('Successfully assigned business account:', businessAccountId);
        } catch (assignError) {
          // Log individual assignment errors but don't fail the whole process
          console.error(`Failed to assign business account ${businessAccountId} to event ${eventId}:`, assignError);
        }
      }

      // Add talent assignments
      console.log('Assigning talents:', assignedTalents);
      for (const talentId of assignedTalents) {
        try {
          await businessEventsApi.assignTalent(eventId, talentId);
          console.log('Successfully assigned talent:', talentId);
        } catch (assignError) {
          // Log individual assignment errors but don't fail the whole process
          console.error(`Failed to assign talent ${talentId} to event ${eventId}:`, assignError);
          // Re-throw talent assignment errors so user knows about them
          throw new Error(`Failed to assign talent: ${assignError.message}`);
        }
      }

      // Log successful assignments for debugging
      console.log(`Successfully assigned ${allBusinessAccountsToAssign.size} business accounts and ${assignedTalents.length} talents to event ${eventId}`);
      
    } catch (error) {
      console.error('Failed to handle assignments:', error);
      throw error; // Re-throw to show user error
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
            
            {/* Three Day Schedule */}
            <div className="space-y-6">
              {/* Day 1 */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-md">
                  {language === 'es' ? 'Día 1' : 'Day 1'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Day 1 Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {language === 'es' ? 'Fecha' : 'Date'}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !day1Date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {day1Date ? format(day1Date, "PPP") : 
                            (language === 'es' ? 'Seleccionar fecha' : 'Pick a date')
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={day1Date}
                          onSelect={setDay1Date}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Day 1 Start Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {language === 'es' ? 'Hora de inicio' : 'Start Time'}
                    </Label>
                    <Input
                      type="time"
                      value={day1StartTime}
                      onChange={(e) => setDay1StartTime(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Day 1 End Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {language === 'es' ? 'Hora de fin' : 'End Time'}
                    </Label>
                    <Input
                      type="time"
                      value={day1EndTime}
                      onChange={(e) => setDay1EndTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Day 2 */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-md">
                  {language === 'es' ? 'Día 2' : 'Day 2'}
                  <span className="text-sm text-muted-foreground font-normal ml-2">
                    ({language === 'es' ? 'Opcional' : 'Optional'})
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Day 2 Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {language === 'es' ? 'Fecha' : 'Date'}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !day2Date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {day2Date ? format(day2Date, "PPP") : 
                            (language === 'es' ? 'Seleccionar fecha' : 'Pick a date')
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={day2Date}
                          onSelect={setDay2Date}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Day 2 Start Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {language === 'es' ? 'Hora de inicio' : 'Start Time'}
                    </Label>
                    <Input
                      type="time"
                      value={day2StartTime}
                      onChange={(e) => setDay2StartTime(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Day 2 End Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {language === 'es' ? 'Hora de fin' : 'End Time'}
                    </Label>
                    <Input
                      type="time"
                      value={day2EndTime}
                      onChange={(e) => setDay2EndTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Day 3 */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-md">
                  {language === 'es' ? 'Día 3' : 'Day 3'}
                  <span className="text-sm text-muted-foreground font-normal ml-2">
                    ({language === 'es' ? 'Opcional' : 'Optional'})
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Day 3 Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {language === 'es' ? 'Fecha' : 'Date'}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !day3Date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {day3Date ? format(day3Date, "PPP") : 
                            (language === 'es' ? 'Seleccionar fecha' : 'Pick a date')
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={day3Date}
                          onSelect={setDay3Date}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Day 3 Start Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {language === 'es' ? 'Hora de inicio' : 'Start Time'}
                    </Label>
                    <Input
                      type="time"
                      value={day3StartTime}
                      onChange={(e) => setDay3StartTime(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Day 3 End Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {language === 'es' ? 'Hora de fin' : 'End Time'}
                    </Label>
                    <Input
                      type="time"
                      value={day3EndTime}
                      onChange={(e) => setDay3EndTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Label htmlFor="zipcode" className="text-sm font-medium">
                  {language === 'es' ? 'Código Postal' : 'Zipcode'}
                </Label>
                <Input
                  id="zipcode"
                  value={formData.zipcode || ''}
                  onChange={(e) => handleInputChange('zipcode', e.target.value)}
                  placeholder={language === 'es' ? 'Código postal' : 'Zipcode'}
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