-- Add user tracking and management fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create user login history table for IP tracking
CREATE TABLE public.user_login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_info JSONB
);

-- Enable RLS on user login history
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user login history
CREATE POLICY "Admins can view all login history" 
ON public.user_login_history 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view all login history" 
ON public.user_login_history 
FOR ALL 
USING (has_role(auth.uid(), 'staff'::app_role));

-- Create user activity logs table
CREATE TABLE public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user activity logs
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user activity logs
CREATE POLICY "Admins can manage all activity logs" 
ON public.user_activity_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update last login time
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login = now() 
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update last login on auth
CREATE TRIGGER on_auth_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.update_last_login();

-- Create function to track user login with IP
CREATE OR REPLACE FUNCTION public.track_user_login(
  p_user_id UUID,
  p_ip_address TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_location_info JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  login_id UUID;
BEGIN
  -- Insert new login record
  INSERT INTO public.user_login_history (user_id, ip_address, user_agent, location_info)
  VALUES (p_user_id, p_ip_address, p_user_agent, p_location_info)
  RETURNING id INTO login_id;
  
  -- Clean up old login records (keep only last 10)
  DELETE FROM public.user_login_history 
  WHERE user_id = p_user_id 
  AND id NOT IN (
    SELECT id FROM public.user_login_history 
    WHERE user_id = p_user_id 
    ORDER BY login_time DESC 
    LIMIT 10
  );
  
  RETURN login_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profiles RLS to allow admins to manage all profiles completely
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user impersonation sessions table
CREATE TABLE public.user_impersonation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on user impersonation sessions
ALTER TABLE public.user_impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user impersonation sessions
CREATE POLICY "Admins can manage impersonation sessions" 
ON public.user_impersonation_sessions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));