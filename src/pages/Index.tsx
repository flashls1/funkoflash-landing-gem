import { useState } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import ContentTiles from "@/components/ContentTiles";
import Footer from "@/components/Footer";

const Index = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        backgroundImage: 'var(--site-background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <Navigation language={language} setLanguage={setLanguage} />
      <HeroSection language={language} />
      <ContentTiles language={language} />
      <Footer language={language} />
    </div>
  );
};

export default Index;