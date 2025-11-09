import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageLayout from "@/components/PageLayout";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
import { useSiteDesign } from "@/hooks/useSiteDesign";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowRight, Star } from "lucide-react";

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
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const { setCurrentPage } = useSiteDesign();
  const { session } = useAuth();

  useEffect(() => {
    setCurrentPage('talent-directory');
  }, [setCurrentPage]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: talentData, error: talentError } = await supabase.rpc('get_public_talent_showcase');
        
        if (talentError) {
          console.error('Error fetching talent showcase:', talentError);
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
      title: "Our Talent",
      description: "Meet our amazing voice talent and performers available for your next project",
      noTalent: "No talent profiles available at this time.",
      viewProfile: "View Profile"
    },
    es: {
      title: "Nuestro Talento",
      description: "Conoce a nuestros increíbles talentos de voz y artistas disponibles para tu próximo proyecto",
      noTalent: "No hay perfiles de talento disponibles en este momento.",
      viewProfile: "Ver Perfil"
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <PageLayout language={language} setLanguage={setLanguage}>
      <div className="min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <UnifiedHeroSection 
            language={language} 
            className="glass-hover overflow-hidden"
          />
        </motion.div>

        <main className="container mx-auto px-4 py-12 lg:py-16">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 glass rounded-full"
            >
              <Star className="w-5 h-5 text-neon-cyan fill-neon-cyan" />
              <span className="text-sm font-semibold text-neon-cyan text-neon">
                {language === 'en' ? 'Meet Our Stars' : 'Conoce a Nuestras Estrellas'}
              </span>
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold text-neon-orange text-glow-orange mb-4 text-neon">
              {content[language].title}
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {content[language].description}
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(8)].map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="relative group"
                >
                  <div className="aspect-[3/4] relative overflow-hidden rounded-2xl glass">
                    <Skeleton className="w-full h-full bg-white/10" />
                  </div>
                  <Skeleton className="h-6 w-3/4 mt-4 mx-auto rounded-full bg-white/10" />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {talents.map((talent, index) => (
                <motion.div 
                  key={talent.id} 
                  variants={cardVariants}
                  whileHover={{ y: -8 }}
                  className="relative group cursor-pointer"
                  onClick={() => window.location.href = `/talent/${talent.slug}`}
                >
                  <div className="relative overflow-hidden rounded-2xl glass glass-hover">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      {talent.headshot_url ? (
                        <>
                          <motion.img 
                            src={getImageUrl(talent.headshot_url)} 
                            alt={`${talent.name} headshot`} 
                            className="w-full h-full object-cover" 
                            style={{ objectPosition: '50% 20%' }}
                            initial={{ scale: 1.1 }}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 flex items-center justify-center">
                          <span className="text-neon-cyan text-6xl font-bold">
                            {talent.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      <motion.div 
                        className="absolute top-4 left-4 right-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                      >
                        <div className="glass px-4 py-2 rounded-full">
                          <h3 className="text-sm font-bold text-white text-center truncate text-neon">
                            {talent.name}
                          </h3>
                        </div>
                      </motion.div>

                      {talent.bio && (
                        <motion.div 
                          className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500"
                        >
                          <p className="text-white text-sm line-clamp-3 drop-shadow-lg">
                            {talent.bio}
                          </p>
                        </motion.div>
                      )}
                    </div>
                    
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 p-4"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.4 }}
                    >
                      <Button 
                        className="w-full rounded-xl bg-gradient-to-r from-neon-orange to-neon-magenta text-white glow-orange font-bold py-6 text-neon flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                      >
                        <span>{content[language].viewProfile}</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </motion.div>
                  </div>

                  <motion.div 
                    className="absolute -inset-1 bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/30 to-neon-cyan/0 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10"
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && talents.length === 0 && (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="glass glass-hover p-12 max-w-md mx-auto">
                <Star className="w-16 h-16 text-neon-cyan mx-auto mb-4" />
                <p className="text-white/80 text-lg font-medium">
                  {content[language].noTalent}
                </p>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </PageLayout>
  );
};

export default TalentDirectory;
