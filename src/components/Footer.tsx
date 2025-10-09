import { Instagram, Mail, Phone, MapPin } from "lucide-react";
import funkoFlashLogo from "@/assets/funko-flash-logo.png";
import tiktokLogo from "@/assets/tiktok.svg";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

interface FooterProps {
  language: 'en' | 'es';
}

const Footer = ({ language }: FooterProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Hide footer on mobile when user is logged in
  if (isMobile && user) {
    return null;
  }

  const content = {
    en: {
      company: "Company",
      links: ["About Us", "Careers", "Press", "Privacy Policy", "Terms of Service"],
      services: "Services",
      serviceLinks: ["Voice Talent Booking", "Signed Collectibles", "Custom Recordings", "Event Management", "Talent Representation"],
      contact: "Contact Us",
      address: "8205 Camp Bowie Road West, Fort Worth, Texas 76116",
      phone: "+1 760 792-3214",
      email: "flash@funkoflash.com",
      newsletter: "Subscribe to our newsletter for exclusive updates and offers",
      subscribe: "Subscribe",
      copyright: "© 2025 Funko Flash. All rights reserved.",
      followUs: "Follow Us"
    },
    es: {
      company: "Empresa",
      links: ["Acerca de Nosotros", "Carreras", "Prensa", "Política de Privacidad", "Términos de Servicio"],
      services: "Servicios",
      serviceLinks: ["Contratación de Talento de Voz", "Coleccionables Firmados", "Grabaciones Personalizadas", "Gestión de Eventos", "Representación de Talento"],
      contact: "Contáctanos",
      address: "8205 Camp Bowie Road West, Fort Worth, Texas 76116",
      phone: "+1 760 792-3214",
      email: "flash@funkoflash.com",
      newsletter: "Suscríbete a nuestro boletín para actualizaciones exclusivas y ofertas",
      subscribe: "Suscribirse",
      copyright: "© 2025 Funko Flash. Todos los derechos reservados.",
      followUs: "Síguenos"
    }
  };

  const currentContent = content[language];

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Logo and Description */}
          <div className="space-y-4">
            <img src={funkoFlashLogo} alt="Funko Flash" className="h-12 w-auto" />
            <p className="text-background/80 text-sm leading-relaxed">
              {language === 'en' 
                ? "Your premier destination for voice talent booking and exclusive signed Funko Pop collectibles." 
                : "Tu destino principal para la contratación de talento de voz y coleccionables exclusivos de Funko Pop firmados."
              }
            </p>
            
            {/* Social Media */}
            <div className="space-y-2">
              <h4 className="font-semibold">{currentContent.followUs}</h4>
              <div className="flex space-x-4">
                <a href="https://instagram.com/therealfunkoflash" className="text-background/60 hover:text-funko-orange transition-colors" aria-label="Instagram @therealfunkoflash">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://www.tiktok.com/@therealfunkoflash" className="text-background/60 hover:text-funko-orange transition-colors" aria-label="TikTok @therealfunkoflash">
                  <img src={tiktokLogo} alt="TikTok" className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-funko-orange">{currentContent.company}</h4>
            <ul className="space-y-2">
              {currentContent.links.map((link, index) => (
                <li key={index}>
                  <a href="#" className="text-background/80 hover:text-funko-orange transition-colors text-sm">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-funko-orange">{currentContent.services}</h4>
            <ul className="space-y-2">
              {currentContent.serviceLinks.map((link, index) => (
                <li key={index}>
                  <a href="#" className="text-background/80 hover:text-funko-orange transition-colors text-sm">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-funko-orange">{currentContent.contact}</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 mt-1 text-funko-orange flex-shrink-0" />
                <span className="text-background/80">{currentContent.address}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-funko-orange flex-shrink-0" />
                <a href={`tel:${currentContent.phone}`} className="text-background/80 hover:text-funko-orange transition-colors">
                  {currentContent.phone}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-funko-orange flex-shrink-0" />
                <a href={`mailto:${currentContent.email}`} className="text-background/80 hover:text-funko-orange transition-colors">
                  {currentContent.email}
                </a>
              </div>
            </div>
          </div>
        </div>


        {/* Copyright */}
        <div className="border-t border-background/20 py-3 text-center">
          <p className="text-background/60 text-sm">{currentContent.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;