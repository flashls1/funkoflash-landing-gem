-- Create shop_products table
CREATE TABLE public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  square_checkout_url TEXT NOT NULL,
  autoplay_interval DECIMAL(2,1) NOT NULL DEFAULT 3.0 CHECK (autoplay_interval >= 0 AND autoplay_interval <= 5),
  image_urls JSON DEFAULT '[]'::json,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active products" 
ON public.shop_products 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage all products" 
ON public.shop_products 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can manage all products" 
ON public.shop_products 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_shop_products_updated_at
BEFORE UPDATE ON public.shop_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Create storage policies
CREATE POLICY "Anyone can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'staff'::app_role));