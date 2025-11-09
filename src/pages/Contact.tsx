import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
import { useLanguage } from "@/hooks/useLanguage";
import { useSiteDesign } from "@/hooks/useSiteDesign";

const Contact = () => {
  const { language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const { setCurrentPage } = useSiteDesign();

  useEffect(() => {
    setCurrentPage('contact');
  }, [setCurrentPage]);

  const content = {
    en: {
      getInTouchTitle: "Get In Touch",
      getInTouchText: "Ready to bring your project to life? We'd love to hear from you.",
      contactFormTitle: "Send Us a Message",
      nameLabel: "Full Name",
      emailLabel: "Email Address",
      subjectLabel: "Subject",
      messageLabel: "Message",
      sendButton: "Send Message",
      contactInfoTitle: "Contact Information",
      officeHours: "Office Hours",
      mondayFriday: "Monday - Friday: 9:00 AM - 6:00 PM PST",
      weekend: "Weekend: By Appointment Only"
    },
    es: {
      getInTouchTitle: "Ponte en Contacto",
      getInTouchText: "¿Listo para dar vida a tu proyecto? Nos encantaría saber de ti.",
      contactFormTitle: "Envíanos un Mensaje",
      nameLabel: "Nombre Completo",
      emailLabel: "Dirección de Email",
      subjectLabel: "Asunto",
      messageLabel: "Mensaje",
      sendButton: "Enviar Mensaje",
      contactInfoTitle: "Información de Contacto",
      officeHours: "Horario de Oficina",
      mondayFriday: "Lunes - Viernes: 9:00 AM - 6:00 PM PST",
      weekend: "Fin de Semana: Solo con Cita Previa"
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(language === 'en' ? 'Message sent successfully!' : '¡Mensaje enviado exitosamente!');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
        
        <main className="max-w-6xl mx-auto px-4 py-16">
          {/* Intro Section */}
          <motion.section 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="glass glass-hover p-8 lg:p-12">
              <h2 className="text-4xl font-bold mb-6 text-neon-orange text-glow-orange text-neon">
                {content[language].getInTouchTitle}
              </h2>
              <p className="text-lg text-white/90 leading-relaxed max-w-3xl mx-auto">
                {content[language].getInTouchText}
              </p>
            </div>
          </motion.section>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="glass glass-hover h-full">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2 text-neon-cyan text-neon">
                    <Send className="w-6 h-6" />
                    {content[language].contactFormTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {[
                      { id: 'name', label: content[language].nameLabel, type: 'text' },
                      { id: 'email', label: content[language].emailLabel, type: 'email' },
                      { id: 'subject', label: content[language].subjectLabel, type: 'text' }
                    ].map((field, i) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                      >
                        <Label htmlFor={field.id} className="text-white/90">{field.label}</Label>
                        <Input
                          id={field.id}
                          name={field.id}
                          type={field.type}
                          value={formData[field.id as keyof typeof formData]}
                          onChange={handleInputChange}
                          required
                          className="mt-2 bg-white/5 border-white/20 text-white"
                        />
                      </motion.div>
                    ))}
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <Label htmlFor="message" className="text-white/90">{content[language].messageLabel}</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={5}
                        className="mt-2 bg-white/5 border-white/20 text-white"
                      />
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button type="submit" className="w-full bg-gradient-to-r from-neon-orange to-neon-magenta text-white glow-orange text-neon">
                        {content[language].sendButton}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="glass glass-hover h-full">
                <CardHeader>
                  <CardTitle className="text-2xl text-neon-cyan text-neon">
                    {content[language].contactInfoTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { icon: Mail, title: 'Email', lines: ['contact@funkoflash.com', 'bookings@funkoflash.com'] },
                    { icon: Phone, title: 'Phone', lines: ['+1 (555) 123-4567', 'Business inquiries only'] },
                    { icon: MapPin, title: 'Studio Location', lines: ['Los Angeles, California', 'Remote services available worldwide'] },
                    { icon: Clock, title: content[language].officeHours, lines: [content[language].mondayFriday, content[language].weekend] }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      className="flex items-start space-x-4 p-4 rounded-xl hover:bg-white/5 transition-colors duration-300"
                      whileHover={{ x: 5 }}
                    >
                      <div className="p-2 bg-neon-cyan/10 rounded-lg">
                        <item.icon className="w-6 h-6 text-neon-cyan" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1 text-neon">{item.title}</h3>
                        {item.lines.map((line, j) => (
                          <p key={j} className="text-white/80 text-sm">{line}</p>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </PageLayout>
  );
};

export default Contact;
