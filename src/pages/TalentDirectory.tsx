import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";


interface TalentProfile {
  id: string;
  name: string;
  slug: string;
  headshot_url: string | null;
  bio: string | null;
  sort_rank: number;
}

interface DirectorySettings {
  banner_image_url: string | null;
  banner_alt_text: string | null;
}

const TalentDirectory = () => {
  const [talents, setTalents] = useState<TalentProfile[]>([]);
  const [settings, setSettings] = useState<DirectorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch talent profiles
        const { data: talentData, error: talentError } = await supabase
          .from('talent_profiles')
          .select('id, name, slug, headshot_url, bio, sort_rank')
          .eq('active', true)
          .order('sort_rank', { ascending: true });

        if (talentError) throw talentError;

        // Fetch directory settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('directory_settings')
          .select('banner_image_url, banner_alt_text')
          .limit(1)
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError;
        }

        setTalents(talentData || []);
        setSettings(settingsData);
      } catch (error) {
        console.error('Error fetching talent directory:', error);
        toast({
          title: "Error",
          description: "Failed to load talent directory",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${supabase.storage.from('talent-images').getPublicUrl(url).data.publicUrl}`;
  };

  const content = {
    en: {
      heroTitle: "Talent Directory",
      heroSubtitle: "Meet Our Amazing Voice Talent and Performers",
      title: "Our Talent",
      description: "Meet our amazing voice talent and performers available for your next project",
      noTalent: "No talent profiles available at this time.",
      viewProfile: "View Profile"
    },
    es: {
      heroTitle: "Directorio de Talento",
      heroSubtitle: "Conoce a Nuestros Increíbles Talentos de Voz y Artistas",
      title: "Nuestro Talento",
      description: "Conoce a nuestros increíbles talentos de voz y artistas disponibles para tu próximo proyecto",
      noTalent: "No hay perfiles de talento disponibles en este momento.",
      viewProfile: "Ver Perfil"
    }
  };

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
      
      
      <main className="container mx-auto px-4 py-8">
        {/* Optional Banner Section for Custom Settings */}
        {settings?.banner_image_url && (
          <div className="w-full h-[240px] relative overflow-hidden rounded-lg mb-8">
            <img 
              src={getImageUrl(settings.banner_image_url)} 
              alt={settings.banner_alt_text || "Talent Directory Banner"}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            {content[language].title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {content[language].description}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden bg-card/80 backdrop-blur-sm border-border">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {talents.map((talent) => (
              <Card key={talent.id} className="overflow-hidden hover:shadow-xl transition-shadow bg-card/80 backdrop-blur-sm border-border">
                <div className="aspect-square relative overflow-hidden">
                  {talent.headshot_url ? (
                    <img 
                      src={getImageUrl(talent.headshot_url)}
                      alt={`${talent.name} headshot`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground text-lg font-medium">
                        {talent.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {talent.name}
                  </h3>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.location.href = `/talent/${talent.slug}`}
                  >
                    {content[language].viewProfile}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && talents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {content[language].noTalent}
            </p>
          </div>
        )}
      </main>

      <Footer language={language} />
    </div>
  );
};

export default TalentDirectory;