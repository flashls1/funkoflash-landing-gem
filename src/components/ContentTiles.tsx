import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import voiceTalentImage from "@/assets/tile-voice-talent.jpg";
import signedFunkosImage from "@/assets/tile-signed-funkos.jpg";
import eventsImage from "@/assets/tile-events.jpg";
import customRecordingsImage from "@/assets/tile-custom-recordings.jpg";
import talentManagementImage from "@/assets/tile-talent-management.jpg";
import communityHubImage from "@/assets/tile-community-hub.jpg";

interface ContentTilesProps {
  language: 'en' | 'es';
}

const ContentTiles = ({ language }: ContentTilesProps) => {
  const navigate = useNavigate();
  
  const tiles = [
    {
      id: 1,
      title: { en: "Voice Talent Directory", es: "Directorio de Talento de Voz" },
      description: { 
        en: "Browse our exclusive roster of legendary voice actors", 
        es: "Explora nuestro exclusivo roster de actores de voz legendarios" 
      },
      image: voiceTalentImage,
      link: "/talent-directory"
    },
    {
      id: 2,
      title: { en: "Signed Funko Pops", es: "Funko Pops Firmados" },
      description: { 
        en: "Authentic signed collectibles from your favorite voice actors", 
        es: "Coleccionables firmados auténticos de tus actores de voz favoritos" 
      },
      image: signedFunkosImage,
      link: "/shop"
    },
    {
      id: 3,
      title: { en: "Exclusive Events", es: "Eventos Exclusivos" },
      description: { 
        en: "Meet your favorite voice actors at conventions and special events", 
        es: "Conoce a tus actores de voz favoritos en convenciones y eventos especiales" 
      },
      image: eventsImage,
      link: "/events"
    },
    {
      id: 4,
      title: { en: "Custom Recordings", es: "Grabaciones Personalizadas" },
      description: { 
        en: "Get personalized messages from top voice talent", 
        es: "Obtén mensajes personalizados de los mejores talentos de voz" 
      },
      image: customRecordingsImage,
      link: "/contact"
    },
    {
      id: 5,
      title: { en: "Talent Management", es: "Representación de Talento" },
      description: { 
        en: "Professional representation for voice actors", 
        es: "Representación profesional para actores de voz" 
      },
      image: talentManagementImage,
      link: "/about"
    },
    {
      id: 6,
      title: { en: "Community Hub", es: "Centro Comunitario" },
      description: { 
        en: "Join our community of voice acting enthusiasts", 
        es: "Únete a nuestra comunidad de entusiastas del doblaje" 
      },
      image: communityHubImage,
      link: "/contact"
    }
  ];

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
    <motion.section 
      className="container mx-auto px-4 py-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {tiles.map((tile) => (
          <motion.div key={tile.id} variants={cardVariants}>
            <Card 
              className="glass glass-hover cursor-pointer h-full overflow-hidden group"
              onClick={() => navigate(tile.link)}
            >
              <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                <motion.img
                  src={tile.image}
                  alt={tile.title[language]}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              </div>
              <CardHeader className="relative">
                <CardTitle className="text-xl sm:text-2xl text-neon-cyan group-hover:text-glow-cyan transition-all text-neon">
                  {tile.title[language]}
                </CardTitle>
                <CardDescription className="text-white/80">
                  {tile.description[language]}
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default ContentTiles;
