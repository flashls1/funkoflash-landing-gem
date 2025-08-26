import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { TalentAssetsManager } from '@/features/talent-assets/TalentAssetsManager';
import { useAuth } from '@/hooks/useAuth';
import { useBackgroundManager } from '@/hooks/useBackgroundManager';

const TalentPortfolioManagement: React.FC = () => {
  const { profile } = useAuth();
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { getBackgroundStyle } = useBackgroundManager();

  return (
    <div className="min-h-screen" style={getBackgroundStyle()}>
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Portfolio Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your portfolio assets and showcase your work
            </p>
          </div>

          {/* Portfolio Content */}
          <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-6">
            <TalentAssetsManager talentId={profile?.id} locale={language} />
          </div>
        </div>
      </div>

      <Footer language={language} />
    </div>
  );
};

export default TalentPortfolioManagement;