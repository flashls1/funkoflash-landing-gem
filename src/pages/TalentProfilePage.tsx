import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { ProfileAccordion } from '@/components/profile/ProfileAccordion';

const TalentProfilePage = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;
    
    if (!user || !profile || profile.role !== 'talent') {
      navigate('/auth');
    }
  }, [user, profile, authLoading, navigate]);

  const content = {
    en: {
      backToDashboard: 'Back to Dashboard',
      profile: 'Profile',
      comingSoon: 'Full Profile Editor Coming Soon',
      description: 'The comprehensive profile management interface is being developed. For now, you can update basic settings through the Settings dialog.',
    },
    es: {
      backToDashboard: 'Volver al Panel',
      profile: 'Perfil',
      comingSoon: 'Editor de Perfil Completo Próximamente',
      description: 'La interfaz completa de gestión de perfil está en desarrollo. Por ahora, puede actualizar la configuración básica a través del diálogo de Configuración.',
    }
  };

  const t = content[language];

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-funko-orange" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-6">
      <Navigation language={language} setLanguage={() => {}} />
      
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/talent')}
          className="mb-6 min-h-[44px] h-11 px-4 text-base font-semibold pointer-events-auto z-10 relative bg-black border-funko-orange text-white hover:bg-funko-orange/20"
          aria-label={t.backToDashboard}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.backToDashboard}
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">{t.profile}</h1>
          <p className="text-gray-300 leading-relaxed">
            Please make sure to fill out all information below. If anything changes please make sure to come back and update it here.
          </p>
        </div>

        <ProfileAccordion userId={user.id} mode="talent" />
      </div>

      <Footer language={language} />
    </div>
  );
};

export default TalentProfilePage;
