import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { talentId, action } = await req.json();
    
    // Get Google Calendar connection
    const { data: connection, error: connError } = await supabase
      .from('gcal_connections')
      .select('*')
      .eq('talent_id', talentId)
      .single();

    if (connError || !connection) {
      throw new Error('Google Calendar not connected');
    }

    // Check if token needs refresh
    const now = new Date();
    const tokenExpiry = new Date(connection.token_expiry);
    let accessToken = connection.access_token;

    if (now >= tokenExpiry) {
      // Refresh token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await refreshResponse.json();
      if (!tokens.access_token) {
        throw new Error('Failed to refresh access token');
      }

      accessToken = tokens.access_token;
      const newExpiry = new Date(Date.now() + tokens.expires_in * 1000);

      // Update stored tokens
      await supabase
        .from('gcal_connections')
        .update({
          access_token: accessToken,
          token_expiry: newExpiry.toISOString(),
        })
        .eq('talent_id', talentId);
    }

    if (action === 'push') {
      return await handlePush(talentId, connection.calendar_id, accessToken);
    } else if (action === 'pull') {
      return await handlePull(talentId, connection.calendar_id, accessToken);
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in google-calendar-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handlePush(talentId: string, calendarId: string, accessToken: string) {
  // Get CMS events that need syncing
  const { data: events, error } = await supabase
    .from('calendar_event')
    .select('*')
    .eq('talent_id', talentId)
    .eq('do_not_sync', false)
    .gte('start_date', new Date().toISOString().split('T')[0]);

  if (error) throw error;

  let pushed = 0;
  const conflicts = [];

  for (const event of events) {
    try {
      const googleEvent = convertCmsToGoogle(event);

      if (event.gcal_event_id) {
        // Update existing event
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${event.gcal_event_id}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(googleEvent),
          }
        );

        if (response.ok) {
          pushed++;
          await supabase
            .from('calendar_event')
            .update({ last_synced_at: new Date().toISOString() })
            .eq('id', event.id);
        }
      } else {
        // Create new event
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(googleEvent),
          }
        );

        if (response.ok) {
          const createdEvent = await response.json();
          pushed++;
          
          await supabase
            .from('calendar_event')
            .update({ 
              gcal_event_id: createdEvent.id,
              last_synced_at: new Date().toISOString() 
            })
            .eq('id', event.id);
        }
      }
    } catch (error) {
      console.error('Error syncing event:', event.id, error);
    }
  }

  return new Response(
    JSON.stringify({ pushed, conflicts }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handlePull(talentId: string, calendarId: string, accessToken: string) {
  // Get events from Google Calendar
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
    `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Failed to fetch events');

  let pulled = 0;
  const conflicts = [];

  for (const googleEvent of data.items || []) {
    try {
      const cmsEvent = convertGoogleToCms(googleEvent, talentId);

      // Check if event already exists
      const { data: existing } = await supabase
        .from('calendar_event')
        .select('*')
        .eq('gcal_event_id', googleEvent.id)
        .single();

      if (existing) {
        // Check for conflicts (both sides modified since last sync)
        const googleUpdated = new Date(googleEvent.updated);
        const cmsUpdated = new Date(existing.updated_at);
        const lastSync = existing.last_synced_at ? new Date(existing.last_synced_at) : new Date(0);

        if (googleUpdated > lastSync && cmsUpdated > lastSync) {
          conflicts.push({
            id: existing.id,
            title: existing.event_title,
            date: existing.start_date,
            cmsVersion: existing,
            googleVersion: cmsEvent,
          });
          continue;
        }

        // Update existing
        await supabase
          .from('calendar_event')
          .update({ 
            ...cmsEvent,
            last_synced_at: new Date().toISOString() 
          })
          .eq('id', existing.id);
        pulled++;
      } else {
        // Create new
        await supabase
          .from('calendar_event')
          .insert({ 
            ...cmsEvent,
            gcal_event_id: googleEvent.id,
            last_synced_at: new Date().toISOString() 
          });
        pulled++;
      }
    } catch (error) {
      console.error('Error processing Google event:', googleEvent.id, error);
    }
  }

  return new Response(
    JSON.stringify({ pulled, conflicts }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function convertCmsToGoogle(event: any) {
  const startDateTime = event.all_day 
    ? { date: event.start_date }
    : { 
        dateTime: `${event.start_date}T${event.start_time || '00:00:00'}`,
        timeZone: event.timezone || 'America/Chicago'
      };

  const endDateTime = event.all_day
    ? { date: event.end_date }
    : {
        dateTime: `${event.end_date}T${event.end_time || '23:59:59'}`,
        timeZone: event.timezone || 'America/Chicago'
      };

  // Status to color mapping
  const colorMap: Record<string, string> = {
    booked: '9',     // Red
    hold: '6',       // Orange
    tentative: '5',  // Yellow
    available: '10', // Green
    cancelled: '11', // Gray
    not_available: '8' // Purple
  };

  const location = [
    event.venue_name,
    event.address_line,
    event.location_city,
    event.location_state,
    event.location_country
  ].filter(Boolean).join(', ');

  return {
    summary: event.event_title,
    description: event.notes_public || '',
    location: location || undefined,
    start: startDateTime,
    end: endDateTime,
    colorId: colorMap[event.status] || '1',
    extendedProperties: {
      private: {
        cmsStatus: event.status,
        notesInternal: event.notes_internal || '',
        travelIn: event.travel_in || '',
        travelOut: event.travel_out || '',
      }
    }
  };
}

function convertGoogleToCms(googleEvent: any, talentId: string) {
  const isAllDay = !googleEvent.start.dateTime;
  
  let startDate, endDate, startTime, endTime;
  
  if (isAllDay) {
    startDate = googleEvent.start.date;
    endDate = googleEvent.end.date;
  } else {
    const start = new Date(googleEvent.start.dateTime);
    const end = new Date(googleEvent.end.dateTime);
    
    startDate = start.toISOString().split('T')[0];
    endDate = end.toISOString().split('T')[0];
    startTime = start.toTimeString().split(' ')[0];
    endTime = end.toTimeString().split(' ')[0];
  }

  // Color to status mapping (reverse of above)
  const statusMap: Record<string, string> = {
    '9': 'booked',
    '6': 'hold', 
    '5': 'tentative',
    '10': 'available',
    '11': 'cancelled',
    '8': 'not_available'
  };

  const status = statusMap[googleEvent.colorId] || 'available';

  return {
    talent_id: talentId,
    event_title: googleEvent.summary || 'Untitled Event',
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    all_day: isAllDay,
    status,
    venue_name: null,
    address_line: null,
    location_city: null,
    location_state: null,
    location_country: null,
    notes_public: googleEvent.description || null,
    notes_internal: googleEvent.extendedProperties?.private?.notesInternal || null,
    timezone: googleEvent.start.timeZone || 'America/Chicago',
    travel_in: googleEvent.extendedProperties?.private?.travelIn || null,
    travel_out: googleEvent.extendedProperties?.private?.travelOut || null,
  };
}