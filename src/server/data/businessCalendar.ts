import { supabase } from '@/integrations/supabase/client';

export async function getBusinessCalendarForCurrentUser() {
  const { data, error } = await supabase
    .from('v_business_calendar_events')
    .select('*')
    .order('start_at', { ascending: true });
  
  if (error) throw error;
  return data ?? [];
}