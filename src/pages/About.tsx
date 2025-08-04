import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
import { useSiteDesign } from "@/hooks/useSiteDesign";

const About = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { setCurrentPage } = useSiteDesign();

  useEffect(() => {
    setCurrentPage('about');
  }, [setCurrentPage]);

  const content = {
    en: {
      heroTitle: "About Funko Flash",
      heroSubtitle: "Your Premier Voice Acting and Content Creation Studio",
      aboutTitle: "Our Story",
      aboutText: "Welcome to Funko Flash, where creativity meets excellence in voice acting and content creation. Founded with a passion for bringing characters to life and telling compelling stories, we've built a community of talented voice actors, content creators, and industry professionals.",
      missionTitle: "Our Mission",
      missionText: "To provide exceptional voice acting services and create engaging content that resonates with audiences worldwide. We believe in the power of voice to transform stories, brands, and experiences.",
      teamTitle: "Our Team",
      teamText: "Our diverse team of voice actors and content creators brings years of experience and unlimited creativity to every project. From character voices to commercial narration, we deliver professional quality that exceeds expectations.",
      valuesTitle: "Our Values",
      valuesText: "Excellence, creativity, professionalism, and collaboration are at the heart of everything we do. We're committed to delivering outstanding results while fostering a supportive community for our talent and clients."
    },
    es: {
      heroTitle: "Acerca de Funko Flash",
      heroSubtitle: "Tu Estudio Premier de Actuación de Voz y Creación de Contenido",
      aboutTitle: "Nuestra Historia",
      aboutText: "Bienvenido a Funko Flash, donde la creatividad se encuentra con la excelencia en actuación de voz y creación de contenido. Fundado con una pasión por dar vida a los personajes y contar historias convincentes, hemos construido una comunidad de talentosos actores de voz, creadores de contenido y profesionales de la industria.",
      missionTitle: "Nuestra Misión",
      missionText: "Brindar servicios excepcionales de actuación de voz y crear contenido atractivo que resuene con audiencias en todo el mundo. Creemos en el poder de la voz para transformar historias, marcas y experiencias.",
      teamTitle: "Nuestro Equipo",
      teamText: "Nuestro diverso equipo de actores de voz y creadores de contenido aporta años de experiencia y creatividad ilimitada a cada proyecto. Desde voces de personajes hasta narración comercial, entregamos calidad profesional que supera las expectativas.",
      valuesTitle: "Nuestros Valores",
      valuesText: "La excelencia, creatividad, profesionalismo y colaboración están en el corazón de todo lo que hacemos. Estamos comprometidos a entregar resultados sobresalientes mientras fomentamos una comunidad de apoyo para nuestro talento y clientes."
    }
  };

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        backgroundImage: "url('/lovable-uploads/bb29cf4b-64ec-424f-8221-3b283256e06d.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <Navigation language={language} setLanguage={setLanguage} />
      
      {/* Hero Section */}
      <UnifiedHeroSection language={language} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16 space-y-16">
        {/* About Section */}
        <section className="bg-card/80 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-border">
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            {content[language].aboutTitle}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {content[language].aboutText}
          </p>
        </section>

        {/* Mission Section */}
        <section className="bg-card/80 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-border">
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            {content[language].missionTitle}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {content[language].missionText}
          </p>
        </section>

        {/* Team Section */}
        <section className="bg-card/80 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-border">
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            {content[language].teamTitle}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {content[language].teamText}
          </p>
        </section>

        {/* Values Section */}
        <section className="bg-card/80 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-border">
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            {content[language].valuesTitle}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {content[language].valuesText}
          </p>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-card/80 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-border">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              {language === 'en' ? 'Ready to Work Together?' : '¿Listo para Trabajar Juntos?'}
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              {language === 'en' 
                ? 'Get in touch with us to discuss your next project.'
                : 'Ponte en contacto con nosotros para discutir tu próximo proyecto.'
              }
            </p>
            <Button 
              variant="funko" 
              size="lg"
              onClick={() => window.location.href = '/contact'}
            >
              {language === 'en' ? 'Contact Us' : 'Contáctanos'}
            </Button>
          </div>
        </section>
      </main>

      <Footer language={language} />
    </div>
  );
};

export default About;