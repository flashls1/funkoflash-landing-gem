import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    const fetchTalent = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('talent_profiles')
          .select('id, name, slug, headshot_url, bio')
          .eq('slug', slug)
          .eq('active', true)
          .single();

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
  }, [slug, toast]);

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${supabase.storage.from('talent-images').getPublicUrl(url).data.publicUrl}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation language={language} setLanguage={setLanguage} />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="aspect-square bg-muted rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
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
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-12">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Talent Directory
          </Button>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Headshot */}
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="aspect-square relative overflow-hidden rounded-lg">
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
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Book This Talent
                </h3>
                <p className="text-muted-foreground mb-4">
                  Interested in working with {talent.name}? Get in touch to discuss your project and check availability.
                </p>
                <Button size="lg" className="w-full sm:w-auto">
                  Contact for Booking
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer language={language} />
    </div>
  );
};

export default TalentProfile;