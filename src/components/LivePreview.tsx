import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import HeroSection from '@/components/HeroSection';
import ContentTiles from '@/components/ContentTiles';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

interface LivePreviewProps {
  currentPage: string;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const pageComponents: Record<string, React.ComponentType<{ language: 'en' | 'es' }>> = {
  home: ({ language }) => (
    <div className="min-h-screen">
      <HeroSection language={language} />
      <ContentTiles language={language} />
    </div>
  ),
  about: ({ language }) => (
    <div className="min-h-screen">
      <div className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="absolute inset-0 bg-[url('/src/assets/hero-about.jpg')] bg-cover bg-center opacity-30" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {language === 'en' ? 'About Us' : 'Acerca de Nosotros'}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'en' 
              ? 'Learn more about our story and mission' 
              : 'Conoce más sobre nuestra historia y misión'
            }
          </p>
        </div>
      </div>
    </div>
  ),
  contact: ({ language }) => (
    <div className="min-h-screen">
      <div className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-accent/20 via-background to-primary/20">
        <div className="absolute inset-0 bg-[url('/src/assets/hero-contact.jpg')] bg-cover bg-center opacity-30" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            {language === 'en' ? 'Contact Us' : 'Contáctanos'}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'en' 
              ? 'Get in touch with our team' 
              : 'Ponte en contacto con nuestro equipo'
            }
          </p>
        </div>
      </div>
    </div>
  ),
  shop: ({ language }) => (
    <div className="min-h-screen">
      <div className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-secondary/20 via-background to-accent/20">
        <div className="absolute inset-0 bg-[url('/src/assets/hero-shop.jpg')] bg-cover bg-center opacity-30" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
            {language === 'en' ? 'Shop' : 'Tienda'}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'en' 
              ? 'Discover our exclusive products' 
              : 'Descubre nuestros productos exclusivos'
            }
          </p>
        </div>
      </div>
    </div>
  ),
  events: ({ language }) => (
    <div className="min-h-screen">
      <div className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="absolute inset-0 bg-[url('/src/assets/hero-events.jpg')] bg-cover bg-center opacity-30" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {language === 'en' ? 'Events' : 'Eventos'}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'en' 
              ? 'Join us at upcoming events' 
              : 'Únete a nosotros en próximos eventos'
            }
          </p>
        </div>
      </div>
    </div>
  ),
  'talent-directory': ({ language }) => (
    <div className="min-h-screen">
      <div className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-accent/20 via-background to-secondary/20">
        <div className="absolute inset-0 bg-[url('/src/assets/hero-talent-directory.jpg')] bg-cover bg-center opacity-30" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
            {language === 'en' ? 'Talent Directory' : 'Directorio de Talentos'}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'en' 
              ? 'Meet our amazing voice talent' 
              : 'Conoce a nuestros increíbles talentos de voz'
            }
          </p>
        </div>
      </div>
    </div>
  ),
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

  const PageComponent = pageComponents[currentPage] || pageComponents.home;

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
          <PageComponent language={language} />
          
          {/* Footer */}
          <Footer language={language} />
        </div>
      </div>
    </div>
  );
};