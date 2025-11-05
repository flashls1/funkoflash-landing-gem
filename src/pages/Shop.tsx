import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronLeft, ChevronRight, ShoppingBag, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
import { useLanguage } from "@/hooks/useLanguage";
import { useSiteDesign } from "@/hooks/useSiteDesign";

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

interface ImageSliderProps {
  images: string[];
  autoplayInterval: number;
  productTitle: string;
}

const ImageSlider = ({ images, autoplayInterval, productTitle }: ImageSliderProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1 || autoplayInterval === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, autoplayInterval * 1000);

    return () => clearInterval(interval);
  }, [images.length, autoplayInterval]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images.length) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-2 bg-muted-foreground/20 rounded-lg flex items-center justify-center">
            📦
          </div>
          <p className="text-sm">No image available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-lg group">
      <img
        src={images[currentImageIndex]}
        alt={`${productTitle} - Image ${currentImageIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />
      
      {images.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
            onClick={prevImage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
            onClick={nextImage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const content = {
    en: {
      heroTitle: "Shop",
      heroSubtitle: "Discover Exclusive Collectibles and Merchandise",
      title: "FunkoFlash Shop",
      description: "Discover exclusive Funko Pop collectibles and merchandise",
      noProducts: "No products listed yet.",
      checkBack: "Check back soon for exciting new products!"
    },
    es: {
      heroTitle: "Tienda",
      heroSubtitle: "Descubre Coleccionables y Mercancía Exclusiva",
      title: "Tienda FunkoFlash",
      description: "Descubre coleccionables exclusivos de Funko Pop y mercancía",
      noProducts: "Aún no hay productos listados.",
      checkBack: "¡Regresa pronto para ver nuevos productos emocionantes!"
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
    <div className="min-h-screen bg-background">
      <Navigation language={language} setLanguage={setLanguage} />
      
      {/* Background wraps hero + content */}
      <div 
        className="pt-[5px]"
        style={{
          backgroundImage: 'var(--site-background)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <UnifiedHeroSection 
            language={language} 
            className="rounded-2xl overflow-hidden border-2"
            style={{ borderColor: 'hsl(0 0% 100%)' }}
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
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full"
            >
              <ShoppingBag className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                {language === 'en' ? 'Exclusive Collectibles' : 'Coleccionables Exclusivos'}
              </span>
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold mb-4 text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {content[language].title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {content[language].description}
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  <Card className="overflow-hidden bg-card/90 backdrop-blur-sm border-border shadow-lg">
                    <div className="w-full h-64 bg-muted animate-pulse" />
                    <CardContent className="p-6">
                      <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-4 bg-muted rounded animate-pulse mb-4" />
                      <div className="h-10 bg-muted rounded animate-pulse" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto shadow-lg border border-border">
                <ShoppingBag className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2 text-foreground">{content[language].noProducts}</h3>
                <p className="text-muted-foreground">
                  {content[language].checkBack}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  variants={cardVariants}
                  whileHover={{ y: -8 }}
                >
                  <Card className="overflow-hidden h-full bg-card/90 backdrop-blur-sm border-border shadow-lg hover:shadow-2xl transition-shadow duration-300">
                    <div className="relative group">
                      <ImageSlider 
                        images={product.image_urls}
                        autoplayInterval={product.autoplay_interval}
                        productTitle={product.title}
                      />
                      <motion.div 
                        className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" as const }}
                      >
                        <Star className="w-4 h-4 inline mr-1 fill-current" />
                        {formatPrice(product.price)}
                      </motion.div>
                    </div>
                    
                    <CardContent className="p-6">
                      <h3 className="font-bold text-xl mb-2 line-clamp-2 text-foreground">{product.title}</h3>
                      
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {product.description}
                      </p>
                      
                      <Button 
                        className="w-full group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
                        onClick={() => window.open(product.square_checkout_url, '_blank')}
                      >
                        {language === 'en' ? 'Buy Now' : 'Comprar Ahora'}
                        <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
        
        <Footer language={language} />
      </div>
    </div>
  );
};

export default Shop;