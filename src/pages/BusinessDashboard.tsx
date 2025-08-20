
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Globe, Users, Plus, Building, BarChart3, Target } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  activeProjects: number;
  teamMembers: number;
}

const BusinessDashboard = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    activeProjects: 0,
    teamMembers: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const content = {
    en: {
      title: "Business Dashboard",
      subtitle: "Manage your business events and projects",
      overview: "Overview",
      totalEvents: "Total Events",
      upcomingEvents: "Upcoming Events",
      activeProjects: "Active Projects",
      teamMembers: "Team Members",
      recentEvents: "Recent Events",
      viewAllEvents: "View All Events",
      createEvent: "Create Event",
      noEvents: "No events found",
      noEventsDescription: "Create your first business event to get started",
      loading: "Loading dashboard...",
      website: "Visit Website",
      contact: "Contact"
    },
    es: {
      title: "Panel Empresarial",
      subtitle: "Gestiona tus eventos empresariales y proyectos",
      overview: "Resumen",
      totalEvents: "Total de Eventos",
      upcomingEvents: "Próximos Eventos",
      activeProjects: "Proyectos Activos",
      teamMembers: "Miembros del Equipo",
      recentEvents: "Eventos Recientes",
      viewAllEvents: "Ver Todos los Eventos",
      createEvent: "Crear Evento",
      noEvents: "No se encontraron eventos",
      noEventsDescription: "Crea tu primer evento empresarial para comenzar",
      loading: "Cargando panel...",
      website: "Visitar Sitio Web",
      contact: "Contacto"
    }
  };

  const t = content[language];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile?.role !== 'business') {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [user, profile, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // For now, we'll show placeholder data until types are updated
      console.log('Fetching business dashboard data...');
      
      // Simulate loading
      setTimeout(() => {
        setStats({
          totalEvents: 0,
          upcomingEvents: 0,
          activeProjects: 0,
          teamMembers: 1
        });
        setEvents([]);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date TBD';
    try {
      return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(new Date(dateString));
    } catch {
      return 'Date TBD';
    }
  };

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
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/business-events')} variant="outline">
              {t.viewAllEvents}
            </Button>
            <Button onClick={() => navigate('/business-events')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t.createEvent}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.totalEvents}</p>
                  <p className="text-2xl font-bold">{stats.totalEvents}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.upcomingEvents}</p>
                  <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.activeProjects}</p>
                  <p className="text-2xl font-bold">{stats.activeProjects}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.teamMembers}</p>
                  <p className="text-2xl font-bold">{stats.teamMembers}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t.recentEvents}</CardTitle>
                <CardDescription>Latest business events you're involved in</CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate('/business-events')}>
                {t.viewAllEvents}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t.noEvents}</h3>
                <p className="text-muted-foreground mb-4">{t.noEventsDescription}</p>
                <Button onClick={() => navigate('/business-events')} className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  {t.createEvent}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.slice(0, 6).map((event) => (
                  <Card key={event.id} className="group hover:shadow-md transition-shadow cursor-pointer">
                    {event.logo_url && (
                      <div className="aspect-[16/9] overflow-hidden rounded-t-lg">
                        <img
                          src={event.logo_url}
                          alt={event.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{event.name || 'Untitled Event'}</h3>
                      
                      {event.start_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(event.start_date)}</span>
                        </div>
                      )}
                      
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {event.website && (
                          <Badge variant="secondary" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {t.website}
                          </Badge>
                        )}
                        {(event.contact_name || event.contact_email || event.contact_phone) && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {t.contact}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer language={language} />
    </div>
  );
};

export default BusinessDashboard;
