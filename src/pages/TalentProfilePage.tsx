import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { ProfileAccordion } from '@/components/profile/ProfileAccordion';

const TalentProfilePage = () => {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile || profile.role !== 'talent') {
      navigate('/auth');
    }
  }, [user, profile, navigate]);

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

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-6">
      <Navigation language={language} setLanguage={() => {}} />
      
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/talent')}
          className="mb-6 min-h-[44px] h-11 px-4 text-base font-semibold pointer-events-auto z-10 relative"
          aria-label={t.backToDashboard}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.backToDashboard}
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t.profile}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>

        <ProfileAccordion userId={user.id} mode="talent" />
      </div>

      <Footer language={language} />
    </div>
  );
};

export default TalentProfilePage;
