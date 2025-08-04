import { useSiteDesign } from '@/hooks/useSiteDesign';
import { useState, useEffect } from 'react';

interface UnifiedHeroSectionProps {
  language: 'en' | 'es';
  className?: string;
}

export const UnifiedHeroSection = ({ 
  language, 
  className 
}: UnifiedHeroSectionProps) => {
  const { getCurrentPageSettings, loading, currentPage } = useSiteDesign();
  const settings = getCurrentPageSettings();
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string>('');

  // Only show media when backgroundMedia is set - no default text
  const heroMedia = settings.hero?.backgroundMedia || '';
  const mediaType = settings.hero?.mediaType || 'image';
  const overlayOpacity = settings.hero?.overlayOpacity || 0.5;
  const heroHeight = settings.hero?.height || '240';

  // Determine height based on page and settings
  const getHeightClass = () => {
    if (currentPage === 'home') {
      return heroHeight === '480' ? 'h-[480px]' : 'h-[240px]';
    }
    return 'h-[240px]';
  };

  const heightClass = className || `relative ${getHeightClass()} flex items-center justify-center overflow-hidden`;

  // Simplified media loading - direct assignment without cache busting
  useEffect(() => {
    if (!heroMedia) {
      setCurrentMediaUrl('');
      setMediaLoaded(true);
      return;
    }

    setMediaLoaded(false);
    setCurrentMediaUrl(heroMedia);
    
    if (mediaType === 'image') {
      const img = new Image();
      img.onload = () => setMediaLoaded(true);
      img.onerror = (error) => {
        console.error('Failed to load hero image:', heroMedia, error);
        setMediaLoaded(true);
      };
      img.src = heroMedia;
    } else {
      setMediaLoaded(true);
    }
  }, [heroMedia, mediaType]);

  // Show a placeholder if still loading
  if (loading) {
    return (
      <section className={heightClass}>
        <div className="absolute inset-0 bg-muted animate-pulse" />
      </section>
    );
  }

  // If no media, show empty hero section (not null)
  if (!heroMedia) {
    return (
      <section className={heightClass}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
      </section>
    );
  }

  return (
    <section className={heightClass}>
      {/* Dynamic Background Media */}
      {currentMediaUrl && mediaLoaded && (
        <>
          {mediaType === 'video' ? (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              style={{ opacity: mediaLoaded ? 1 : 0 }}
            >
              <source src={currentMediaUrl} type="video/mp4" />
              <source src={currentMediaUrl} type="video/webm" />
            </video>
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-300"
              style={{ 
                backgroundImage: `url(${currentMediaUrl})`,
                opacity: mediaLoaded ? 1 : 0
              }}
            />
          )}
        </>
      )}
      
      {/* Loading placeholder to prevent layout shift */}
      {!mediaLoaded && heroMedia && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* No default content - only show media */}
    </section>
  );
};

export default UnifiedHeroSection;