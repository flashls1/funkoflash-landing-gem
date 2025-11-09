import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
import { useLanguage } from "@/hooks/useLanguage";
import { useSiteDesign } from "@/hooks/useSiteDesign";
import { Heart, Target, Users, Award } from "lucide-react";

const About = () => {
  const { language, setLanguage } = useLanguage();
  const { setCurrentPage } = useSiteDesign();
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentPage('about');
  }, [setCurrentPage]);

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

        {/* About Section */}
        <motion.section 
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto glass glass-hover p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-neon-orange text-glow-orange mb-6 text-center text-neon flex items-center justify-center gap-3">
              <Heart className="w-8 h-8" />
              {language === 'en' ? 'About FunkoFlash' : 'Sobre FunkoFlash'}
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              {language === 'en'
                ? "FunkoFlash is your premier destination for connecting with talented voice actors and content creators. We specialize in bringing characters to life through authentic voice acting, custom recordings, and memorable fan experiences at conventions worldwide."
                : "FunkoFlash es tu destino principal para conectar con talentosos actores de voz y creadores de contenido. Nos especializamos en dar vida a los personajes a través de actuación de voz auténtica, grabaciones personalizadas y experiencias memorables para los fans en convenciones de todo el mundo."}
            </p>
          </div>
        </motion.section>

        {/* Mission Section */}
        <motion.section 
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="max-w-4xl mx-auto glass glass-hover p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-neon-cyan text-glow-cyan mb-6 text-center text-neon flex items-center justify-center gap-3">
              <Target className="w-8 h-8" />
              {language === 'en' ? 'Our Mission' : 'Nuestra Misión'}
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              {language === 'en'
                ? "To create unforgettable experiences that bridge the gap between fans and the voices behind their favorite characters. We're committed to excellence in talent management, authentic fan interactions, and delivering professional voice acting services."
                : "Crear experiencias inolvidables que conecten a los fans con las voces detrás de sus personajes favoritos. Estamos comprometidos con la excelencia en la gestión de talento, interacciones auténticas con los fans y la entrega de servicios profesionales de actuación de voz."}
            </p>
          </div>
        </motion.section>

        {/* Team Section */}
        <motion.section 
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="max-w-4xl mx-auto glass glass-hover p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-neon-magenta text-glow-magenta mb-6 text-center text-neon flex items-center justify-center gap-3">
              <Users className="w-8 h-8" />
              {language === 'en' ? 'Our Team' : 'Nuestro Equipo'}
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              {language === 'en'
                ? "Our dedicated team of professionals works tirelessly to ensure every interaction is memorable. From event coordination to talent management, we're passionate about what we do and the community we serve."
                : "Nuestro equipo dedicado de profesionales trabaja incansablemente para asegurar que cada interacción sea memorable. Desde la coordinación de eventos hasta la gestión de talento, somos apasionados por lo que hacemos y la comunidad que servimos."}
            </p>
          </div>
        </motion.section>

        {/* Values Section */}
        <motion.section 
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-neon-yellow text-glow-orange mb-8 text-center text-neon flex items-center justify-center gap-3">
              <Award className="w-8 h-8" />
              {language === 'en' ? 'Our Values' : 'Nuestros Valores'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: language === 'en' ? 'Authenticity' : 'Autenticidad', text: language === 'en' ? 'We believe in genuine connections and authentic experiences for both talent and fans.' : 'Creemos en conexiones genuinas y experiencias auténticas tanto para el talento como para los fans.' },
                { title: language === 'en' ? 'Excellence' : 'Excelencia', text: language === 'en' ? 'We strive for excellence in every project, event, and interaction.' : 'Nos esforzamos por la excelencia en cada proyecto, evento e interacción.' },
                { title: language === 'en' ? 'Community' : 'Comunidad', text: language === 'en' ? 'We foster a welcoming community where fans and creators can connect meaningfully.' : 'Fomentamos una comunidad acogedora donde los fans y creadores pueden conectar de manera significativa.' },
                { title: language === 'en' ? 'Innovation' : 'Innovación', text: language === 'en' ? 'We embrace new technologies and creative approaches to enhance fan experiences.' : 'Adoptamos nuevas tecnologías y enfoques creativos para mejorar las experiencias de los fans.' }
              ].map((value, i) => (
                <motion.div 
                  key={i}
                  className="glass glass-hover p-6"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-xl font-semibold text-neon-cyan mb-3 text-neon">{value.title}</h3>
                  <p className="text-white/80">{value.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="max-w-2xl mx-auto text-center glass glass-hover p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-neon-orange text-glow-orange mb-6 text-neon">
              {language === 'en' ? 'Ready to Connect?' : '¿Listo para Conectar?'}
            </h2>
            <p className="text-lg text-white/90 mb-8">
              {language === 'en'
                ? "Whether you're a fan looking for a unique experience or a business seeking professional voice talent, we're here to help."
                : "Ya seas un fan buscando una experiencia única o un negocio buscando talento de voz profesional, estamos aquí para ayudar."}
            </p>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button 
                size="lg"
                onClick={() => navigate('/contact')}
                className="text-lg bg-gradient-to-r from-neon-orange to-neon-magenta text-white glow-orange text-neon hover:scale-105 transition-transform"
              >
                {language === 'en' ? 'Get In Touch' : 'Ponte en Contacto'}
              </Button>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </PageLayout>
  );
};

export default About;
