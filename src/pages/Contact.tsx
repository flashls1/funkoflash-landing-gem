import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
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
      
      {/* Hero Section */}
      <UnifiedHeroSection language={language} />

      {/* Main Content with Background */}
      <div 
        style={{
          backgroundImage: 'var(--site-background)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-16">
          {/* Intro Section */}
          <section className="text-center mb-16">
            <div className="bg-card/80 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-border">
              <h2 className="text-3xl font-bold mb-6 text-foreground">
                {content[language].getInTouchTitle}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                {content[language].getInTouchText}
              </p>
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="bg-card/80 backdrop-blur-sm shadow-lg border border-border">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {content[language].contactFormTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
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
                  </div>
                  
                  <div>
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
                  </div>
                  
                  <div>
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
                  </div>
                  
                  <div>
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
                  </div>
                  
                  <Button type="submit" variant="funko" className="w-full">
                    {content[language].sendButton}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-card/80 backdrop-blur-sm shadow-lg border border-border">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {content[language].contactInfoTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-funko-orange mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">Email</h3>
                    <p className="text-muted-foreground">contact@funkoflash.com</p>
                    <p className="text-muted-foreground">bookings@funkoflash.com</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-funko-orange mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">Phone</h3>
                    <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    <p className="text-muted-foreground text-sm">Business inquiries only</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-funko-orange mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">Studio Location</h3>
                    <p className="text-muted-foreground">Los Angeles, California</p>
                    <p className="text-muted-foreground text-sm">Remote services available worldwide</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-funko-orange mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {content[language].officeHours}
                    </h3>
                    <p className="text-muted-foreground">{content[language].mondayFriday}</p>
                    <p className="text-muted-foreground">{content[language].weekend}</p>
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    {content[language].responseTime}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {content[language].responseText}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer language={language} />
      </div>
    </div>
  );
};

export default Contact;