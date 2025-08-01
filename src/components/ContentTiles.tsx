import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import voiceTalentImage from "@/assets/tile-voice-talent.jpg";
import signedFunkosImage from "@/assets/tile-signed-funkos.jpg";
import eventsImage from "@/assets/tile-events.jpg";
import { ArrowRight, Image as ImageIcon } from "lucide-react";

interface ContentTilesProps {
  language: 'en' | 'es';
}

const ContentTiles = ({ language }: ContentTilesProps) => {
  const content = {
    en: {
      tiles: [
        {
          image: voiceTalentImage,
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
          image: null,
          title: "Custom Recordings",
          description: "Get personalized messages, birthday greetings, or commercial recordings from top voice talent.",
          buttonText: "Request Quote",
          link: "/custom"
        },
        {
          image: null,
          title: "Talent Management",
          description: "Professional representation for voice actors. We handle bookings, negotiations, and career development.",
          buttonText: "Learn More",
          link: "/management"
        },
        {
          image: null,
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
          image: null,
          title: "Grabaciones Personalizadas",
          description: "Obtén mensajes personalizados, felicitaciones de cumpleaños o grabaciones comerciales de los mejores talentos de voz.",
          buttonText: "Solicitar Cotización",
          link: "/custom"
        },
        {
          image: null,
          title: "Representación de Talento",
          description: "Representación profesional para actores de voz. Manejamos contrataciones, negociaciones y desarrollo de carrera.",
          buttonText: "Saber Más",
          link: "/management"
        },
        {
          image: null,
          title: "Centro Comunitario",
          description: "Únete a nuestra comunidad de entusiastas del doblaje. Comparte experiencias, obtén consejos y conecta con otros fanáticos.",
          buttonText: "Unirse a la Comunidad",
          link: "/community"
        }
      ]
    }
  };

  const currentContent = content[language];

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentContent.tiles.map((tile, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 bg-card border-border">
              <div className="aspect-video relative overflow-hidden bg-muted">
                {tile.image ? (
                  <img 
                    src={tile.image} 
                    alt={tile.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-funko-orange/20 to-funko-blue/20">
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
                <h3 className="text-xl font-bold text-foreground">{tile.title}</h3>
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContentTiles;