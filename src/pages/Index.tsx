import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
import ContentTiles from "@/components/ContentTiles";
import Footer from "@/components/Footer";
import { useLanguage } from "@/hooks/useLanguage";
import { useSiteDesign } from "@/hooks/useSiteDesign";

const Index = () => {
  const { language, setLanguage } = useLanguage();
  const { setCurrentPage } = useSiteDesign();

  useEffect(() => {
    setCurrentPage('home');
  }, [setCurrentPage]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      <UnifiedHeroSection language={language} />
      <div 
        className="min-h-screen"
        style={{
          backgroundImage: 'var(--site-background)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <ContentTiles language={language} />
        <Footer language={language} />
      </div>
    </div>
  );
};

export default Index;