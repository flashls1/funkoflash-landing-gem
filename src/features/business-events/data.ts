import { supabase } from "@/integrations/supabase/client";

// Daily schedule item type
interface DailyScheduleItem {
  day: number;
  date: string;
  start_time?: string;
  end_time?: string;
}

// Business Events data types
export interface BusinessEvent {
  id: string;
  title?: string;
  venue?: string;
  start_ts?: string;
  end_ts?: string;
  city?: string;
  state?: string;
  country?: string;
  address_line?: string;
  website?: string;
  hero_logo_path?: string;
  status: string;
  primary_business_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessEventTravel {
  id: string;
  event_id: string;
  talent_id: string;
  airline_name?: string;
  confirmation_codes?: string;
  status: 'Booked' | 'Not Booked';
  arrival_datetime?: string;
  departure_datetime?: string;
  flight_tickets_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface BusinessEventHotel {
  id: string;
  event_id: string;
  talent_id: string;
  hotel_name?: string;
  hotel_address?: string;
  confirmation_number?: string;
  checkin_date?: string;
  checkout_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
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

    // Create corresponding calendar events for the talent
    await this.createCalendarEventsForBusinessEvent(eventId, talentId);
  },

  // Remove talent from event
  async removeTalent(eventId: string, talentId: string) {
    const { error } = await supabase
      .from('business_event_talent')
      .delete()
      .eq('event_id', eventId)
      .eq('talent_id', talentId);

    if (error) throw error;

    // Remove corresponding calendar events
    await this.removeCalendarEventsForBusinessEvent(eventId, talentId);
  },

  // Assign business account to event
  async assignBusinessAccount(eventId: string, businessAccountId: string) {
    const { error } = await supabase
      .from('business_event_account')
      .insert([{ event_id: eventId, business_account_id: businessAccountId }]);

    if (error) throw error;

    // Create corresponding calendar events for the business user
    await this.createCalendarEventsForBusinessUser(eventId, businessAccountId);
  },

  // Remove business account from event
  async removeBusinessAccount(eventId: string, businessAccountId: string) {
    const { error } = await supabase
      .from('business_event_account')
      .delete()
      .eq('event_id', eventId)
      .eq('business_account_id', businessAccountId);

    if (error) throw error;

    // Remove corresponding calendar events for the business user
    await this.removeCalendarEventsForBusinessUser(eventId, businessAccountId);
  },

  // Travel details API
  async getTravelDetails(eventId: string, talentId?: string) {
    let query = supabase
      .from('business_event_travel')
      .select('*, talent_profiles(id, name)')
      .eq('event_id', eventId);

    if (talentId) {
      query = query.eq('talent_id', talentId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as BusinessEventTravel[];
  },

  async upsertTravelDetails(travelData: Omit<BusinessEventTravel, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('business_event_travel')
      .upsert(travelData)
      .select()
      .single();

    if (error) throw error;
    return data as BusinessEventTravel;
  },

  // Hotel details API
  async getHotelDetails(eventId: string, talentId?: string) {
    let query = supabase
      .from('business_event_hotel')
      .select('*, talent_profiles(id, name)')
      .eq('event_id', eventId);

    if (talentId) {
      query = query.eq('talent_id', talentId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as BusinessEventHotel[];
  },

  async upsertHotelDetails(hotelData: Omit<BusinessEventHotel, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('business_event_hotel')
      .upsert(hotelData)
      .select()
      .single();

    if (error) throw error;
    return data as BusinessEventHotel;
  },

  // Update talent financial details
  async updateTalentFinancials(eventId: string, talentId: string, financials: {
    per_diem_amount?: number | null;
    guarantee_amount?: number | null;
    per_diem_currency?: string;
    guarantee_currency?: string;
  }) {
    const { data, error } = await supabase
      .from('business_event_talent')
      .update(financials)
      .eq('event_id', eventId)
      .eq('talent_id', talentId);
    
    if (error) throw error;
    return data;
  },

  // Helper function to ensure business account exists for business users
  async ensureBusinessAccountForUser(userId: string) {
    const { data, error } = await supabase
      .rpc('ensure_business_account_exists', { p_user_id: userId });

    if (error) throw error;
    return data;
  },

  // Create calendar events when talent is assigned to business event
  async createCalendarEventsForBusinessEvent(eventId: string, talentId: string) {
    // Get the business event details
    const { data: businessEvent, error: eventError } = await supabase
      .from('business_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !businessEvent) {
      console.error('Error fetching business event:', eventError);
      return;
    }

    // Parse daily_schedule if it exists
    const dailySchedule = businessEvent.daily_schedule;
    
    if (Array.isArray(dailySchedule) && dailySchedule.length > 0) {
      // Create calendar events for each day in the schedule
      for (const dayItem of dailySchedule) {
        const day = dayItem as unknown as DailyScheduleItem;
        if (day.date) {
          const calendarEvent = {
            talent_id: talentId,
            start_date: day.date,
            end_date: day.date,
            start_time: day.start_time || null,
            end_time: day.end_time || null,
            all_day: !day.start_time && !day.end_time,
            event_title: businessEvent.title || 'Business Event',
            status: 'booked',
            venue_name: businessEvent.venue,
            location_city: businessEvent.city,
            location_state: businessEvent.state,
            location_country: businessEvent.country,
            address_line: businessEvent.address_line,
            url: businessEvent.website,
            notes_internal: `Business Event: ${businessEvent.title}`,
            notes_public: `Day ${day.day} of ${businessEvent.title}`,
            source_file: 'business_event',
            source_row_id: eventId
          };

          const { error } = await supabase
            .from('calendar_event')
            .insert([calendarEvent]);

          if (error) {
            console.error('Error creating calendar event:', error);
          }
        }
      }
    } else {
      // If no daily schedule, create a single event based on start/end timestamps
      if (businessEvent.start_ts) {
        const startDate = businessEvent.start_ts.split('T')[0];
        const endDate = businessEvent.end_ts ? businessEvent.end_ts.split('T')[0] : startDate;
        
        const calendarEvent = {
          talent_id: talentId,
          start_date: startDate,
          end_date: endDate,
          start_time: businessEvent.start_ts.includes('T') ? businessEvent.start_ts.split('T')[1]?.split('.')[0] : null,
          end_time: businessEvent.end_ts?.includes('T') ? businessEvent.end_ts.split('T')[1]?.split('.')[0] : null,
          all_day: !businessEvent.start_ts.includes('T'),
          event_title: businessEvent.title || 'Business Event',
          status: 'booked',
          venue_name: businessEvent.venue,
          location_city: businessEvent.city,
          location_state: businessEvent.state,
          location_country: businessEvent.country,
          address_line: businessEvent.address_line,
          url: businessEvent.website,
          notes_internal: `Business Event: ${businessEvent.title}`,
          source_file: 'business_event',
          source_row_id: eventId
        };

        const { error } = await supabase
          .from('calendar_event')
          .insert([calendarEvent]);

        if (error) {
          console.error('Error creating calendar event:', error);
        }
      }
    }
  },

  // Remove calendar events when talent is removed from business event
  async removeCalendarEventsForBusinessEvent(eventId: string, talentId: string) {
    const { error } = await supabase
      .from('calendar_event')
      .delete()
      .eq('talent_id', talentId)
      .eq('source_file', 'business_event')
      .eq('source_row_id', eventId);

    if (error) {
      console.error('Error removing calendar events:', error);
    }
  },

  // Create calendar events for business user when assigned to business event
  async createCalendarEventsForBusinessUser(eventId: string, businessAccountId: string) {
    // Get the business event details
    const { data: businessEvent, error: eventError } = await supabase
      .from('business_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !businessEvent) {
      console.error('Error fetching business event:', eventError);
      return;
    }

    // Get the business account details to find the user
    const { data: businessAccount, error: accountError } = await supabase
      .from('business_account')
      .select('contact_email, name')
      .eq('id', businessAccountId)
      .single();

    if (accountError || !businessAccount) {
      console.error('Error fetching business account:', accountError);
      return;
    }

    // Find the user profile for this business account
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .or(`email.eq.${businessAccount.contact_email},business_name.eq.${businessAccount.name}`)
      .eq('role', 'business')
      .single();

    if (!profile) {
      console.log('No business user profile found for this account');
      return;
    }

    // Find or create a talent profile for this business user (for calendar integration)
    let { data: talentProfile } = await supabase
      .from('talent_profiles')
      .select('id')
      .eq('user_id', profile.user_id)
      .single();

    // If no talent profile exists, create one for calendar purposes
    if (!talentProfile) {
      const { data: newTalentProfile, error: createError } = await supabase
        .from('talent_profiles')
        .insert([{
          user_id: profile.user_id,
          name: businessAccount.name || 'Business User',
          slug: `business-${profile.user_id}`,
          active: true,
          public_visibility: false
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating talent profile for business user:', createError);
        return;
      }
      talentProfile = newTalentProfile;
    }

    // Create calendar events similar to talent assignment
    const dailySchedule = businessEvent.daily_schedule;
    
    if (Array.isArray(dailySchedule) && dailySchedule.length > 0) {
      // Create calendar events for each day in the schedule
      for (const dayItem of dailySchedule) {
        const day = dayItem as unknown as DailyScheduleItem;
        if (day.date) {
          const calendarEvent = {
            talent_id: talentProfile.id,
            start_date: day.date,
            end_date: day.date,
            start_time: day.start_time || null,
            end_time: day.end_time || null,
            all_day: !day.start_time && !day.end_time,
            event_title: `[BUSINESS] ${businessEvent.title || 'Business Event'}`,
            status: 'booked',
            venue_name: businessEvent.venue,
            location_city: businessEvent.city,
            location_state: businessEvent.state,
            location_country: businessEvent.country,
            address_line: businessEvent.address_line,
            url: businessEvent.website,
            notes_internal: `Business Event Management: ${businessEvent.title}`,
            notes_public: `Day ${day.day} of ${businessEvent.title} (Business Management)`,
            source_file: 'business_event_management',
            source_row_id: eventId
          };

          const { error } = await supabase
            .from('calendar_event')
            .insert([calendarEvent]);

          if (error) {
            console.error('Error creating business calendar event:', error);
          }
        }
      }
    } else {
      // If no daily schedule, create a single event based on start/end timestamps
      if (businessEvent.start_ts) {
        const startDate = businessEvent.start_ts.split('T')[0];
        const endDate = businessEvent.end_ts ? businessEvent.end_ts.split('T')[0] : startDate;
        
        const calendarEvent = {
          talent_id: talentProfile.id,
          start_date: startDate,
          end_date: endDate,
          start_time: businessEvent.start_ts.includes('T') ? businessEvent.start_ts.split('T')[1]?.split('.')[0] : null,
          end_time: businessEvent.end_ts?.includes('T') ? businessEvent.end_ts.split('T')[1]?.split('.')[0] : null,
          all_day: !businessEvent.start_ts.includes('T'),
          event_title: `[BUSINESS] ${businessEvent.title || 'Business Event'}`,
          status: 'booked',
          venue_name: businessEvent.venue,
          location_city: businessEvent.city,
          location_state: businessEvent.state,
          location_country: businessEvent.country,
          address_line: businessEvent.address_line,
          url: businessEvent.website,
          notes_internal: `Business Event Management: ${businessEvent.title}`,
          source_file: 'business_event_management',
          source_row_id: eventId
        };

        const { error } = await supabase
          .from('calendar_event')
          .insert([calendarEvent]);

        if (error) {
          console.error('Error creating business calendar event:', error);
        }
      }
    }
  },

  // Remove calendar events for business user when removed from business event
  async removeCalendarEventsForBusinessUser(eventId: string, businessAccountId: string) {
    // Get the business account details to find the user
    const { data: businessAccount } = await supabase
      .from('business_account')
      .select('contact_email, name')
      .eq('id', businessAccountId)
      .single();

    if (!businessAccount) return;

    // Find the user profile for this business account
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .or(`email.eq.${businessAccount.contact_email},business_name.eq.${businessAccount.name}`)
      .eq('role', 'business')
      .single();

    if (!profile) return;

    // Find the talent profile for this business user
    const { data: talentProfile } = await supabase
      .from('talent_profiles')
      .select('id')
      .eq('user_id', profile.user_id)
      .single();

    if (!talentProfile) return;

    // Remove the calendar events
    const { error } = await supabase
      .from('calendar_event')
      .delete()
      .eq('talent_id', talentProfile.id)
      .eq('source_file', 'business_event_management')
      .eq('source_row_id', eventId);

    if (error) {
      console.error('Error removing business calendar events:', error);
    }
  }
};