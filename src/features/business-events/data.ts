import { supabase } from "@/integrations/supabase/client";

// Business Events data types
export interface BusinessEvent {
  id: string;
  title?: string;
  start_ts?: string;
  end_ts?: string;
  city?: string;
  state?: string;
  country?: string;
  address_line?: string;
  website?: string;
  hero_logo_path?: string;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessAccount {
  id: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  address_line?: string;
  city?: string;
  state?: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

export interface TalentProfile {
  id: string;
  name: string;
  headshot_url?: string;
}

// Business Events API
export const businessEventsApi = {
  // Get all business events
  async getEvents() {
    const { data, error } = await supabase
      .from('business_events')
      .select(`
        *,
        business_event_talent(
          talent_profiles(id, name, headshot_url)
        ),
        business_event_account(
          business_account(id, name, contact_email)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as BusinessEvent[];
  },

  // Create business event
  async createEvent(event: Partial<BusinessEvent>) {
    const { data, error } = await supabase
      .from('business_events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data as BusinessEvent;
  },

  // Update business event
  async updateEvent(id: string, updates: Partial<BusinessEvent>) {
    const { data, error } = await supabase
      .from('business_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as BusinessEvent;
  },

  // Delete business event
  async deleteEvent(id: string) {
    const { error } = await supabase
      .from('business_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get business accounts
  async getBusinessAccounts() {
    const { data, error } = await supabase
      .from('business_account')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as BusinessAccount[];
  },

  // Get talent profiles
  async getTalentProfiles() {
    const { data, error } = await supabase
      .from('talent_profiles')
      .select('id, name, headshot_url')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return data as TalentProfile[];
  },

  // Assign talent to event
  async assignTalent(eventId: string, talentId: string) {
    const { error } = await supabase
      .from('business_event_talent')
      .insert([{ event_id: eventId, talent_id: talentId }]);

    if (error) throw error;
  },

  // Remove talent from event
  async removeTalent(eventId: string, talentId: string) {
    const { error } = await supabase
      .from('business_event_talent')
      .delete()
      .eq('event_id', eventId)
      .eq('talent_id', talentId);

    if (error) throw error;
  },

  // Assign business account to event
  async assignBusinessAccount(eventId: string, businessAccountId: string) {
    const { error } = await supabase
      .from('business_event_account')
      .insert([{ event_id: eventId, business_account_id: businessAccountId }]);

    if (error) throw error;
  },

  // Remove business account from event
  async removeBusinessAccount(eventId: string, businessAccountId: string) {
    const { error } = await supabase
      .from('business_event_account')
      .delete()
      .eq('event_id', eventId)
      .eq('business_account_id', businessAccountId);

    if (error) throw error;
  }
};