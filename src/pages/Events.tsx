import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, ExternalLink, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isAfter } from "date-fns";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
import { useSiteDesign } from "@/hooks/useSiteDesign";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  external_url: string | null;
  hero_image_url?: string | null;
  event_date: string;
  tags: string[] | null;
  category: string | null;
  event_talent_assignments?: {
    talent_profiles: {
      name: string;
      slug: string;
    } | null;
  }[];
}

export default function Events() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  
  const { setCurrentPage, getCurrentPageSettings } = useSiteDesign();
  const pageSettings = getCurrentPageSettings();

  useEffect(() => {
    setCurrentPage('events');
    fetchEvents();
  }, [setCurrentPage]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("active", true)
        .order("event_date", { ascending: true });

      if (error) throw error;
      // Add empty talent assignments array to each event since we're not fetching them
      const eventsWithTalentAssignments = (data || []).map(event => ({
        ...event,
        event_talent_assignments: []
      }));
      setEvents(eventsWithTalentAssignments);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateICSFile = (event: Event) => {
    const startDate = new Date(event.event_date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Funko Flash//Event Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@funkoflash.com`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    link.click();
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const upcomingEvents = filteredEvents.filter(event => 
    isAfter(new Date(event.event_date), new Date())
  );
  
  const pastEvents = filteredEvents
    .filter(event => !isAfter(new Date(event.event_date), new Date()))
    .slice(-24); // Latest 24 past events

  const categories = Array.from(new Set(events.map(event => event.category).filter(Boolean)));

  const content = {
    en: {
      heroTitle: "Events",
      heroSubtitle: "Join Us at Conventions, Meetups, and Special Appearances",
      upcomingTitle: "Upcoming Events",
      pastTitle: "Past Events",
      noEventsText: "No events found matching your criteria.",
      searchPlaceholder: "Search events...",
      allCategories: "All Categories"
    },
    es: {
      heroTitle: "Eventos",
      heroSubtitle: "Únete a Nosotros en Convenciones, Encuentros y Apariciones Especiales",
      upcomingTitle: "Próximos Eventos",
      pastTitle: "Eventos Pasados",
      noEventsText: "No se encontraron eventos que coincidan con tus criterios.",
      searchPlaceholder: "Buscar eventos...",
      allCategories: "Todas las Categorías"
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      {/* Hero Section */}
      <UnifiedHeroSection language={language} />

      {/* Main Content with Background */}
      <div 
        style={{
          backgroundImage: 'var(--site-background)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Input
                placeholder={content[language].searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-card/80 backdrop-blur-sm border-border"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="max-w-xs bg-card/80 backdrop-blur-sm border-border">
                  <SelectValue placeholder={content[language].allCategories} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{content[language].allCategories}</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category!}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6 text-foreground">{content[language].upcomingTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} onClick={setSelectedEvent} />
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-muted-foreground">{content[language].pastTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} onClick={setSelectedEvent} isPast />
                ))}
              </div>
            </div>
          )}

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">{content[language].noEventsText}</p>
            </div>
          )}
        </div>

        <Footer language={language} />
      </div>

      {/* Event Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-sm border-border">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.hero_image_url && (
                <div className="aspect-video relative overflow-hidden rounded-lg">
                  <img
                    src={selectedEvent.hero_image_url}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(selectedEvent.event_date), "PPP")}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {format(new Date(selectedEvent.event_date), "p")}
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {selectedEvent.location}
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <p className="text-muted-foreground">{selectedEvent.description}</p>
              )}

              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}

              {selectedEvent.event_talent_assignments && selectedEvent.event_talent_assignments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Featured Talent</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.event_talent_assignments.map((assignment, index) => (
                      assignment.talent_profiles && (
                        <Badge key={index} variant="outline">
                          {assignment.talent_profiles.name}
                        </Badge>
                      )
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => generateICSFile(selectedEvent)}>
                  <Download className="w-4 h-4 mr-2" />
                  Add to Calendar
                </Button>
                {selectedEvent.external_url && (
                  <Button variant="outline" asChild>
                    <a href={selectedEvent.external_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Learn More
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EventCardProps {
  event: Event;
  onClick: (event: Event) => void;
  isPast?: boolean;
}

function EventCard({ event, onClick, isPast = false }: EventCardProps) {
  return (
    <div 
      className={`group cursor-pointer rounded-lg overflow-hidden border border-border bg-card/80 backdrop-blur-sm shadow-lg transition-all duration-200 hover:shadow-xl ${
        isPast ? 'opacity-75' : ''
      }`}
      onClick={() => onClick(event)}
    >
      <div className="aspect-square relative overflow-hidden">
        {event.hero_image_url ? (
          <img
            src={event.hero_image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Calendar className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {event.category && (
          <Badge className="absolute top-2 left-2" variant="secondary">
            {event.category}
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(new Date(event.event_date), "MMM d, yyyy")}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {format(new Date(event.event_date), "h:mm a")}
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}