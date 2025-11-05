import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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
      heroTitle: "Contact Us",
      heroSubtitle: "Let's Create Something Amazing Together",
      getInTouchTitle: "Get In Touch",
      getInTouchText: "Ready to bring your project to life? We'd love to hear from you. Whether you need voice acting services, content creation, or have questions about our work, our team is here to help.",
      contactFormTitle: "Send Us a Message",
      nameLabel: "Full Name",
      emailLabel: "Email Address",
      subjectLabel: "Subject",
      messageLabel: "Message",
      sendButton: "Send Message",
      contactInfoTitle: "Contact Information",
      officeHours: "Office Hours",
      mondayFriday: "Monday - Friday: 9:00 AM - 6:00 PM PST",
      weekend: "Weekend: By Appointment Only",
      responseTime: "Response Time",
      responseText: "We typically respond within 24 hours during business days."
    },
    es: {
      heroTitle: "Contáctanos",
      heroSubtitle: "Creemos Algo Increíble Juntos",
      getInTouchTitle: "Ponte en Contacto",
      getInTouchText: "¿Listo para dar vida a tu proyecto? Nos encantaría saber de ti. Ya sea que necesites servicios de actuación de voz, creación de contenido, o tengas preguntas sobre nuestro trabajo, nuestro equipo está aquí para ayudar.",
      contactFormTitle: "Envíanos un Mensaje",
      nameLabel: "Nombre Completo",
      emailLabel: "Dirección de Email",
      subjectLabel: "Asunto",
      messageLabel: "Mensaje",
      sendButton: "Enviar Mensaje",
      contactInfoTitle: "Información de Contacto",
      officeHours: "Horario de Oficina",
      mondayFriday: "Lunes - Viernes: 9:00 AM - 6:00 PM PST",
      weekend: "Fin de Semana: Solo con Cita Previa",
      responseTime: "Tiempo de Respuesta",
      responseText: "Típicamente respondemos dentro de 24 horas durante días laborables."
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This would typically send the form data to your backend
    console.log('Form submitted:', formData);
    alert(language === 'en' ? 'Message sent successfully!' : '¡Mensaje enviado exitosamente!');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      {/* Background wraps hero + content */}
      <div 
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
            className="mt-[5px] rounded-2xl overflow-hidden border-2"
            style={{ borderColor: 'hsl(0 0% 100%)' }}
          />
        </motion.div>
        
        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-16">
          {/* Intro Section */}
          <motion.section 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-8 lg:p-12 shadow-xl border border-border">
              <h2 className="text-4xl font-bold mb-6 text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {content[language].getInTouchTitle}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
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
              <Card className="bg-card/90 backdrop-blur-sm shadow-xl border border-border h-full">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Send className="w-6 h-6 text-primary" />
                    {content[language].contactFormTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Label htmlFor="name">{content[language].nameLabel}</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label htmlFor="email">{content[language].emailLabel}</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Label htmlFor="subject">{content[language].subjectLabel}</Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <Label htmlFor="message">{content[language].messageLabel}</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={5}
                        className="mt-2"
                      />
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button type="submit" variant="funko" className="w-full">
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
              <Card className="bg-card/90 backdrop-blur-sm shadow-xl border border-border h-full">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {content[language].contactInfoTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <motion.div 
                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-primary/5 transition-colors duration-300"
                    whileHover={{ x: 5 }}
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <p className="text-muted-foreground">contact@funkoflash.com</p>
                      <p className="text-muted-foreground">bookings@funkoflash.com</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-primary/5 transition-colors duration-300"
                    whileHover={{ x: 5 }}
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                      <p className="text-muted-foreground text-sm">Business inquiries only</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-primary/5 transition-colors duration-300"
                    whileHover={{ x: 5 }}
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Studio Location</h3>
                      <p className="text-muted-foreground">Los Angeles, California</p>
                      <p className="text-muted-foreground text-sm">Remote services available worldwide</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-primary/5 transition-colors duration-300"
                    whileHover={{ x: 5 }}
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {content[language].officeHours}
                      </h3>
                      <p className="text-muted-foreground">{content[language].mondayFriday}</p>
                      <p className="text-muted-foreground">{content[language].weekend}</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <h3 className="font-semibold text-foreground mb-2">
                      {content[language].responseTime}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {content[language].responseText}
                    </p>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>

        <Footer language={language} />
      </div>
    </div>
  );
};

export default Contact;