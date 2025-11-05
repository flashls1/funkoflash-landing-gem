import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import voiceTalentImage from "@/assets/tile-voice-talent.jpg";
import signedFunkosImage from "@/assets/tile-signed-funkos.jpg";
import eventsImage from "@/assets/tile-events.jpg";
import customRecordingsImage from "@/assets/tile-custom-recordings.jpg";
import talentManagementImage from "@/assets/tile-talent-management.jpg";
import communityHubImage from "@/assets/tile-community-hub.jpg";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { useSiteDesign } from '@/hooks/useSiteDesign';

interface ContentTilesProps {
  language: 'en' | 'es';
}

const ContentTiles = ({ language }: ContentTilesProps) => {
  // Removed dependency on site design settings for tiles
  // Using static images for better performance and reliability
  const content = {
    en: {
      tiles: [
        {
          image: voiceTalentImage, // Always use static image
          title: "Voice Talent Directory",
          description: "Browse our exclusive roster of legendary voice actors. From anime dubbing to commercial work, find the perfect voice for your project.",
          buttonText: "Explore Talent",
          link: "/talent-directory"
        },
        {
          image: signedFunkosImage,
          title: "Signed Funko Pops",
          description: "Authentic signed collectibles from your favorite voice actors. Each item comes with a certificate of authenticity.",
          buttonText: "Shop Now",
          link: "/shop"
        },
        {
          image: eventsImage,
          title: "Exclusive Events",
          description: "Meet your favorite voice actors at conventions, signings, and special events. Get exclusive access to limited experiences.",
          buttonText: "View Events",
          link: "/events"
        },
        {
          image: customRecordingsImage,
          title: "Custom Recordings",
          description: "Get personalized messages, birthday greetings, or commercial recordings from top voice talent.",
          buttonText: "Request Quote",
          link: "/custom"
        },
        {
          image: talentManagementImage,
          title: "Talent Management",
          description: "Professional representation for voice actors. We handle bookings, negotiations, and career development.",
          buttonText: "Learn More",
          link: "/management"
        },
        {
          image: communityHubImage,
          title: "Community Hub",
          description: "Join our community of voice acting enthusiasts. Share experiences, get tips, and connect with fellow fans.",
          buttonText: "Join Community",
          link: "/community"
        }
      ]
    },
    es: {
      tiles: [
        {
          image: voiceTalentImage,
          title: "Directorio de Talento de Voz",
          description: "Explora nuestro exclusivo roster de actores de voz legendarios. Desde doblaje de anime hasta trabajo comercial, encuentra la voz perfecta para tu proyecto.",
          buttonText: "Explorar Talento",
          link: "/talent-directory"
        },
        {
          image: signedFunkosImage,
          title: "Funko Pops Firmados",
          description: "Coleccionables firmados auténticos de tus actores de voz favoritos. Cada artículo viene con certificado de autenticidad.",
          buttonText: "Comprar Ahora",
          link: "/shop"
        },
        {
          image: eventsImage,
          title: "Eventos Exclusivos",
          description: "Conoce a tus actores de voz favoritos en convenciones, firmas de autógrafos y eventos especiales. Obtén acceso exclusivo a experiencias limitadas.",
          buttonText: "Ver Eventos",
          link: "/events"
        },
        {
          image: customRecordingsImage,
          title: "Grabaciones Personalizadas",
          description: "Obtén mensajes personalizados, felicitaciones de cumpleaños o grabaciones comerciales de los mejores talentos de voz.",
          buttonText: "Solicitar Cotización",
          link: "/custom"
        },
        {
          image: talentManagementImage,
          title: "Representación de Talento",
          description: "Representación profesional para actores de voz. Manejamos contrataciones, negociaciones y desarrollo de carrera.",
          buttonText: "Saber Más",
          link: "/management"
        },
        {
          image: communityHubImage,
          title: "Centro Comunitario",
          description: "Únete a nuestra comunidad de entusiastas del doblaje. Comparte experiencias, obtén consejos y conecta con otros fanáticos.",
          buttonText: "Unirse a la Comunidad",
          link: "/community"
        }
      ]
    }
  };

  const currentContent = content[language];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
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

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {currentContent.tiles.map((tile, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -8 }}
            >
              <Card className="overflow-hidden h-full bg-card/90 backdrop-blur-sm border-border shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <div className="aspect-video relative overflow-hidden bg-muted group">
                  {tile.image ? (
                    <>
                      <motion.img 
                        src={tile.image}
                        alt={tile.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <div className="text-center space-y-2">
                        <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' ? 'Image not uploaded' : 'Imagen no subida'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {tile.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{tile.description}</p>
                  <Button 
                    variant="funko-outline" 
                    className="w-full group"
                    asChild
                  >
                    <a href={tile.link}>
                      {tile.buttonText}
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ContentTiles;