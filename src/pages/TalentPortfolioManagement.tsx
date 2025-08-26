import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { TalentAssetsManager } from '@/features/talent-assets/TalentAssetsManager';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useBackgroundManager } from '@/hooks/useBackgroundManager';

const TalentPortfolioManagement: React.FC = () => {
  const { profile } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { getBackgroundStyle } = useBackgroundManager();
  const navigate = useNavigate();

  const content = {
    en: {
      title: "Portfolio Management",
      description: "Manage your portfolio assets and showcase your work",
      backToDashboard: profile?.role === 'admin' ? "Back to Admin Dashboard" : "Back to Dashboard"
    },
    es: {
      title: "Gestión de Portafolio",
      description: "Gestiona los recursos de tu portafolio y muestra tu trabajo",
      backToDashboard: profile?.role === 'admin' ? "Volver al Panel de Administración" : "Volver al Panel"
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen" style={getBackgroundStyle()}>
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard/talent')}
              className="w-fit"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.backToDashboard}
            </Button>
            
            <div className="text-center">
              <h1 className="text-4xl font-bold text-primary mb-2">
                {t.title}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t.description}
              </p>
            </div>
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