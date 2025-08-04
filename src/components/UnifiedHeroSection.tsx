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

  // Only show content after loading is complete
  const heroTitle = loading ? '' : settings.hero?.title || '';
  const heroSubtitle = loading ? '' : settings.hero?.subtitle || '';
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

  // Preload and manage media changes to prevent caching flashes
  useEffect(() => {
    if (heroMedia && heroMedia !== currentMediaUrl) {
      setMediaLoaded(false);
      
      if (mediaType === 'image') {
        // Add cache-busting parameter to force fresh load for images
        const mediaUrl = heroMedia.includes('?') 
          ? `${heroMedia}&t=${Date.now()}` 
          : `${heroMedia}?t=${Date.now()}`;
        
        const img = new Image();
        img.onload = () => {
          setCurrentMediaUrl(mediaUrl);
          setMediaLoaded(true);
        };
        img.onerror = () => {
          // Fallback to original URL if cache-busted version fails
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            setCurrentMediaUrl(heroMedia);
            setMediaLoaded(true);
          };
          fallbackImg.src = heroMedia;
        };
        img.src = mediaUrl;
      } else {
        // For videos, set URL directly
        setCurrentMediaUrl(heroMedia);
        setMediaLoaded(true);
      }
    }
  }, [heroMedia, currentMediaUrl, mediaType]);

  // Don't render anything if still loading or no content to show
  if (loading || (!heroTitle && !heroSubtitle && !heroMedia)) {
    return null;
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
      
      {/* Content */}
      {(heroTitle || heroSubtitle) && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              {heroTitle && (
                <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto drop-shadow-lg">
                  {heroTitle}
                </h1>
              )}
              {heroSubtitle && (
                <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                  {heroSubtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UnifiedHeroSection;