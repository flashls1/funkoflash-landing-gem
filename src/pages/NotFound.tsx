import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        backgroundImage: 'var(--site-background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <Navigation language={language} setLanguage={setLanguage} />
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-4">
            {language === 'en' ? 'Oops! Page not found' : '¡Ups! Página no encontrada'}
          </p>
          <a href="/" className="text-blue-500 hover:text-blue-700 underline">
            {language === 'en' ? 'Return to Home' : 'Volver al Inicio'}
          </a>
        </div>
      </div>
      <Footer language={language} />
    </div>
  );
};

export default NotFound;
