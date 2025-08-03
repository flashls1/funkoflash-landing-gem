-- Security Enhancement: Role Change Validation and Audit Logging

-- Create security_events table for audit logging
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all security events
CREATE POLICY "Admins can view all security events" 
ON public.security_events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create table for failed login attempts tracking
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  email TEXT,
  attempts INTEGER NOT NULL DEFAULT 1,
  last_attempt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on failed_login_attempts
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for system access to failed login attempts
CREATE POLICY "System can manage failed login attempts" 
ON public.failed_login_attempts 
FOR ALL 
USING (true);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_details JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (user_id, event_type, details, ip_address, user_agent, severity)
  VALUES (p_user_id, p_event_type, p_details, p_ip_address, p_user_agent, p_severity)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$function$;

-- Function to validate role changes and prevent privilege escalation
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  requester_role app_role;
  current_user_role app_role;
BEGIN
  -- Get the role of the user making the change
  SELECT role INTO requester_role FROM public.profiles WHERE user_id = auth.uid();
  
  -- Get current role of the target user
  SELECT role INTO current_user_role FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Only admins can change roles
  IF requester_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can modify user roles';
  END IF;
  
  -- Log the role change attempt
  PERFORM public.log_security_event(
    auth.uid(),
    'role_change_attempt',
    jsonb_build_object(
      'target_user_id', NEW.user_id,
      'old_role', current_user_role,
      'new_role', NEW.role,
      'requester_role', requester_role
    ),
    NULL,
    NULL,
    'high'
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for role validation on profiles table
DROP TRIGGER IF EXISTS validate_role_change_trigger ON public.profiles;
CREATE TRIGGER validate_role_change_trigger
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_change();

-- Function to track failed login attempts
CREATE OR REPLACE FUNCTION public.track_failed_login(
  p_ip_address TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_attempts INTEGER := 0;
  block_duration INTERVAL := '15 minutes';
BEGIN
  -- Get current attempts for this IP
  SELECT attempts INTO current_attempts 
  FROM public.failed_login_attempts 
  WHERE ip_address = p_ip_address 
  AND (blocked_until IS NULL OR blocked_until < now());
  
  IF current_attempts IS NULL THEN
    -- First failed attempt from this IP
    INSERT INTO public.failed_login_attempts (ip_address, email, attempts)
    VALUES (p_ip_address, p_email, 1);
  ELSE
    -- Increment attempts
    current_attempts := current_attempts + 1;
    
    -- Block IP if too many attempts (5 attempts = 15 min block)
    IF current_attempts >= 5 THEN
      UPDATE public.failed_login_attempts 
      SET attempts = current_attempts, 
          blocked_until = now() + block_duration,
          last_attempt = now()
      WHERE ip_address = p_ip_address;
      
      -- Log security event
      PERFORM public.log_security_event(
        NULL,
        'ip_blocked_excessive_failures',
        jsonb_build_object(
          'ip_address', p_ip_address,
          'attempts', current_attempts,
          'blocked_until', now() + block_duration
        ),
        p_ip_address,
        NULL,
        'high'
      );
    ELSE
      UPDATE public.failed_login_attempts 
      SET attempts = current_attempts, last_attempt = now()
      WHERE ip_address = p_ip_address;
    END IF;
  END IF;
END;
$function$;

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.failed_login_attempts 
    WHERE ip_address = p_ip_address 
    AND blocked_until > now()
  );
$function$;

-- Function to reset failed attempts on successful login
CREATE OR REPLACE FUNCTION public.reset_failed_attempts(p_ip_address TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  DELETE FROM public.failed_login_attempts WHERE ip_address = p_ip_address;
END;
$function$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON public.failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_blocked_until ON public.failed_login_attempts(blocked_until);