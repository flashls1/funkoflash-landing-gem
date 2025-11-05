import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
import { useLanguage } from "@/hooks/useLanguage";
import { useSiteDesign } from "@/hooks/useSiteDesign";
import { Heart, Target, Users, Award } from "lucide-react";

const About = () => {
  const { language, setLanguage } = useLanguage();
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

  const sectionIcons = [Heart, Target, Users, Award];

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
        
        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-16 space-y-16">
          {/* About Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card/90 backdrop-blur-sm rounded-2xl p-8 lg:p-12 shadow-xl border border-border relative overflow-hidden group"
          >
            <motion.div
              className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500"
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  {content[language].aboutTitle}
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {content[language].aboutText}
              </p>
            </div>
          </motion.section>

          {/* Mission Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-card/90 backdrop-blur-sm rounded-2xl p-8 lg:p-12 shadow-xl border border-border relative overflow-hidden group"
          >
            <motion.div
              className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500"
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  {content[language].missionTitle}
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {content[language].missionText}
              </p>
            </div>
          </motion.section>

          {/* Team Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card/90 backdrop-blur-sm rounded-2xl p-8 lg:p-12 shadow-xl border border-border relative overflow-hidden group"
          >
            <motion.div
              className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500"
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  {content[language].teamTitle}
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {content[language].teamText}
              </p>
            </div>
          </motion.section>

          {/* Values Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-card/90 backdrop-blur-sm rounded-2xl p-8 lg:p-12 shadow-xl border border-border relative overflow-hidden group"
          >
            <motion.div
              className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500"
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  {content[language].valuesTitle}
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {content[language].valuesText}
              </p>
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="bg-gradient-to-br from-primary/10 via-card/90 to-primary/5 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-border relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <div className="relative">
                <h2 className="text-4xl font-bold mb-4 text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {language === 'en' ? 'Ready to Work Together?' : '¿Listo para Trabajar Juntos?'}
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  {language === 'en' 
                    ? 'Get in touch with us to discuss your next project.'
                    : 'Ponte en contacto con nosotros para discutir tu próximo proyecto.'
                  }
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="funko" 
                    size="lg"
                    className="shadow-lg"
                    onClick={() => window.location.href = '/contact'}
                  >
                    {language === 'en' ? 'Contact Us' : 'Contáctanos'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.section>
        </main>

        <Footer language={language} />
      </div>
    </div>
  );
};

export default About;