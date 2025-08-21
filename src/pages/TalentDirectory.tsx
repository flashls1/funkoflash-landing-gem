import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
import { useSiteDesign } from "@/hooks/useSiteDesign";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface TalentProfile {
  id: string;
  name: string;
  slug: string;
  headshot_url: string | null;
  bio: string | null;
  sort_rank: number;
}

const TalentDirectory = () => {
  const [talents, setTalents] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { toast } = useToast();
  const { setCurrentPage } = useSiteDesign();
  const { session } = useAuth();

  useEffect(() => {
    setCurrentPage('talent-directory');
  }, [setCurrentPage]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use the secure public showcase function for public access
        const { data: talentData, error: talentError } = await supabase.rpc('get_public_talent_showcase');
        
        if (talentError) {
          console.error('Error fetching talent showcase:', talentError);
          // Fallback for authenticated users - they can see full profiles
          if (session) {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('talent_profiles')
              .select('id, name, slug, headshot_url, bio, sort_rank')
              .eq('active', true)
              .eq('public_visibility', true)
              .order('sort_rank', { ascending: true });
              
            if (!fallbackError) {
              setTalents(fallbackData || []);
              return;
            }
          }
          throw talentError;
        }

        // Map preview_bio to bio for component compatibility  
        const mappedData = talentData?.map(talent => ({
          ...talent,
          bio: talent.preview_bio
        })) || [];
        
        setTalents(mappedData);
      } catch (error) {
        console.error('Error fetching talent directory:', error);
        toast({
          title: "Error",
          description: "Failed to load talent directory",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast, session]);

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${supabase.storage.from('talent-headshots').getPublicUrl(url).data.publicUrl}`;
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
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      {/* Hero Section */}
      <UnifiedHeroSection language={language} />
      
      {/* Main Content with Background */}
      <div style={{
        backgroundImage: 'var(--site-background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}>
        <main className="container mx-auto px-4 py-8">
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
                <div key={i} className="relative">
                  <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                  <Skeleton className="absolute bottom-0 left-0 right-0 h-12 rounded-none" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {talents.map(talent => (
                <div key={talent.id} className="relative group">
                  {/* Talent Image */}
                  <div className="aspect-[3/4] relative overflow-hidden rounded-lg">
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
                    
                    {/* View Profile Button Overlay - Orange and White */}
                    <div className="absolute bottom-0 left-0 right-0">
                      <Button 
                        className="w-full rounded-none bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 shadow-lg border-0" 
                        onClick={() => window.location.href = `/talent/${talent.slug}`}
                      >
                        {content[language].viewProfile}
                      </Button>
                    </div>
                  </div>
                </div>
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
    </div>
  );
};

export default TalentDirectory;