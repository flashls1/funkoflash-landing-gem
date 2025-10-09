-- Create user_profile_data table for extended profile information
CREATE TABLE IF NOT EXISTS public.user_profile_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Basic Information
  legal_name TEXT,
  stage_name TEXT,
  date_of_birth DATE,
  contact_number TEXT,
  email TEXT,
  address_line TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  postal_code TEXT,
  
  -- Representation & Legal
  representation_type TEXT,
  representation_start_date DATE,
  union_affiliation BOOLEAN DEFAULT false,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  previous_representation TEXT,
  
  -- Professional Details
  talent_category TEXT,
  skills TEXT,
  training TEXT,
  experience_years INTEGER,
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  headshots JSONB DEFAULT '[]'::jsonb,
  social_instagram TEXT,
  social_facebook TEXT,
  social_tiktok TEXT,
  social_x TEXT,
  social_linkedin TEXT,
  social_other TEXT,
  
  -- Travel & Logistics
  preferred_airports TEXT,
  preferred_airlines TEXT,
  airline_rewards JSONB DEFAULT '[]'::jsonb,
  travel_requirements TEXT,
  availability_notes TEXT,
  geographic_range JSONB DEFAULT '[]'::jsonb,
  has_passport BOOLEAN DEFAULT false,
  passport_number TEXT,
  has_visa BOOLEAN DEFAULT false,
  visa_number TEXT,
  has_drivers_license BOOLEAN DEFAULT false,
  drivers_license_state TEXT,
  food_allergies TEXT,
  
  -- Consent & Agreements
  representation_consent BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  terms_accepted BOOLEAN DEFAULT false,
  signature_data TEXT,
  signature_date TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_profile_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile data"
  ON public.user_profile_data
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile data"
  ON public.user_profile_data
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile data"
  ON public.user_profile_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profile data"
  ON public.user_profile_data
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all profile data"
  ON public.user_profile_data
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view all profile data"
  ON public.user_profile_data
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can update all profile data"
  ON public.user_profile_data
  FOR UPDATE
  USING (has_role(auth.uid(), 'staff'::app_role));

-- Create function to migrate existing profile data
CREATE OR REPLACE FUNCTION migrate_profile_to_profile_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile data for users who don't have it yet
  INSERT INTO public.user_profile_data (
    user_id,
    legal_name,
    email,
    contact_number
  )
  SELECT 
    p.user_id,
    TRIM(COALESCE(p.first_name || ' ' || p.last_name, p.first_name, p.email)),
    p.email,
    p.phone
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profile_data upd 
    WHERE upd.user_id = p.user_id
  )
  AND p.user_id IS NOT NULL;
END;
$$;

-- Run migration
SELECT migrate_profile_to_profile_data();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_profile_data_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_user_profile_data_updated_at
  BEFORE UPDATE ON public.user_profile_data
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_data_updated_at();

-- Add index for performance
CREATE INDEX idx_user_profile_data_user_id ON public.user_profile_data(user_id);