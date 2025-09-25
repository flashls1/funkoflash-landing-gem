import { useSiteDesign } from '@/hooks/useSiteDesign';
import { useState, useEffect } from 'react';
import heroHomeNew from '@/assets/hero-home-1920x240-real.jpg';
import heroShopNew from '@/assets/hero-shop-1920x240-real.jpg';
import heroTalentNew from '@/assets/hero-talent-directory-1920x240-real.jpg';
import heroEventsNew from '@/assets/hero-events-1920x240-real.jpg';
import heroAboutNew from '@/assets/hero-about-1920x240-real.jpg';
import heroContactNew from '@/assets/hero-contact-1920x240-real.jpg';
interface UnifiedHeroSectionProps {
  language: 'en' | 'es';
  className?: string;
}
export const UnifiedHeroSection = ({
  language,
  className
}: UnifiedHeroSectionProps) => {
  const {
    getCurrentPageSettings,
    loading,
    currentPage,
    error
  } = useSiteDesign();
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string>('');
  const [imageLoadError, setImageLoadError] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [usedFallback, setUsedFallback] = useState(false);

  // Get settings after loading is complete
  const settings = getCurrentPageSettings();

  // Only show media when backgroundMedia is set
  const heroMedia = settings.hero?.backgroundMedia || '';
  const mediaType = settings.hero?.mediaType || 'image';
  
  console.log('🎬 UnifiedHeroSection render:', {
    currentPage,
    loading,
    heroMedia,
    mediaType,
    mediaLoaded,
    imageLoadError,
    settingsHasHero: !!settings.hero
  });

  // Determine height based on page (fixed 240px for all pages now)
  const getHeightClass = () => {
    return 'h-[240px]';
  };
  const heightClass = className || `relative ${getHeightClass()} flex items-center justify-center overflow-hidden rounded-2xl`;
  const pageTitles: Record<string, string> = {
    home: 'Home',
    shop: 'Shop',
    'talent-directory': 'Talent Directory',
    events: 'Events',
    about: 'About',
    contact: 'Contact',
    auth: 'Sign In'
  };
  const defaultHeroByPage: Record<string, string> = {
    home: heroHomeNew,
    shop: heroShopNew,
    'talent-directory': heroTalentNew,
    events: heroEventsNew,
    about: heroAboutNew,
    contact: heroContactNew,
    auth: heroHomeNew
  };
  const fallbackUrl = defaultHeroByPage[currentPage] || '';

  // Listen for hero image updates
  useEffect(() => {
    const handleHeroUpdate = () => {
      setForceUpdate(prev => prev + 1);
    };
    window.addEventListener('heroImageUpdate', handleHeroUpdate);
    return () => window.removeEventListener('heroImageUpdate', handleHeroUpdate);
  }, []);
  useEffect(() => {
    // Reset fallback when hero media changes
    setUsedFallback(false);
  }, [heroMedia]);

  // Enhanced media loading with proper error handling and debugging
  useEffect(() => {
    console.log('🔄 Media loading effect triggered:', {
      heroMedia,
      mediaType,
      loading,
      forceUpdate
    });

    // Don't proceed if still loading settings
    if (loading) {
      console.log('⏳ Still loading settings, skipping media load');
      return;
    }
    if (!heroMedia || heroMedia.trim() === '') {
      console.log('❌ No hero media URL provided');
      setCurrentMediaUrl('');
      setMediaLoaded(true);
      setImageLoadError(false);
      return;
    }
    console.log('🎯 Loading hero media:', heroMedia);
    setMediaLoaded(false);
    setImageLoadError(false);
    setCurrentMediaUrl(heroMedia + `?t=${Date.now()}`); // Cache busting

    if (mediaType === 'image') {
      const img = new Image();
      img.onload = () => {
        console.log('✅ Hero image loaded successfully:', heroMedia);
        setMediaLoaded(true);
        setImageLoadError(false);
      };
      img.onerror = error => {
        console.error('❌ Failed to load hero image:', heroMedia, error);
        if (!usedFallback && fallbackUrl) {
          console.log('🛟 Falling back to default hero image:', fallbackUrl);
          setUsedFallback(true);
          setCurrentMediaUrl(fallbackUrl + `?t=${Date.now()}`);
          setImageLoadError(false);
          setMediaLoaded(true);
        } else {
          setImageLoadError(true);
          setMediaLoaded(true);
        }
      };
      img.src = heroMedia + `?t=${Date.now()}`;
    } else if (mediaType === 'video') {
      console.log('🎥 Video media type, setting as loaded');
      setMediaLoaded(true);
      setImageLoadError(false);
    }
  }, [heroMedia, mediaType, loading, forceUpdate]);

  // Show loading state while fetching settings
  if (loading) {
    console.log('⏳ Showing loading placeholder');
    return <section className={heightClass}>
        <div className="absolute inset-0 bg-muted animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading hero section...</div>
        </div>
      </section>;
  }

  // Show error state if there's an error loading settings
  if (error) {
    console.log('❌ Showing error state');
    return <section className={heightClass}>
        <div className="absolute inset-0 bg-destructive/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-destructive">Error loading hero section</div>
        </div>
      </section>;
  }

  // If no media URL, show fallback gradient
  if (!heroMedia || heroMedia.trim() === '') {
    console.log('🎨 No hero media, showing gradient fallback');
    return <section className={heightClass}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
      </section>;
  }
  console.log('🎬 Rendering hero section with media:', {
    currentMediaUrl,
    mediaLoaded,
    imageLoadError
  });
  return <section className={heightClass}>
      {/* Dynamic Background Media */}
      {currentMediaUrl && mediaLoaded && !imageLoadError && <>
          {mediaType === 'video' ? <video 
              className="absolute inset-0 w-full h-full object-cover" 
              autoPlay 
              muted 
              loop 
              playsInline
              preload="metadata"
              onLoadStart={() => console.log('🎥 Video started loading')} 
              onCanPlay={() => console.log('🎥 Video can play')} 
              onError={e => {
                console.error('🎥 Video failed to load:', e);
                setImageLoadError(true);
              }}>
              <source src={currentMediaUrl} type="video/mp4" />
              <source src={currentMediaUrl} type="video/webm" />
            </video> : <img 
              src={currentMediaUrl}
              alt="Hero background"
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />}
        </>}
      
      {/* Loading placeholder */}
      {!mediaLoaded && heroMedia && !imageLoadError && <div className="absolute inset-0 bg-muted animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Loading media...</div>
          </div>
        </div>}
      
      {/* Error fallback */}
      {imageLoadError && <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Media failed to load</div>
          </div>
        </div>}
      
      {/* Overlay - fixed 45% opacity */}
      <div className="absolute inset-0 bg-black/45 transition-opacity duration-500 z-10 my-0 rounded-2xl" />
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <span className="uppercase font-black tracking-wide text-white drop-shadow-md" style={{
        fontFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
        fontSize: 'clamp(28px,4vw,56px)'
      }}>
          {pageTitles[currentPage] || ''}
        </span>
      </div>
    </section>;
};
export default UnifiedHeroSection;