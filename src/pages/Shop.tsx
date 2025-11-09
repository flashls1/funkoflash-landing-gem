import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
import { useLanguage } from "@/hooks/useLanguage";
import { useSiteDesign } from "@/hooks/useSiteDesign";
import { ShoppingBag, Star } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  square_checkout_url: string;
  autoplay_interval: number;
  image_urls: any;
  active: boolean;
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, setLanguage } = useLanguage();
  const { setCurrentPage } = useSiteDesign();

  useEffect(() => {
    setCurrentPage('shop');
  }, [setCurrentPage]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('shop_products')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts((data || []).map(product => ({
          ...product,
          image_urls: Array.isArray(product.image_urls) ? product.image_urls : []
        })));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 80,
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

        <motion.main 
          className="container mx-auto px-4 py-8 sm:py-12 md:py-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-neon-orange text-glow-orange mb-4 text-center text-neon"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {language === 'en' ? 'Shop' : 'Tienda'}
          </motion.h1>
          <motion.p 
            className="text-lg text-white/80 text-center mb-8 sm:mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {language === 'en' 
              ? 'Browse our exclusive collection of signed Funkos and merchandise' 
              : 'Explora nuestra colección exclusiva de Funkos firmados y mercancía'}
          </motion.p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <motion.div key={i} variants={cardVariants}>
                  <Card className="glass overflow-hidden">
                    <Skeleton className="h-48 w-full bg-white/10" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2 bg-white/10" />
                      <Skeleton className="h-4 w-full bg-white/10" />
                      <Skeleton className="h-4 w-2/3 bg-white/10" />
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <ShoppingBag className="mx-auto h-16 w-16 text-neon-cyan mb-4" />
              <p className="text-xl text-white/80 text-neon">
                {language === 'en' ? 'No products available yet. Check back soon!' : '¡No hay productos disponibles aún. Vuelve pronto!'}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <motion.div key={product.id} variants={cardVariants}>
                  <Card className="glass glass-hover cursor-pointer h-full flex flex-col group overflow-hidden">
                    <div className="relative h-48 overflow-hidden">
                      <motion.img
                        src={(product.image_urls && product.image_urls[0]) || '/placeholder.svg'}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        whileHover={{ scale: 1.1 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                      {product.price && (
                        <motion.div 
                          className="absolute top-2 right-2 bg-neon-orange text-white px-3 py-1 rounded-full font-bold glow-orange text-neon"
                          whileHover={{ scale: 1.1 }}
                        >
                          ${product.price.toFixed(2)}
                        </motion.div>
                      )}
                    </div>
                    <CardHeader className="flex-1 flex flex-col">
                      <CardTitle className="text-lg text-neon-cyan group-hover:text-glow-cyan transition-all line-clamp-2 text-neon">
                        {product.title}
                      </CardTitle>
                      {product.description && (
                        <CardDescription className="flex-1 line-clamp-2 text-white/80">
                          {product.description}
                        </CardDescription>
                      )}
                      <Button 
                        className="w-full mt-4 bg-gradient-to-r from-neon-orange to-neon-magenta text-white glow-orange text-neon hover:scale-105 transition-transform"
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        {language === 'en' ? 'Buy Now' : 'Comprar Ahora'}
                      </Button>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.main>
      </div>
    </PageLayout>
  );
};

export default Shop;
