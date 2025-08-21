import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface TalentProfile {
  id: string;
  name: string;
  slug: string;
  headshot_url: string | null;
  bio: string | null;
}

const TalentProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    const fetchTalent = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // Try public showcase view first for unauthenticated users
        let data, error;
        
        if (!session) {
          // Unauthenticated users get curated public data
          const { data: talentData, error: talentError } = await supabase
            .rpc('get_public_talent_showcase');
          
          const foundTalent = talentData?.find(t => t.slug === slug);
          data = foundTalent ? { ...foundTalent, bio: foundTalent.preview_bio } : null;
          error = !foundTalent ? { code: 'PGRST116' } : talentError;
        } else {
          // Authenticated users can access full profiles
          const result = await supabase
            .from('talent_profiles')
            .select('id, name, slug, headshot_url, bio')
            .eq('slug', slug)
            .eq('active', true)
            .single();
          
          data = result.data;
          error = result.error;
        }

        if (error) {
          if (error.code === 'PGRST116') {
            setNotFound(true);
          } else {
            throw error;
          }
        } else {
          setTalent(data);
        }
      } catch (error) {
        console.error('Error fetching talent profile:', error);
        toast({
          title: "Error",
          description: "Failed to load talent profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTalent();
  }, [slug, toast, session]);

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${supabase.storage.from('talent-images').getPublicUrl(url).data.publicUrl}`;
  };

  const content = {
    en: {
      backButton: "Back to Talent Directory",
      bookTitle: "Book This Talent",
      bookDescription: "Interested in working with",
      bookDescriptionEnd: "? Get in touch to discuss your project and check availability.",
      contactButton: "Contact for Booking"
    },
    es: {
      backButton: "Volver al Directorio de Talento",
      bookTitle: "Contratar Este Talento",
      bookDescription: "¿Interesado en trabajar con",
      bookDescriptionEnd: "? Ponte en contacto para discutir tu proyecto y verificar disponibilidad.",
      contactButton: "Contactar para Reservar"
    }
  };

  if (loading) {
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
          <div className="animate-pulse">
            <div className="h-8 bg-card/80 backdrop-blur-sm rounded w-1/4 mb-8 border border-border"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-card/80 backdrop-blur-sm rounded-lg border border-border"></div>
              <div className="space-y-4">
                <div className="h-8 bg-card/80 backdrop-blur-sm rounded w-3/4 border border-border"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-card/80 backdrop-blur-sm rounded border border-border"></div>
                  <div className="h-4 bg-card/80 backdrop-blur-sm rounded border border-border"></div>
                  <div className="h-4 bg-card/80 backdrop-blur-sm rounded w-3/4 border border-border"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer language={language} />
      </div>
    );
  }

  if (notFound) {
    return <Navigate to="/not-found" replace />;
  }

  if (!talent) {
    return <Navigate to="/talent-directory" replace />;
  }

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
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-8 bg-card/80 backdrop-blur-sm border border-border hover:bg-card/90"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {content[language].backButton}
        </Button>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Headshot */}
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-card/80 backdrop-blur-sm border border-border shadow-lg">
              {talent.headshot_url ? (
                <img 
                  src={getImageUrl(talent.headshot_url)}
                  alt={`${talent.name} headshot`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-6xl font-medium">
                    {talent.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bio and Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                {talent.name}
              </h1>
              
              {talent.bio && (
                <div className="prose prose-lg max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {talent.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Contact Section */}
            <div className="bg-card/80 backdrop-blur-sm border border-border p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {content[language].bookTitle}
              </h3>
              <p className="text-muted-foreground mb-4">
                {content[language].bookDescription} {talent.name}{content[language].bookDescriptionEnd}
              </p>
              <Button size="lg" className="w-full sm:w-auto">
                {content[language].contactButton}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer language={language} />
    </div>
  );
};

export default TalentProfile;