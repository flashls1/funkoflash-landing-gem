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
    const { talentId, action, code, state } = await req.json();

    if (action === 'connect') {
      // Generate OAuth URL
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-oauth`;
      
      const scope = 'https://www.googleapis.com/auth/calendar';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${talentId}`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'callback') {
      // Handle OAuth callback
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-oauth`;

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        throw new Error('Failed to obtain access token');
      }

      // Get user info to get email
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userResponse.json();

      // List user's calendars
      const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const calendarsData = await calendarsResponse.json();

      // Look for existing FunkoFlash calendar or use primary
      let targetCalendar = calendarsData.items?.find((cal: any) => 
        cal.summary?.includes('FunkoFlash')
      );

      if (!targetCalendar) {
        // Create new calendar
        const createResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: `FunkoFlash — Talent Calendar`,
            description: 'Calendar managed by FunkoFlash CMS',
            timeZone: 'America/Chicago',
          }),
        });
        targetCalendar = await createResponse.json();
      }

      // Store connection in database
      const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);
      
      const { error } = await supabase
        .from('gcal_connections')
        .upsert({
          talent_id: state, // state contains talentId
          google_email: userInfo.email,
          calendar_id: targetCalendar.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: expiryDate.toISOString(),
        });

      if (error) throw error;

      // Redirect back to calendar page
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `${supabaseUrl.replace('.supabase.co', '.lovable.dev')}/calendar?connected=true`,
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in google-calendar-oauth:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});