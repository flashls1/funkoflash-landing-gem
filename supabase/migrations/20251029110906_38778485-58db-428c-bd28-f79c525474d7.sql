-- Create missing shop_products table and finalize schema

CREATE TABLE IF NOT EXISTS public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price numeric NOT NULL,
  currency text DEFAULT 'USD',
  square_checkout_url text,
  image_urls text[] DEFAULT '{}',
  category text,
  tags text[],
  active boolean DEFAULT true,
  featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  autoplay_interval integer DEFAULT 5000,
  stock_quantity integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Public can view active products"
  ON public.shop_products FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage shop products"
  ON public.shop_products FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- Updated-at trigger
CREATE TRIGGER update_shop_products_updated_at
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure show_schedule_entries properly supports all fields app uses
ALTER TABLE public.show_schedule_entries
  ALTER COLUMN event_id DROP NOT NULL;

-- Ensure message_reactions has all needed fields (already correct, just verify)
-- Table is correctly structured

-- Ensure user_profile_data doesn't require both user_id and section_key in insert
-- Already has proper structure
