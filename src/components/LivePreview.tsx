import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import HeroSection from '@/components/HeroSection';
import DynamicHeroSection from '@/components/DynamicHeroSection';
import ContentTiles from '@/components/ContentTiles';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { useSiteDesign } from '@/hooks/useSiteDesign';
import * as React from 'react';

interface LivePreviewProps {
  currentPage: string;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const PageComponentWrapper = ({ pageName, language }: { pageName: string; language: 'en' | 'es' }) => {
  const { setCurrentPage } = useSiteDesign();
  
  // Set current page for design system context
  React.useEffect(() => {
    setCurrentPage(pageName);
  }, [pageName, setCurrentPage]);

  const fallbackContent = {
    home: {
      title: language === 'en' ? 'Book Top Voice Talent & Shop Exclusive Signed Funko Pops' : 'Contrata a los Mejores Talentos de Voz y Compra Funko Pops Firmados Exclusivos',
      subtitle: language === 'en' ? 'Connect with legendary voice actors like Mario Castañeda and René García. Discover authentic signed collectibles from your favorite characters.' : 'Conecta con actores de voz legendarios como Mario Castañeda y René García. Descubre coleccionables firmados auténticos de tus personajes favoritos.'
    },
    about: {
      title: language === 'en' ? 'About Us' : 'Acerca de Nosotros',
      subtitle: language === 'en' ? 'Learn more about our story and mission' : 'Conoce más sobre nuestra historia y misión'
    },
    contact: {
      title: language === 'en' ? 'Contact Us' : 'Contáctanos',
      subtitle: language === 'en' ? 'Get in touch with our team' : 'Ponte en contacto con nuestro equipo'
    },
    shop: {
      title: language === 'en' ? 'Shop' : 'Tienda',
      subtitle: language === 'en' ? 'Discover our exclusive products' : 'Descubre nuestros productos exclusivos'
    },
    events: {
      title: language === 'en' ? 'Events' : 'Eventos',
      subtitle: language === 'en' ? 'Join us at upcoming events' : 'Únete a nosotros en próximos eventos'
    },
    'talent-directory': {
      title: language === 'en' ? 'Talent Directory' : 'Directorio de Talentos',
      subtitle: language === 'en' ? 'Meet our amazing voice talent' : 'Conoce a nuestros increíbles talentos de voz'
    }
  };

  const content = fallbackContent[pageName as keyof typeof fallbackContent] || fallbackContent.home;

  if (pageName === 'home') {
    return (
      <div className="min-h-screen">
        <HeroSection language={language} />
        <ContentTiles language={language} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DynamicHeroSection
        language={language}
        fallbackTitle={content.title}
        fallbackSubtitle={content.subtitle}
        className="relative h-[400px] flex items-center justify-center overflow-hidden"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            {content.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {content.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export const LivePreview = ({ currentPage }: LivePreviewProps) => {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  const getViewportStyles = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <h3 className="font-semibold text-lg">Live Preview</h3>
        <div className="flex items-center gap-2">
          {/* Viewport Controls */}
          <div className="flex rounded-lg border bg-background">
            <Button
              variant={viewport === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewport('desktop')}
              className="rounded-r-none"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewport === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewport('tablet')}
              className="rounded-none border-x"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={viewport === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewport('mobile')}
              className="rounded-l-none"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          {/* Language Toggle */}
          <div className="flex rounded-lg border bg-background">
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="rounded-r-none text-xs"
            >
              EN
            </Button>
            <Button
              variant={language === 'es' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('es')}
              className="rounded-l-none text-xs"
            >
              ES
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 p-4 bg-muted/30 overflow-auto">
        <div 
          className={cn(
            "bg-background rounded-lg shadow-lg overflow-hidden transition-all duration-300",
            getViewportStyles()
          )}
          style={{
            backgroundImage: 'var(--site-background)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          {/* Navigation */}
          <Navigation language={language} setLanguage={setLanguage} />
          
          {/* Page Content */}
          <PageComponentWrapper pageName={currentPage} language={language} />
          
          {/* Footer */}
          <Footer language={language} />
        </div>
      </div>
    </div>
  );
};