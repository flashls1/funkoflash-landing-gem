-- Restore and align database schema with app expectations
-- 1) Adjust profiles to include user_id alias and background image
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_id uuid GENERATED ALWAYS AS (id) STORED,
  ADD COLUMN IF NOT EXISTS background_image_url text;

-- 2) business_events: add location detail columns used in UI
ALTER TABLE public.business_events
  ADD COLUMN IF NOT EXISTS venue text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text;

-- 3) show_schedule_entries -> schedule_categories relation for typed joins
DO $$ BEGIN
  ALTER TABLE public.show_schedule_entries
    ADD CONSTRAINT show_schedule_entries_category_id_fkey
    FOREIGN KEY (category_id)
    REFERENCES public.schedule_categories(id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) talent_quick_view: expand columns to match app usage
ALTER TABLE public.talent_quick_view
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS passport_number text,
  ADD COLUMN IF NOT EXISTS visa_number text,
  ADD COLUMN IF NOT EXISTS passport_image_url text,
  ADD COLUMN IF NOT EXISTS visa_image_url text,
  ADD COLUMN IF NOT EXISTS passport_image_iv text,
  ADD COLUMN IF NOT EXISTS visa_image_iv text,
  ADD COLUMN IF NOT EXISTS birth_year integer,
  ADD COLUMN IF NOT EXISTS image_view_failed_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_view_locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS image_view_locked_by_admin boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS local_airport text,
  ADD COLUMN IF NOT EXISTS facebook text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS tiktok text,
  ADD COLUMN IF NOT EXISTS popular_roles text,
  ADD COLUMN IF NOT EXISTS special_notes text,
  ADD COLUMN IF NOT EXISTS headshot_url text,
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Updated-at trigger for talent_quick_view
DO $$ BEGIN
  CREATE TRIGGER update_talent_quick_view_updated_at
  BEFORE UPDATE ON public.talent_quick_view
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5) Allow admin-created talent profiles without linked user initially
DO $$ BEGIN
  ALTER TABLE public.talent_profiles ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- 6) Helper and RPC functions used by the app

-- Update sort_order for many talent rows
CREATE OR REPLACE FUNCTION public.update_talent_sort_order(talent_updates jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF talent_updates IS NULL OR jsonb_typeof(talent_updates) <> 'array' THEN
    RETURN;
  END IF;
  UPDATE public.talent_profiles t
  SET sort_rank = (u.elem->>'sort_rank')::int
  FROM jsonb_array_elements(talent_updates) AS u(elem)
  WHERE t.id = (u.elem->>'id')::uuid;
END; $$;

-- Remove orphaned talent profiles (no user and inactive). Return removed ids
CREATE OR REPLACE FUNCTION public.cleanup_business_talent_profiles()
RETURNS TABLE(id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  DELETE FROM public.talent_profiles tp
  WHERE (tp.user_id IS NULL OR tp.user_id = '00000000-0000-0000-0000-000000000000'::uuid)
    AND COALESCE(tp.active, true) = false
  RETURNING tp.id;
END; $$;

-- Get users eligible to be connected to a talent profile
CREATE OR REPLACE FUNCTION public.get_available_talent_users()
RETURNS TABLE(user_id uuid, name text, email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id AS user_id,
         COALESCE(p.display_name, trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,''))) AS name,
         p.email
  FROM public.profiles p
  WHERE p.active = true
    AND (p.role = 'talent')
    AND NOT EXISTS (
      SELECT 1 FROM public.talent_profiles tp WHERE tp.user_id = p.id
    )
  ORDER BY name;
$$;

-- Connect an existing talent profile to a user
CREATE OR REPLACE FUNCTION public.connect_talent_to_user(p_talent_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.talent_profiles SET user_id = p_user_id WHERE id = p_talent_id;
END; $$;

-- Generate unique, slugified talent slug
CREATE OR REPLACE FUNCTION public.generate_unique_talent_slug(p_name text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_slug text := regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g');
  candidate text := base_slug;
  suffix int := 1;
BEGIN
  IF candidate IS NULL OR candidate = '' THEN
    candidate := 'talent';
  END IF;
  WHILE EXISTS (SELECT 1 FROM public.talent_profiles WHERE slug = candidate) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix::text;
  END LOOP;
  RETURN candidate;
END; $$;

-- Create a talent profile as admin; returns new id
CREATE OR REPLACE FUNCTION public.create_admin_talent_profile(
  p_name text,
  p_slug text,
  p_bio text,
  p_headshot_url text,
  p_active boolean,
  p_sort_rank int,
  p_public_visibility boolean
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.talent_profiles(
    name, slug, bio, headshot_url, active, sort_rank, public_visibility
  ) VALUES (
    p_name, p_slug, p_bio, p_headshot_url, COALESCE(p_active, true), COALESCE(p_sort_rank, 0), COALESCE(p_public_visibility, false)
  ) RETURNING id INTO _id;
  RETURN _id;
END; $$;

-- Security audit logging helper
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_activity_logs (user_id, admin_user_id, action, details)
  VALUES (
    auth.uid(),
    auth.uid(),
    p_action,
    jsonb_build_object(
      'table', p_table_name,
      'record_id', p_record_id,
      'old', p_old_values,
      'new', p_new_values,
      'at', now()
    )
  );
END; $$;

-- Safely update a user's role in both user_roles and profiles
CREATE OR REPLACE FUNCTION public.update_user_role_safely(target_user_id uuid, new_role public.app_role)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Upsert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Update profiles.role for convenience (UI relies on it)
  UPDATE public.profiles SET role = new_role WHERE id = target_user_id;

  RETURN true;
END; $$;

-- Comprehensive cleanup for a user's data
CREATE OR REPLACE FUNCTION public.delete_user_and_files_completely(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Messages and reactions
  DELETE FROM public.message_reactions WHERE user_id = target_user_id;
  DELETE FROM public.messages WHERE sender_id = target_user_id OR recipient_id = target_user_id;

  -- Detach talent profile
  UPDATE public.talent_profiles SET user_id = NULL WHERE user_id = target_user_id;

  -- Accounts
  DELETE FROM public.business_account WHERE user_id = target_user_id;

  -- Activity logs and login history
  DELETE FROM public.user_activity_logs WHERE user_id = target_user_id OR admin_user_id = target_user_id;
  DELETE FROM public.user_login_history WHERE user_id = target_user_id;

  -- Roles then profile
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;

  RETURN true;
END; $$;

-- Public showcase of talent for unauthenticated users
CREATE OR REPLACE FUNCTION public.get_public_talent_showcase()
RETURNS TABLE(id uuid, name text, slug text, headshot_url text, preview_bio text, sort_rank int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, slug, headshot_url, left(coalesce(bio,'')::text, 220) AS preview_bio, coalesce(sort_rank,0)
  FROM public.talent_profiles
  WHERE coalesce(active, true) = true AND coalesce(public_visibility, false) = true
  ORDER BY coalesce(sort_rank,0), name;
$$;
