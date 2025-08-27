import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Create client with user's JWT token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    console.log('🧪 Starting comprehensive business dashboard test...');

    // Test 1: Get current user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .single();

    console.log('👤 User Profile:', profile);
    console.log('❌ Profile Error:', profileError);

    if (!profile) {
      throw new Error('Failed to get user profile');
    }

    // Test 2: Get business events (should work with RLS)
    const { data: businessEvents, error: businessEventsError } = await supabase
      .from('business_events')
      .select(`
        *,
        business_event_talent(talent_profiles(id, name, headshot_url)),
        business_event_account(business_account(id, name, contact_email))
      `)
      .order('created_at', { ascending: false });

    console.log('🏢 Business Events:', businessEvents);
    console.log('❌ Business Events Error:', businessEventsError);

    // Test 3: Get next business event (future events only)
    const { data: nextBusinessEvent, error: nextBusinessError } = await supabase
      .from('business_events')
      .select('*')
      .gte('start_ts', new Date().toISOString())
      .order('start_ts', { ascending: true })
      .limit(1);

    console.log('⏰ Next Business Event:', nextBusinessEvent);
    console.log('❌ Next Business Error:', nextBusinessError);

    // Test 4: Get business account for this user
    const { data: businessAccount, error: businessAccountError } = await supabase
      .from('business_account')
      .select('id')
      .or(`contact_email.eq.${profile.email},name.eq.${profile.business_name}`);

    console.log('🏪 Business Account:', businessAccount);
    console.log('❌ Business Account Error:', businessAccountError);

    // Test 5: Get calendar events (if any exist)
    const { data: calendarEvents, error: calendarError } = await supabase
      .from('calendar_event')
      .select('*')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true });

    console.log('📅 Calendar Events:', calendarEvents);
    console.log('❌ Calendar Error:', calendarError);

    // Test 6: Test permissions
    const { data: permissions, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('permission_scope')
      .eq('role_key', profile.role);

    console.log('🔐 Permissions:', permissions);
    console.log('❌ Permissions Error:', permissionsError);

    // Compile results
    const testResults = {
      user_profile: {
        success: !!profile,
        data: profile,
        error: profileError?.message,
      },
      business_events: {
        success: !businessEventsError,
        count: businessEvents?.length || 0,
        data: businessEvents,
        error: businessEventsError?.message,
      },
      next_business_event: {
        success: !nextBusinessError,
        data: nextBusinessEvent,
        error: nextBusinessError?.message,
      },
      business_account: {
        success: !businessAccountError,
        data: businessAccount,
        error: businessAccountError?.message,
      },
      calendar_events: {
        success: !calendarError,
        count: calendarEvents?.length || 0,
        data: calendarEvents,
        error: calendarError?.message,
      },
      permissions: {
        success: !permissionsError,
        data: permissions,
        error: permissionsError?.message,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('🎯 Final Test Results:', JSON.stringify(testResults, null, 2));

    return new Response(JSON.stringify(testResults, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('🚨 Test Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});