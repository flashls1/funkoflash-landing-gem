import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { BusinessEvent, businessEventsApi } from './data';
import BusinessEventCard from './BusinessEventCard';
import BusinessEventFormDialog from './BusinessEventFormDrawer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PageLayout from '@/components/PageLayout';
import funkoFlashLogo from '@/assets/funko-flash-logo.png';
import { supabase } from '@/integrations/supabase/client';

interface BusinessEventsPageProps {
  language?: 'en' | 'es';
}

const BusinessEventsPage = ({ language = 'en' }: BusinessEventsPageProps) => {
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<BusinessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BusinessEvent | null>(null);
  
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const canEdit = profile?.role === 'admin' || profile?.role === 'staff';

  const handleBackToDashboard = () => {
    if (profile?.role === 'admin') {
      navigate('/dashboard/admin');
    } else if (profile?.role === 'staff') {
      navigate('/dashboard/staff');
    } else {
      navigate('/dashboard/business');
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, statusFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // For business users, load their assigned events (RLS will filter appropriately)
      if (profile?.role === 'business') {
        console.log('BusinessEventsPage: Loading events for business user');
        
        // Get business events assigned to this user - RLS policies will handle the filtering
        const { data: businessEvents, error: businessEventsError } = await supabase
          .from('business_events')
          .select(`
            *,
            business_event_talent(
              talent_id,
              talent_profiles(name)
            ),
            business_event_account(
              business_account_id,
              business_account(name, contact_email)
            )
          `);
        
        console.log('BusinessEventsPage: Business events data:', businessEvents);
        console.log('BusinessEventsPage: Business events error:', businessEventsError);
        
        if (businessEventsError) throw businessEventsError;
        setEvents(businessEvents || []);
      } else {
        // For admin/staff, load all events
        const data = await businessEventsApi.getEvents();
        setEvents(data);
      }
    } catch (error) {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' 
          ? 'Error al cargar los eventos.' 
          : 'Failed to load events.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        (event.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.state || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    setFilteredEvents(filtered);
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: BusinessEvent) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm(language === 'es' 
      ? '¿Estás seguro de que quieres eliminar este evento?' 
      : 'Are you sure you want to delete this event?'
    )) {
      return;
    }

    try {
      await businessEventsApi.deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast({
        title: language === 'es' ? 'Eliminado' : 'Deleted',
        description: language === 'es' 
          ? 'El evento se eliminó correctamente.' 
          : 'Event deleted successfully.',
      });
    } catch (error) {
      toast({
        title: language === 'es' ? 'Error' : 'Error',
        description: language === 'es' 
          ? 'Error al eliminar el evento.' 
          : 'Failed to delete event.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveEvent = (savedEvent: BusinessEvent) => {
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === savedEvent.id ? savedEvent : e));
    } else {
      setEvents(prev => [savedEvent, ...prev]);
    }
  };

  const getStatusCounts = () => {
    return {
      all: events.length,
      draft: events.filter(e => e.status === 'draft').length,
      published: events.filter(e => e.status === 'published').length,
      cancelled: events.filter(e => e.status === 'cancelled').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <PageLayout language={language}>
      <div className="min-h-screen relative">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex flex-col gap-3">
              {/* Back Button */}
              <Button 
                variant="outline" 
                onClick={handleBackToDashboard}
                className="w-fit"
              >
                ← {language === 'es' ? 'Volver al Panel' : profile?.role === 'admin' ? 'Back to Admin Dashboard' : 'Back to Dashboard'}
              </Button>
              
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {language === 'es' ? 'Eventos de negocio' : 'Business Events'}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {language === 'es' 
                    ? 'Gestiona y organiza los eventos de negocio' 
                    : 'Manage and organize business events'
                  }
                </p>
              </div>
            </div>
            
            {canEdit && (
              <Button onClick={handleCreateEvent}>
                <PlusIcon className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Agregar evento' : 'Add Event'}
              </Button>
            )}
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="text-center p-4 rounded-lg border bg-white">
                <div className="text-2xl font-bold text-black">{count}</div>
                <div className="text-sm text-black capitalize">
                  {status === 'all' 
                    ? (language === 'es' ? 'Total' : 'Total')
                    : status === 'draft'
                    ? (language === 'es' ? 'Borradores' : 'Draft')
                    : status === 'published'
                    ? (language === 'es' ? 'Publicados' : 'Published')
                    : (language === 'es' ? 'Cancelados' : 'Cancelled')
                  }
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'es' ? 'Buscar eventos...' : 'Search events...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <FilterIcon className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === 'es' ? 'Todos los estados' : 'All Status'}
                </SelectItem>
                <SelectItem value="draft">
                  {language === 'es' ? 'Borrador' : 'Draft'}
                </SelectItem>
                <SelectItem value="published">
                  {language === 'es' ? 'Publicado' : 'Published'}
                </SelectItem>
                <SelectItem value="cancelled">
                  {language === 'es' ? 'Cancelado' : 'Cancelled'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {language === 'es' ? 'Cargando eventos...' : 'Loading events...'}
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? (language === 'es' ? 'No se encontraron eventos.' : 'No events found.')
                  : (language === 'es' 
                    ? 'No hay eventos todavía. Usa el botón "Agregar evento" arriba para crear tu primer evento.' 
                    : 'No events yet. Use the "Add Event" button above to create your first event.')
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <BusinessEventCard
                  key={event.id}
                  event={event}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                  canEdit={canEdit}
                  language={language}
                />
              ))}
            </div>
          )}

          {/* Form Dialog */}
          <BusinessEventFormDialog
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            event={editingEvent}
            onSave={handleSaveEvent}
            language={language}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default BusinessEventsPage;