import { useSiteDesign } from '@/hooks/useSiteDesign';
import { useState, useEffect } from 'react';

interface DynamicHeroSectionProps {
  language: 'en' | 'es';
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  fallbackImage?: string;
  className?: string;
}

export const DynamicHeroSection = ({ 
  language, 
  fallbackTitle,
  fallbackSubtitle,
  fallbackImage,
  className = "relative h-[240px] flex items-center justify-center overflow-hidden"
}: DynamicHeroSectionProps) => {
  const { getCurrentPageSettings } = useSiteDesign();
  const settings = getCurrentPageSettings();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  // Use site design settings or fallback to defaults
  const heroTitle = settings.hero?.title || fallbackTitle || 'Welcome';
  const heroSubtitle = settings.hero?.subtitle || fallbackSubtitle || 'Your subtitle here';
  const heroImage = settings.hero?.backgroundImage || fallbackImage || '/src/assets/hero-banner-main.jpg';
  const overlayOpacity = settings.hero?.overlayOpacity || 0.5;

  // Preload and manage image changes to prevent caching flashes
  useEffect(() => {
    if (heroImage && heroImage !== currentImageUrl) {
      setImageLoaded(false);
      
      // Add cache-busting parameter to force fresh load
      const imageUrl = heroImage.includes('?') 
        ? `${heroImage}&t=${Date.now()}` 
        : `${heroImage}?t=${Date.now()}`;
      
      const img = new Image();
      img.onload = () => {
        setCurrentImageUrl(imageUrl);
        setImageLoaded(true);
      };
      img.onerror = () => {
        // Fallback to original URL if cache-busted version fails
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setCurrentImageUrl(heroImage);
          setImageLoaded(true);
        };
        fallbackImg.src = heroImage;
      };
      img.src = imageUrl;
    }
  }, [heroImage, currentImageUrl]);

  return (
    <section className={className}>
      {/* Dynamic Background */}
      {currentImageUrl && imageLoaded && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300"
          style={{ 
            backgroundImage: `url(${currentImageUrl})`,
            opacity: imageLoaded ? 1 : 0
          }}
        />
      )}
      
      {/* Loading placeholder to prevent layout shift */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto drop-shadow-lg">
              {heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DynamicHeroSection;