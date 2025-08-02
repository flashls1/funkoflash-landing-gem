import { useSiteDesign } from '@/hooks/useSiteDesign';

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
  className = "relative h-[600px] flex items-center justify-center overflow-hidden"
}: DynamicHeroSectionProps) => {
  const { getCurrentPageSettings } = useSiteDesign();
  const settings = getCurrentPageSettings();

  // Use site design settings or fallback to defaults
  const heroTitle = settings.hero?.title || fallbackTitle || 'Welcome';
  const heroSubtitle = settings.hero?.subtitle || fallbackSubtitle || 'Your subtitle here';
  const heroImage = settings.hero?.backgroundImage || fallbackImage || '';
  const overlayOpacity = settings.hero?.overlayOpacity || 0.5;

  return (
    <section className={className}>
      {/* Dynamic Background */}
      {heroImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
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