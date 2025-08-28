import { supabase } from '@/integrations/supabase/client';

export async function getBusinessCalendarForCurrentUser() {
  const { data, error } = await supabase
    .from('v_business_calendar_events')
    .select('*')
    .order('start_at', { ascending: true });
  
  if (error) throw error;
  return data ?? [];
}

export async function getNextBusinessEvent() {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('v_business_calendar_events')
    .select('*')
    .gte('start_at', now)
    .order('start_at', { ascending: true })
    .limit(1);
  
  if (error) throw error;
  return data?.[0] || null;
}