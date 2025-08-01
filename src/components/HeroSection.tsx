import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";
import { Play, Star, Users } from "lucide-react";

interface HeroSectionProps {
  language: 'en' | 'es';
}

const HeroSection = ({ language }: HeroSectionProps) => {
  const content = {
    en: {
      title: "Book Top Voice Talent & Shop Exclusive Signed Funko Pops",
      subtitle: "Connect with legendary voice actors like Mario Castañeda and René García. Discover authentic signed collectibles from your favorite characters.",
      primaryButton: "Browse Talent",
      secondaryButton: "Shop Collections",
      stats: [
        { icon: Star, value: "50+", label: "Voice Actors" },
        { icon: Users, value: "10K+", label: "Happy Fans" },
        { icon: Play, value: "1000+", label: "Signed Items" }
      ]
    },
    es: {
      title: "Contrata a los Mejores Talentos de Voz y Compra Funko Pops Firmados Exclusivos",
      subtitle: "Conecta con actores de voz legendarios como Mario Castañeda y René García. Descubre coleccionables firmados auténticos de tus personajes favoritos.",
      primaryButton: "Explorar Talento",
      secondaryButton: "Ver Colecciones",
      stats: [
        { icon: Star, value: "50+", label: "Actores de Voz" },
        { icon: Users, value: "10K+", label: "Fans Felices" },
        { icon: Play, value: "1000+", label: "Artículos Firmados" }
      ]
    }
  };

  const currentContent = content[language];

  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBanner})` }}
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-overlay-top" />
      <div className="absolute inset-0 bg-gradient-overlay-bottom" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto drop-shadow-lg">
              {currentContent.title}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              {currentContent.subtitle}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="funko" 
              size="lg" 
              className="text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {currentContent.primaryButton}
            </Button>
            <Button 
              variant="funko-outline" 
              size="lg" 
              className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-funko-orange shadow-lg transition-all duration-300"
            >
              {currentContent.secondaryButton}
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 mt-12">
            {currentContent.stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="flex items-center space-x-3 text-white">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-white/80">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;