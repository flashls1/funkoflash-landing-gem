import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useTalentProfile } from '@/hooks/useTalentProfile';
import { supabase } from '@/integrations/supabase/client';

const TalentProfilePage = () => {
  const { user, profile } = useAuth();
  const { talentProfile } = useTalentProfile();
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile || profile.role !== 'talent') {
      navigate('/auth');
      return;
    }

    // Ensure user_profile_data exists, migrate if needed
    const ensureProfileData = async () => {
      const { data: existingData } = await supabase
        .from('user_profile_data')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingData) {
        // Call migration RPC or upsert empty row
        await supabase.from('user_profile_data').upsert({
          user_id: user.id,
          legal_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          email: profile.email,
          contact_number: profile.phone || '',
        });
      }
    };

    ensureProfileData();
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={() => {}} />
      
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/talent')}
          className="mb-6 min-h-[44px] h-11 px-4 text-base font-semibold"
          aria-label={t.backToDashboard}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.backToDashboard}
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{t.profile}</h1>
          <p className="text-muted-foreground mb-8">{t.description}</p>

          {/* Placeholder for ProfileAccordion - will be implemented */}
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">{t.comingSoon}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t.description}
            </p>
          </div>
        </div>
      </div>

      <Footer language={language} />
    </div>
  );
};

export default TalentProfilePage;
