import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProfileAccordion } from '@/components/profile/ProfileAccordion';

const AdminUserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading before checking permissions
    if (authLoading) {
      console.log('[AdminUserProfilePage] Waiting for auth to load...');
      return;
    }

    // Only redirect after loading is complete and user lacks permissions
    if (!user || !profile || !['admin', 'staff'].includes(profile.role)) {
      console.log('[AdminUserProfilePage] Unauthorized access, redirecting to auth');
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this page.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    console.log('[AdminUserProfilePage] Auth successful, fetching target user');
    if (userId) {
      fetchTargetUser();
    }
  }, [user, profile, userId, navigate, authLoading]);

  const fetchTargetUser = async () => {
    if (!userId) return;

    try {
      console.log('[AdminUserProfilePage] Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('[AdminUserProfilePage] Error fetching user:', error);
        toast({
          title: "Error Loading Profile",
          description: "Failed to load user profile. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      console.log('[AdminUserProfilePage] User profile loaded successfully');
      setTargetUser(data);
    } catch (error) {
      console.error('[AdminUserProfilePage] Fatal error:', error);
      // Don't navigate away, let admin retry
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-6">
        <Navigation language={language} setLanguage={() => {}} />
        
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/admin')}
            className="mb-6 min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Failed to load user profile</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
        
        <Footer language={language} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-6">
      <Navigation language={language} setLanguage={() => {}} />
      
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/admin')}
          className="mb-6 min-h-[44px] h-11 px-4 text-base font-semibold pointer-events-auto z-10 relative"
          aria-label={t.backToUsers}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.backToUsers}
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t.userProfile}: {targetUser?.first_name} {targetUser?.last_name}
          </h1>
          <p className="text-muted-foreground">{targetUser?.email}</p>
        </div>

        {userId && <ProfileAccordion userId={userId} mode="admin" />}
      </div>

      <Footer language={language} />
    </div>
  );
};

export default AdminUserProfilePage;
