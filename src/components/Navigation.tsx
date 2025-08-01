import { useState } from "react";
import { Button } from "@/components/ui/button";
import funkoFlashLogo from "/lovable-uploads/75e54418-75f9-4698-9a3b-7fd376db7c14.png";
import flagUs from "@/assets/flag-us.png";
import flagMx from "@/assets/flag-mx.png";
import { Globe, Menu, X } from "lucide-react";

interface NavigationProps {
  language: 'en' | 'es';
  setLanguage: (lang: 'en' | 'es') => void;
}

const Navigation = ({ language, setLanguage }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = {
    en: ['HOME', 'SHOP', 'TALENT DIRECTORY', 'EVENTS', 'ABOUT', 'CONTACT'],
    es: ['INICIO', 'TIENDA', 'DIRECTORIO DE TALENTO', 'EVENTOS', 'ACERCA DE', 'CONTACTO']
  };

  const loginText = {
    en: 'LOG IN',
    es: 'INICIAR SESIÓN'
  };

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src={funkoFlashLogo} 
              alt="Funko Flash" 
              className="h-10 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navigationItems[language].map((item, index) => (
                <a
                  key={index}
                  href="#"
                  className="text-foreground hover:text-funko-orange font-medium text-sm tracking-wide transition-colors duration-300 hover:scale-105 transform"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Right Side - Language Toggle & Login */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Toggle */}
            <div className="flex items-center space-x-2 bg-muted p-1 rounded-full">
              <button
                onClick={() => setLanguage('en')}
                className={`p-2 rounded-full transition-all duration-300 ${
                  language === 'en' ? 'bg-funko-orange shadow-funko' : 'hover:bg-background'
                }`}
              >
                <img src={flagUs} alt="English" className="w-5 h-5" />
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`p-2 rounded-full transition-all duration-300 ${
                  language === 'es' ? 'bg-funko-orange shadow-funko' : 'hover:bg-background'
                }`}
              >
                <img src={flagMx} alt="Español" className="w-5 h-5" />
              </button>
            </div>

            {/* Login Button */}
            <Button variant="funko" className="font-medium tracking-wide">
              {loginText[language]}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground hover:text-funko-orange transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigationItems[language].map((item, index) => (
              <a
                key={index}
                href="#"
                className="text-foreground hover:text-funko-orange block px-3 py-2 text-base font-medium transition-colors"
              >
                {item}
              </a>
            ))}
            
            {/* Mobile Language Toggle */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium text-muted-foreground">Language:</span>
              <div className="flex items-center space-x-2 bg-muted p-1 rounded-full">
                <button
                  onClick={() => setLanguage('en')}
                  className={`p-1 rounded-full transition-all duration-300 ${
                    language === 'en' ? 'bg-funko-orange shadow-funko' : ''
                  }`}
                >
                  <img src={flagUs} alt="English" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLanguage('es')}
                  className={`p-1 rounded-full transition-all duration-300 ${
                    language === 'es' ? 'bg-funko-orange shadow-funko' : ''
                  }`}
                >
                  <img src={flagMx} alt="Español" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Login Button */}
            <div className="px-3 py-2">
              <Button variant="funko" className="w-full font-medium tracking-wide">
                {loginText[language]}
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;