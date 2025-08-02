-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login = now() 
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_user_login(
  p_user_id UUID,
  p_ip_address TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_location_info JSONB DEFAULT NULL
)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;