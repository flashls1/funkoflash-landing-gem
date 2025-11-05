import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, ExternalLink, Download, CalendarDays, Sparkles } from "lucide-react";
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
  venue_name: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  ticket_url: string | null;
  image_url: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
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
        .from("public_events")
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
      `LOCATION:${[event.venue_name, event.location_city, event.location_state, event.location_country].filter(Boolean).join(', ')}`,
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
    const location = [event.venue_name, event.location_city, event.location_state, event.location_country].filter(Boolean).join(' ');
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || categoryFilter === event.status;
    
    return matchesSearch && matchesCategory;
  });

  const upcomingEvents = filteredEvents.filter(event => 
    isAfter(new Date(event.event_date), new Date())
  );
  
  const pastEvents = filteredEvents
    .filter(event => !isAfter(new Date(event.event_date), new Date()))
    .slice(-24); // Latest 24 past events

  const categories = Array.from(new Set(events.map(event => event.status).filter(Boolean)));

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 50,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 80,
        damping: 15
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="container mx-auto px-4 py-12">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[...Array(6)].map((_, i) => (
              <motion.div 
                key={i}
                variants={cardVariants}
              >
                <div className="aspect-square bg-muted animate-pulse rounded-2xl shadow-lg" />
              </motion.div>
            ))}
          </motion.div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      {/* Background wraps hero + content */}
      <div 
        className="pt-[5px]"
        style={{
          backgroundImage: 'var(--site-background)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <UnifiedHeroSection 
            language={language} 
            className="rounded-2xl overflow-hidden border-2"
            style={{ borderColor: 'hsl(0 0% 100%)' }}
          />
        </motion.div>
        
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder={content[language].searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-card/90 backdrop-blur-sm border-border shadow-lg"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="max-w-xs bg-card/90 backdrop-blur-sm border-border shadow-lg">
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
          </motion.div>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <motion.div 
              className="mb-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 mb-8"
              >
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {content[language].upcomingTitle}
                </h2>
              </motion.div>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {upcomingEvents.map((event) => (
                  <motion.div key={event.id} variants={cardVariants}>
                    <EventCard event={event} onClick={setSelectedEvent} />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 mb-8"
              >
                <div className="p-3 bg-muted/50 rounded-xl">
                  <CalendarDays className="w-6 h-6 text-muted-foreground" />
                </div>
                <h2 className="text-3xl font-bold text-muted-foreground">
                  {content[language].pastTitle}
                </h2>
              </motion.div>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {pastEvents.map((event) => (
                  <motion.div key={event.id} variants={cardVariants}>
                    <EventCard event={event} onClick={setSelectedEvent} isPast />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {filteredEvents.length === 0 && (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto shadow-lg border border-border">
                <Calendar className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">{content[language].noEventsText}</p>
              </div>
            </motion.div>
          )}
        </div>

        <Footer language={language} />
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
            <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-sm border-border">
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {selectedEvent.image_url && (
                  <div className="aspect-video relative overflow-hidden rounded-lg">
                    <img
                      src={selectedEvent.image_url}
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
                  {selectedEvent.start_time && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {selectedEvent.start_time}
                    </div>
                  )}
                  {(selectedEvent.venue_name || selectedEvent.location_city) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {[selectedEvent.venue_name, selectedEvent.location_city, selectedEvent.location_state, selectedEvent.location_country].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>

                {selectedEvent.description && (
                  <p className="text-muted-foreground">{selectedEvent.description}</p>
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
                  {selectedEvent.ticket_url && (
                    <Button variant="outline" asChild>
                      <a href={selectedEvent.ticket_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Get Tickets
                      </a>
                    </Button>
                  )}
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
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
    <motion.div 
      className={`group cursor-pointer rounded-2xl overflow-hidden border border-border bg-card/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 ${
        isPast ? 'opacity-75' : ''
      }`}
      onClick={() => onClick(event)}
      whileHover={{ y: -8 }}
    >
      <div className="aspect-square relative overflow-hidden">
        {event.image_url ? (
          <>
            <motion.img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-primary" />
          </div>
        )}
        {event.status && event.status !== 'published' && (
          <Badge className="absolute top-4 left-4 shadow-lg" variant="secondary">
            {event.status}
          </Badge>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="font-bold text-xl mb-3 line-clamp-2 text-foreground">{event.title}</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            {format(new Date(event.event_date), "MMM d, yyyy")}
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            {event.start_time || format(new Date(event.event_date), "h:mm a")}
          </div>
          {(event.venue_name || event.location_city) && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <span className="truncate">{[event.venue_name, event.location_city].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}