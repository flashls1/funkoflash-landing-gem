
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { BusinessEventFormDrawer } from '@/components/BusinessEventFormDrawer';
import { BusinessEventCard } from '@/components/BusinessEventCard';

interface BusinessEvent {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  website?: string;
  logo_url?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
}

const BusinessEvents = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BusinessEvent | null>(null);
  
  const { user, profile } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const { toast } = useToast();

  const content = {
    en: {
      title: "Business Events",
      description: "Manage corporate events and business engagements",
      addEvent: "Add Event",
      noEvents: "No business events found",
      noEventsDescription: "Create your first business event to get started",
      loading: "Loading events...",
      error: "Failed to load events"
    },
    es: {
      title: "Eventos Empresariales",
      description: "Gestiona eventos corporativos y compromisos empresariales",
      addEvent: "Agregar Evento",
      noEvents: "No se encontraron eventos empresariales",
      noEventsDescription: "Crea tu primer evento empresarial para comenzar",
      loading: "Cargando eventos...",
      error: "Error al cargar eventos"
    }
  };

  const t = content[language];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!hasPermission('business_events:view')) {
      navigate('/');
      return;
    }

    fetchEvents();
  }, [user, hasPermission, navigate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // For now, we'll show placeholder data until types are updated
      console.log('Fetching business events...');
      
      // Simulate loading and show empty state
      setTimeout(() => {
        setEvents([]);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error fetching business events:', error);
      toast({
        title: "Error",
        description: t.error,
        variant: "destructive",
      });
      setEvents([]);
      setLoading(false);
    }
  };

  const handleEventSaved = () => {
    fetchEvents();
    setIsFormOpen(false);
    setEditingEvent(null);
  };

  const handleEditEvent = (event: BusinessEvent) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleCloneEvent = (event: BusinessEvent) => {
    const clonedEvent = {
      ...event,
      id: '',
      name: `${event.name} (Copy)`,
      created_at: '',
      updated_at: '',
      created_by: undefined,
      updated_by: undefined
    };
    setEditingEvent(clonedEvent);
    setIsFormOpen(true);
  };

  const canManageEvents = hasPermission('business_events:manage') || hasPermission('business_events:edit');

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t.loading}</p>
            </div>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
            <p className="text-muted-foreground">{t.description}</p>
          </div>
          {canManageEvents && (
            <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t.addEvent}
            </Button>
          )}
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t.noEvents}</h3>
              <p className="text-muted-foreground mb-4">{t.noEventsDescription}</p>
              {canManageEvents && (
                <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  {t.addEvent}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <BusinessEventCard
                key={event.id}
                event={event}
                language={language}
                canEdit={canManageEvents}
                onEdit={handleEditEvent}
                onClone={handleCloneEvent}
                onRefresh={fetchEvents}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Drawer */}
      <BusinessEventFormDrawer
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEvent(null);
        }}
        onSaved={handleEventSaved}
        event={editingEvent}
        language={language}
      />

      <Footer language={language} />
    </div>
  );
};

export default BusinessEvents;
