import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';

const AdminUserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile || !['admin', 'staff'].includes(profile.role)) {
      navigate('/auth');
      return;
    }

    if (userId) {
      fetchTargetUser();
    }
  }, [user, profile, userId, navigate]);

  const fetchTargetUser = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setTargetUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      navigate('/dashboard/admin');
    } finally {
      setLoading(false);
    }
  };

  const content = {
    en: {
      backToUsers: 'Back to Users',
      userProfile: 'User Profile',
      comingSoon: 'Full Profile Editor Coming Soon',
      description: 'The comprehensive profile management interface for admins is being developed.',
    },
    es: {
      backToUsers: 'Volver a Usuarios',
      userProfile: 'Perfil de Usuario',
      comingSoon: 'Editor de Perfil Completo Próximamente',
      description: 'La interfaz completa de gestión de perfiles para administradores está en desarrollo.',
    }
  };

  const t = content[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={() => {}} />
      
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/admin')}
          className="mb-6 min-h-[44px] h-11 px-4 text-base font-semibold"
          aria-label={t.backToUsers}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.backToUsers}
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            {t.userProfile}: {targetUser?.first_name} {targetUser?.last_name}
          </h1>
          <p className="text-muted-foreground mb-8">{targetUser?.email}</p>

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

export default AdminUserProfilePage;
