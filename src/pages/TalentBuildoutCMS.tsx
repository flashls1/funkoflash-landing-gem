import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, FileText, Settings } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AdminThemeProvider from '@/components/AdminThemeProvider';
import AdminHeader from '@/components/AdminHeader';
import { useColorTheme } from '@/hooks/useColorTheme';

interface TalentProfile {
  id: string;
  name: string;
  slug: string;
  headshot_url: string | null;
  bio: string | null;
  active: boolean;
  public_visibility: boolean;
  sort_rank: number;
}

const TalentBuildoutCMS = () => {
  const { user, profile } = useAuth();
  const { currentTheme } = useColorTheme();
  const navigate = useNavigate();
  const { talentId } = useParams<{ talentId: string }>();
  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { toast } = useToast();

  // Check if user has permission
  if (!user || !profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (talentId) {
      fetchTalentData();
    }
  }, [talentId]);

  const fetchTalentData = async () => {
    try {
      const { data: talentData, error } = await supabase
        .from('talent_profiles')
        .select('*')
        .eq('id', talentId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching talent:', error);
        throw error;
      }

      if (!talentData) {
        toast({
          title: "Error",
          description: "Talent not found",
          variant: "destructive",
        });
        navigate('/admin/talent-directory');
        return;
      }

      setTalent(talentData);
    } catch (error) {
      console.error('Error fetching talent data:', error);
      toast({
        title: "Error",
        description: "Failed to load talent data",
        variant: "destructive",
      });
      navigate('/admin/talent-directory');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const publicUrl = supabase.storage.from('talent-headshots').getPublicUrl(url).data.publicUrl;
    return `${publicUrl}?t=${Date.now()}`;
  };

  if (loading) {
    return (
      <AdminThemeProvider>
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-white">Loading talent build-out sheet...</div>
          </div>
        </div>
        <Footer language={language} />
      </AdminThemeProvider>
    );
  }

  if (!talent) {
    return (
      <AdminThemeProvider>
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-white">Talent not found</div>
          </div>
        </div>
        <Footer language={language} />
      </AdminThemeProvider>
    );
  }

  return (
    <AdminThemeProvider>
      <Navigation language={language} setLanguage={setLanguage} />
      
      <div className="container mx-auto px-4 py-8">
        <AdminHeader
          title={`Talent Build-Out Sheet - ${talent.name}`}
          description="Comprehensive talent profile management and build-out details"
          language={language}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" style={{ color: currentTheme.accent }} />
            <span className="text-sm font-medium">
              {language === 'en' ? 'Build-Out Management' : 'Gestión de Perfil Completo'}
            </span>
          </div>
        </AdminHeader>

        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/talent-directory')}
            style={{
              backgroundColor: 'transparent',
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Talent Directory
          </Button>
        </div>

        {/* Talent Overview Card */}
        <Card 
          className="border-2 mb-6"
          style={{
            backgroundColor: currentTheme.cardBackground,
            borderColor: currentTheme.border,
            color: currentTheme.cardForeground
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: currentTheme.accent }}>Talent Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4">
              {talent.headshot_url && (
                <img 
                  src={getImageUrl(talent.headshot_url)} 
                  alt={talent.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
              {!talent.headshot_url && (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{talent.name}</h2>
                <p className="text-muted-foreground">Slug: /{talent.slug}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`px-2 py-1 rounded text-xs ${talent.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {talent.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${talent.public_visibility ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {talent.public_visibility ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Build-Out Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Basic Information Section */}
          <Card 
            className="border-2"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: currentTheme.accent }}>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Biography</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {talent.bio || 'No biography available'}
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Edit Basic Information
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assets & Media Section */}
          <Card 
            className="border-2"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: currentTheme.accent }}>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Assets & Media
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage talent assets, media files, and promotional materials.
                </p>
                <Button variant="outline" className="w-full">
                  Manage Assets
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Performance Details Section */}
          <Card 
            className="border-2"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: currentTheme.accent }}>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Performance Details
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure performance settings, specialties, and technical details.
                </p>
                <Button variant="outline" className="w-full">
                  Configure Performance
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Booking & Availability Section */}
          <Card 
            className="border-2"
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderColor: currentTheme.border,
              color: currentTheme.cardForeground
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: currentTheme.accent }}>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Booking & Availability
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage booking information, rates, and availability calendar.
                </p>
                <Button variant="outline" className="w-full">
                  Manage Booking
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
      
      <Footer language={language} />
    </AdminThemeProvider>
  );
};

export default TalentBuildoutCMS;