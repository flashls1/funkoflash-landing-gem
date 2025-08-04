import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
import ContentTiles from "@/components/ContentTiles";
import Footer from "@/components/Footer";
import { useSiteDesign } from "@/hooks/useSiteDesign";

const Index = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { setCurrentPage } = useSiteDesign();

  useEffect(() => {
    setCurrentPage('home');
  }, [setCurrentPage]);

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
      <UnifiedHeroSection language={language} />
      <ContentTiles language={language} />
      <Footer language={language} />
    </div>
  );
};

export default Index;