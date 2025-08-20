
-- Create business_events table
CREATE TABLE IF NOT EXISTS public.business_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT DEFAULT 'Untitled Event',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  website TEXT,
  logo_url TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  created_by UUID REFERENCES public.profiles(user_id),
  updated_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create junction table for business events and talent
CREATE TABLE IF NOT EXISTS public.business_event_talent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_event_id UUID NOT NULL REFERENCES public.business_events(id) ON DELETE CASCADE,
  talent_profile_id UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_event_id, talent_profile_id)
);

-- Create junction table for business events and business members
CREATE TABLE IF NOT EXISTS public.business_event_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_event_id UUID NOT NULL REFERENCES public.business_events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'coordinator', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_event_id, profile_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_events_start_date ON public.business_events(start_date);
CREATE INDEX IF NOT EXISTS idx_business_events_end_date ON public.business_events(end_date);
CREATE INDEX IF NOT EXISTS idx_business_events_created_by ON public.business_events(created_by);
CREATE INDEX IF NOT EXISTS idx_business_events_deleted_at ON public.business_events(deleted_at);
CREATE INDEX IF NOT EXISTS idx_business_event_talent_event_id ON public.business_event_talent(business_event_id);
CREATE INDEX IF NOT EXISTS idx_business_event_talent_profile_id ON public.business_event_talent(talent_profile_id);
CREATE INDEX IF NOT EXISTS idx_business_event_members_event_id ON public.business_event_members(business_event_id);
CREATE INDEX IF NOT EXISTS idx_business_event_members_profile_id ON public.business_event_members(profile_id);

-- Add business events permissions to role_permissions if not exists
INSERT INTO public.role_permissions (role_key, permission_scope) 
SELECT 'admin'::app_role, 'business_events:manage'
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_key = 'admin'::app_role AND permission_scope = 'business_events:manage'
);

INSERT INTO public.role_permissions (role_key, permission_scope) 
SELECT 'admin'::app_role, 'business_events:edit'
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_key = 'admin'::app_role AND permission_scope = 'business_events:edit'
);

INSERT INTO public.role_permissions (role_key, permission_scope) 
SELECT 'admin'::app_role, 'business_events:view'
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_key = 'admin'::app_role AND permission_scope = 'business_events:view'
);

INSERT INTO public.role_permissions (role_key, permission_scope) 
SELECT 'admin'::app_role, 'business_events:upload'
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_key = 'admin'::app_role AND permission_scope = 'business_events:upload'
);

INSERT INTO public.role_permissions (role_key, permission_scope) 
SELECT 'staff'::app_role, 'business_events:manage'
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_key = 'staff'::app_role AND permission_scope = 'business_events:manage'
);

INSERT INTO public.role_permissions (role_key, permission_scope) 
SELECT 'staff'::app_role, 'business_events:edit'
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_key = 'staff'::app_role AND permission_scope = 'business_events:edit'
);

INSERT INTO public.role_permissions (role_key, permission_scope) 
SELECT 'staff'::app_role, 'business_events:view'
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_key = 'staff'::app_role AND permission_scope = 'business_events:view'
);

INSERT INTO public.role_permissions (role_key, permission_scope) 
SELECT 'staff'::app_role, 'business_events:upload'
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_key = 'staff'::app_role AND permission_scope = 'business_events:upload'
);

INSERT INTO public.role_permissions (role_key, permission_scope) 
SELECT 'business'::app_role, 'business_events:view'
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_key = 'business'::app_role AND permission_scope = 'business_events:view'
);

INSERT INTO public.role_permissions (role_key, permission_scope) 
SELECT 'business'::app_role, 'business_events:edit'
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_key = 'business'::app_role AND permission_scope = 'business_events:edit'
);

INSERT INTO public.role_permissions (role_key, permission_scope) 
SELECT 'talent'::app_role, 'business_events:view'
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions 
  WHERE role_key = 'talent'::app_role AND permission_scope = 'business_events:view'
);

-- Enable RLS on all tables
ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_talent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_event_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_events
CREATE POLICY "Admins and staff can manage all business events" 
  ON public.business_events 
  FOR ALL
  USING (
    has_permission(auth.uid(), 'business_events:manage') OR
    has_permission(auth.uid(), 'business_events:edit')
  );

CREATE POLICY "Business users can view and edit their attached events" 
  ON public.business_events 
  FOR ALL
  USING (
    has_permission(auth.uid(), 'business_events:view') AND
    (
      id IN (
        SELECT business_event_id 
        FROM public.business_event_members 
        WHERE profile_id = auth.uid()
      ) OR
      has_permission(auth.uid(), 'business_events:manage')
    )
  );

CREATE POLICY "Talent can view events they are attached to" 
  ON public.business_events 
  FOR SELECT
  USING (
    has_permission(auth.uid(), 'business_events:view') AND
    (
      id IN (
        SELECT bet.business_event_id 
        FROM public.business_event_talent bet
        JOIN public.talent_profiles tp ON bet.talent_profile_id = tp.id
        WHERE tp.user_id = auth.uid()
      ) OR
      has_permission(auth.uid(), 'business_events:manage')
    )
  );

-- RLS Policies for business_event_talent
CREATE POLICY "Users with business_events:manage can manage talent assignments" 
  ON public.business_event_talent 
  FOR ALL
  USING (has_permission(auth.uid(), 'business_events:manage'));

CREATE POLICY "Business users can manage talent for their events" 
  ON public.business_event_talent 
  FOR ALL
  USING (
    has_permission(auth.uid(), 'business_events:edit') AND
    business_event_id IN (
      SELECT business_event_id 
      FROM public.business_event_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'coordinator')
    )
  );

CREATE POLICY "Users can view talent assignments for events they can see" 
  ON public.business_event_talent 
  FOR SELECT
  USING (
    has_permission(auth.uid(), 'business_events:view') AND
    (
      business_event_id IN (
        SELECT id FROM public.business_events 
        WHERE 
          id IN (SELECT business_event_id FROM public.business_event_members WHERE profile_id = auth.uid()) OR
          id IN (
            SELECT bet.business_event_id 
            FROM public.business_event_talent bet
            JOIN public.talent_profiles tp ON bet.talent_profile_id = tp.id
            WHERE tp.user_id = auth.uid()
          ) OR
          has_permission(auth.uid(), 'business_events:manage')
      )
    )
  );

-- RLS Policies for business_event_members
CREATE POLICY "Users with business_events:manage can manage all member assignments" 
  ON public.business_event_members 
  FOR ALL
  USING (has_permission(auth.uid(), 'business_events:manage'));

CREATE POLICY "Business users can view and manage members for their events" 
  ON public.business_event_members 
  FOR ALL
  USING (
    has_permission(auth.uid(), 'business_events:edit') AND
    (
      business_event_id IN (
        SELECT business_event_id 
        FROM public.business_event_members 
        WHERE profile_id = auth.uid() AND role IN ('owner', 'coordinator')
      ) OR
      profile_id = auth.uid()
    )
  );

-- Create storage bucket for business events
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-events', 'business-events', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for business-events bucket
CREATE POLICY "Public can view business event files" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'business-events');

CREATE POLICY "Authenticated users with upload permission can upload business event files" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'business-events' AND
    has_permission(auth.uid(), 'business_events:upload')
  );

CREATE POLICY "Authenticated users with manage permission can update business event files" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'business-events' AND
    has_permission(auth.uid(), 'business_events:upload')
  );

CREATE POLICY "Authenticated users with manage permission can delete business event files" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'business-events' AND
    has_permission(auth.uid(), 'business_events:manage')
  );

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_business_events_updated_at
  BEFORE UPDATE ON public.business_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
