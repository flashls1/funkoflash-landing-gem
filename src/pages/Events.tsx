import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, Download, CalendarDays, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isAfter } from "date-fns";
import PageLayout from "@/components/PageLayout";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
import { useSiteDesign } from "@/hooks/useSiteDesign";
import { useLanguage } from "@/hooks/useLanguage";

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
}

export default function Events() {
  const { language, setLanguage } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  
  const { setCurrentPage } = useSiteDesign();

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
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateICSFile = (event: Event) => {
    const startDate = new Date(event.event_date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
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
    .slice(-24);

  const categories = Array.from(new Set(events.map(event => event.status).filter(Boolean)));

  const content = {
    en: {
      upcomingTitle: "Upcoming Events",
      pastTitle: "Past Events",
      noEventsText: "No events found matching your criteria.",
      searchPlaceholder: "Search events...",
      allCategories: "All Categories"
    },
    es: {
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
      <PageLayout language={language} setLanguage={setLanguage}>
        <div className="container mx-auto px-4 py-12">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[...Array(6)].map((_, i) => (
              <motion.div key={i} variants={cardVariants}>
                <div className="aspect-square glass animate-pulse" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout language={language} setLanguage={setLanguage}>
      <div className="min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <UnifiedHeroSection 
            language={language} 
            className="glass-hover overflow-hidden"
          />
        </motion.div>
        
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder={content[language].searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm glass border-white/20 text-white"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="max-w-xs glass border-white/20 text-white">
                  <SelectValue placeholder={content[language].allCategories} />
                </SelectTrigger>
                <SelectContent className="glass-alt">
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

          {upcomingEvents.length > 0 && (
            <motion.div 
              className="mb-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div className="flex items-center gap-3 mb-8">
                <div className="p-3 glass rounded-xl">
                  <Sparkles className="w-6 h-6 text-neon-cyan" />
                </div>
                <h2 className="text-4xl font-bold text-neon-orange text-glow-orange text-neon">
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

          {pastEvents.length > 0 && (
            <motion.div>
              <motion.div className="flex items-center gap-3 mb-8">
                <div className="p-3 glass rounded-xl">
                  <CalendarDays className="w-6 h-6 text-neon-cyan" />
                </div>
                <h2 className="text-3xl font-bold text-neon-cyan text-glow-cyan text-neon">
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
              <div className="glass glass-hover p-12 max-w-md mx-auto">
                <Calendar className="w-16 h-16 text-neon-cyan mx-auto mb-4" />
                <p className="text-white/80 text-lg">{content[language].noEventsText}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
            <DialogContent className="max-w-2xl glass-alt">
              <DialogHeader>
                <DialogTitle className="text-neon-cyan text-neon">{selectedEvent.title}</DialogTitle>
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
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(selectedEvent.event_date), "PPP")}
                  </div>
                  {selectedEvent.start_time && (
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Clock className="w-4 h-4" />
                      {selectedEvent.start_time}
                    </div>
                  )}
                  {(selectedEvent.venue_name || selectedEvent.location_city) && (
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <MapPin className="w-4 h-4" />
                      {[selectedEvent.venue_name, selectedEvent.location_city, selectedEvent.location_state, selectedEvent.location_country].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>

                {selectedEvent.description && (
                  <p className="text-white/80">{selectedEvent.description}</p>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => generateICSFile(selectedEvent)} className="bg-gradient-to-r from-neon-orange to-neon-magenta text-white glow-orange">
                    <Download className="w-4 h-4 mr-2" />
                    Add to Calendar
                  </Button>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}

function EventCard({ event, onClick, isPast = false }: { event: Event; onClick: (event: Event) => void; isPast?: boolean }) {
  return (
    <motion.div 
      className={`glass glass-hover cursor-pointer group ${isPast ? 'opacity-75' : ''}`}
      onClick={() => onClick(event)}
      whileHover={{ y: -8 }}
    >
      <div className="aspect-square relative overflow-hidden rounded-t-2xl">
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
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-neon-cyan" />
          </div>
        )}
        
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white text-glow-cyan text-neon mb-2">{event.title}</h3>
          <p className="text-sm text-white/80">{format(new Date(event.event_date), "PPP")}</p>
        </div>
      </div>
    </motion.div>
  );
}
