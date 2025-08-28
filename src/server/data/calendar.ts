import { supabase } from '@/integrations/supabase/client';

// Business calendar for current user (RLS enforces visibility)
export async function getBusinessCalendar() {
  const { data, error } = await supabase
    .from('v_business_calendar_events')
    .select('*')
    .order('start_at', { ascending: true });
  
  if (error) throw error;
  return data ?? [];
}

// Talent calendar for current talent (RLS enforces ownership)
export async function getTalentCalendar() {
  const { data, error } = await supabase
    .from('v_talent_calendar_events')
    .select('*')
    .order('start_at', { ascending: true });
  
  if (error) throw error;
  return data ?? [];
}

// Get next upcoming event for business user
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

// Get next upcoming event for talent user
export async function getNextTalentEvent() {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('v_talent_calendar_events')
    .select('*')
    .gte('start_at', now)
    .order('start_at', { ascending: true })
    .limit(1);
  
  if (error) throw error;
  return data?.[0] || null;
}