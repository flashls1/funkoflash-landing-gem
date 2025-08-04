import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UnifiedHeroSection from "@/components/UnifiedHeroSection";
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
  const [language, setLanguage] = useState<'en' | 'es'>('en');
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

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        backgroundImage: 'var(--site-background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <Navigation language={language} setLanguage={setLanguage} />
      
      {/* Hero Section */}
      <UnifiedHeroSection language={language} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            {content[language].title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {content[language].description}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden bg-card/80 backdrop-blur-sm border-border">
                <div className="w-full h-64 bg-muted animate-pulse" />
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 bg-muted rounded animate-pulse mb-4" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-border">
              <span className="text-4xl">🛍️</span>
            </div>
            <h3 className="text-2xl font-semibold mb-2 text-foreground">{content[language].noProducts}</h3>
            <p className="text-muted-foreground">
              {content[language].checkBack}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow bg-card/80 backdrop-blur-sm border-border">
                <ImageSlider 
                  images={product.image_urls}
                  autoplayInterval={product.autoplay_interval}
                  productTitle={product.title}
                />
                
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{product.title}</h3>
                    <Badge variant="secondary" className="ml-2 shrink-0">
                      {formatPrice(product.price)}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {product.description}
                  </p>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => window.open(product.square_checkout_url, '_blank')}
                  >
                    Buy Now
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <Footer language={language} />
    </div>
  );
};

export default Shop;