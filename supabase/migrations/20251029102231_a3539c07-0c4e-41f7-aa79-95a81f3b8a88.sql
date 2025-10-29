-- =====================================================
-- COMPLETE DATABASE RESTORATION MIGRATION
-- Creates all tables, enums, functions, storage, RLS policies
-- =====================================================

-- =====================================================
-- 1. CREATE ENUMS
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'talent', 'business');
CREATE TYPE public.asset_category AS ENUM ('headshot', 'character_image', 'bio', 'promo_video', 'general');
CREATE TYPE public.asset_format AS ENUM ('image', 'video', 'document');

-- =====================================================
-- 2. CREATE CORE TABLES
-- =====================================================

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role app_role,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Role permissions table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key app_role NOT NULL,
  permission_scope TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_key, permission_scope)
);

-- User activity logs
CREATE TABLE public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User login history
CREATE TABLE public.user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Access requests
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. CREATE SECURITY DEFINER FUNCTIONS
-- =====================================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =====================================================
-- 4. CREATE TALENT TABLES
-- =====================================================

-- Talent profiles
CREATE TABLE public.talent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  bio TEXT,
  headshot_url TEXT,
  active BOOLEAN DEFAULT true,
  public_visibility BOOLEAN DEFAULT true,
  sort_rank INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User profile data (section-based profile management)
CREATE TABLE public.user_profile_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  section_key TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, section_key)
);

-- Talent module access control
CREATE TABLE public.talent_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES public.talent_profiles(id) ON DELETE CASCADE NOT NULL,
  module_id TEXT NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(talent_id, module_id)
);

-- Talent quick view settings
CREATE TABLE public.talent_quick_view (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES public.talent_profiles(id) ON DELETE CASCADE NOT NULL,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. CREATE BUSINESS TABLES
-- =====================================================

-- Business accounts
CREATE TABLE public.business_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Business events
CREATE TABLE public.business_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_ts TIMESTAMPTZ,
  end_ts TIMESTAMPTZ,
  location TEXT,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Business event talent (many-to-many)
CREATE TABLE public.business_event_talent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.business_events(id) ON DELETE CASCADE NOT NULL,
  talent_id UUID REFERENCES public.talent_profiles(id) ON DELETE CASCADE NOT NULL,
  rate NUMERIC,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, talent_id)
);

-- Business event accounts (many-to-many)
CREATE TABLE public.business_event_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.business_events(id) ON DELETE CASCADE NOT NULL,
  business_account_id UUID REFERENCES public.business_account(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, business_account_id)
);

-- Business event contacts
CREATE TABLE public.business_event_contact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.business_events(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Business event travel details
CREATE TABLE public.business_event_travel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.business_events(id) ON DELETE CASCADE NOT NULL,
  talent_id UUID REFERENCES public.talent_profiles(id) ON DELETE CASCADE NOT NULL,
  departure_date TIMESTAMPTZ,
  arrival_date TIMESTAMPTZ,
  flight_number TEXT,
  confirmation_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Business event hotel details
CREATE TABLE public.business_event_hotel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.business_events(id) ON DELETE CASCADE NOT NULL,
  talent_id UUID REFERENCES public.talent_profiles(id) ON DELETE CASCADE NOT NULL,
  hotel_name TEXT,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  confirmation_code TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. CREATE CALENDAR & SCHEDULING TABLES
-- =====================================================

-- Calendar events
CREATE TABLE public.calendar_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES public.talent_profiles(id) ON DELETE CASCADE NOT NULL,
  event_title TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  all_day BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue_name TEXT,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT,
  address_line TEXT,
  notes_public TEXT,
  notes_internal TEXT,
  color TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Event dates (for show schedule)
CREATE TABLE public.event_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.business_events(id) ON DELETE CASCADE NOT NULL,
  event_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, event_date)
);

-- Show schedule entries
CREATE TABLE public.show_schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.business_events(id) ON DELETE CASCADE NOT NULL,
  event_date_id UUID REFERENCES public.event_dates(id) ON DELETE CASCADE NOT NULL,
  time_start TIME NOT NULL,
  title TEXT NOT NULL,
  category_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Schedule categories
CREATE TABLE public.schedule_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Schedule bulk uploads tracking
CREATE TABLE public.schedule_bulk_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.business_events(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  entry_count INTEGER,
  upload_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Talent personal schedules
CREATE TABLE public.talent_personal_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES public.talent_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  time_start TIME,
  time_end TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. CREATE MESSAGING TABLES
-- =====================================================

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Message reactions
CREATE TABLE public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- =====================================================
-- 8. CREATE ASSET MANAGEMENT TABLES
-- =====================================================

-- Talent assets
CREATE TABLE public.talent_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES public.talent_profiles(id) ON DELETE CASCADE NOT NULL,
  category asset_category NOT NULL,
  format asset_format NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  title TEXT,
  description TEXT,
  metadata JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Watermark settings
CREATE TABLE public.watermark_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT false,
  text TEXT,
  opacity NUMERIC DEFAULT 0.3,
  position TEXT DEFAULT 'center',
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Business talent access control
CREATE TABLE public.business_talent_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  talent_id UUID REFERENCES public.talent_profiles(id) ON DELETE CASCADE NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_user_id, talent_id)
);

-- =====================================================
-- 9. CREATE SITE CONFIGURATION TABLES
-- =====================================================

-- UI settings (appearance, etc.)
CREATE TABLE public.ui_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Site design settings
CREATE TABLE public.site_design_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings JSONB,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 10. CREATE STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('talent-headshots', 'talent-headshots', true),
  ('talent-character-images', 'talent-character-images', true),
  ('talent-promo-videos', 'talent-promo-videos', true),
  ('talent-images', 'talent-images', true);

-- =====================================================
-- 11. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_talent_profiles_user_id ON public.talent_profiles(user_id);
CREATE INDEX idx_talent_profiles_active ON public.talent_profiles(active);
CREATE INDEX idx_calendar_event_talent_id ON public.calendar_event(talent_id);
CREATE INDEX idx_calendar_event_start_date ON public.calendar_event(start_date);
CREATE INDEX idx_business_events_created_by ON public.business_events(created_by);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX idx_talent_assets_talent_id ON public.talent_assets(talent_id);

-- =====================================================
-- 12. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_quick_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_talent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_travel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_hotel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_schedule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_bulk_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_personal_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watermark_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_talent_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_design_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 13. CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'staff'));
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Role permissions policies
CREATE POLICY "Everyone can view permissions" ON public.role_permissions
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage permissions" ON public.role_permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Talent profiles policies
CREATE POLICY "Talent can view their own profile" ON public.talent_profiles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Talent can update their own profile" ON public.talent_profiles
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all talent profiles" ON public.talent_profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));
CREATE POLICY "Admins can manage talent profiles" ON public.talent_profiles
  FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can view active talent" ON public.talent_profiles
  FOR SELECT USING (active = true AND public_visibility = true);
CREATE POLICY "Business can view accessible talent" ON public.talent_profiles
  FOR SELECT USING (
    has_role(auth.uid(), 'business') AND 
    EXISTS (
      SELECT 1 FROM public.business_talent_access 
      WHERE business_user_id = auth.uid() AND talent_id = public.talent_profiles.id
    )
  );

-- User profile data policies
CREATE POLICY "Users can manage their own profile data" ON public.user_profile_data
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can view all profile data" ON public.user_profile_data
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Calendar event policies
CREATE POLICY "Talent can manage their own events" ON public.calendar_event
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.talent_profiles 
      WHERE id = calendar_event.talent_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Admins can manage all events" ON public.calendar_event
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));
CREATE POLICY "Public can view public events" ON public.calendar_event
  FOR SELECT USING (status IN ('booked', 'available'));

-- Business events policies
CREATE POLICY "Admins can manage all business events" ON public.business_events
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));
CREATE POLICY "Business users can view their events" ON public.business_events
  FOR SELECT USING (
    has_role(auth.uid(), 'business') AND
    EXISTS (
      SELECT 1 FROM public.business_event_account bea
      JOIN public.business_account ba ON bea.business_account_id = ba.id
      WHERE bea.event_id = business_events.id AND ba.user_id = auth.uid()
    )
  );
CREATE POLICY "Talent can view their assigned events" ON public.business_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_event_talent bet
      JOIN public.talent_profiles tp ON bet.talent_id = tp.id
      WHERE bet.event_id = business_events.id AND tp.user_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Admins can view all messages" ON public.messages
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Talent assets policies
CREATE POLICY "Talent can manage their assets" ON public.talent_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.talent_profiles 
      WHERE id = talent_assets.talent_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Admins can manage all assets" ON public.talent_assets
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));
CREATE POLICY "Business can view accessible talent assets" ON public.talent_assets
  FOR SELECT USING (
    has_role(auth.uid(), 'business') AND
    EXISTS (
      SELECT 1 FROM public.business_talent_access 
      WHERE business_user_id = auth.uid() AND talent_id = talent_assets.talent_id
    )
  );

-- Storage policies for buckets
CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view talent headshots" ON storage.objects
  FOR SELECT USING (bucket_id = 'talent-headshots');
CREATE POLICY "Talent can manage their headshots" ON storage.objects
  FOR ALL USING (bucket_id = 'talent-headshots' AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'staff') OR
    EXISTS (
      SELECT 1 FROM public.talent_profiles 
      WHERE user_id = auth.uid() AND id::text = (storage.foldername(name))[1]
    )
  ));

CREATE POLICY "Public can view character images" ON storage.objects
  FOR SELECT USING (bucket_id = 'talent-character-images');
CREATE POLICY "Talent can manage their character images" ON storage.objects
  FOR ALL USING (bucket_id = 'talent-character-images' AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'staff') OR
    EXISTS (
      SELECT 1 FROM public.talent_profiles 
      WHERE user_id = auth.uid() AND id::text = (storage.foldername(name))[1]
    )
  ));

CREATE POLICY "Admins can manage all storage" ON storage.objects
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- UI settings policies
CREATE POLICY "Authenticated users can view UI settings" ON public.ui_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage UI settings" ON public.ui_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Site design settings policies
CREATE POLICY "Authenticated users can view design settings" ON public.site_design_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage design settings" ON public.site_design_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- 14. CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'talent');
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_talent_profiles_updated_at BEFORE UPDATE ON public.talent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_business_events_updated_at BEFORE UPDATE ON public.business_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calendar_event_updated_at BEFORE UPDATE ON public.calendar_event
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 15. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to ensure business account exists
CREATE OR REPLACE FUNCTION public.ensure_business_account_exists(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _account_id UUID;
BEGIN
  SELECT id INTO _account_id FROM public.business_account WHERE user_id = _user_id;
  
  IF _account_id IS NULL THEN
    INSERT INTO public.business_account (user_id)
    VALUES (_user_id)
    RETURNING id INTO _account_id;
  END IF;
  
  RETURN _account_id;
END;
$$;

-- Function to manage event dates
CREATE OR REPLACE FUNCTION public.manage_event_date(
  _event_id UUID,
  _event_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _date_id UUID;
BEGIN
  SELECT id INTO _date_id FROM public.event_dates 
  WHERE event_id = _event_id AND event_date = _event_date;
  
  IF _date_id IS NULL THEN
    INSERT INTO public.event_dates (event_id, event_date)
    VALUES (_event_id, _event_date)
    RETURNING id INTO _date_id;
  END IF;
  
  RETURN _date_id;
END;
$$;

-- =====================================================
-- 16. INSERT DEFAULT DATA
-- =====================================================

-- Insert default role permissions
INSERT INTO public.role_permissions (role_key, permission_scope) VALUES
  ('admin', 'calendar:view'),
  ('admin', 'calendar:edit'),
  ('admin', 'calendar:manage'),
  ('staff', 'calendar:view'),
  ('staff', 'calendar:edit'),
  ('talent', 'calendar:view'),
  ('talent', 'calendar:edit_own'),
  ('business', 'calendar:view');

-- Insert default schedule categories
INSERT INTO public.schedule_categories (name, color, icon, sort_order) VALUES
  ('General', '#6366f1', 'Calendar', 0),
  ('Performance', '#ef4444', 'Star', 1),
  ('Photo Op', '#10b981', 'Camera', 2),
  ('Signing', '#f59e0b', 'Edit3', 3),
  ('Break', '#8b5cf6', 'Coffee', 4);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================