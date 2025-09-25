import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CommitMode = 'merge' | 'replace';

type EventInput = {
  talent_id: string;
  event_title: string;
  status: 'booked'|'hold'|'tentative'|'available'|'cancelled'|'not_available';
  all_day: true;
  timezone: string;
  start_date: string;   // YYYY-MM-DD format
  end_date: string;     // YYYY-MM-DD format
  venue_name?: string|null;
  location_city?: string|null;
  location_state?: string|null;
  location_country?: string|null;
  address_line?: string|null;
  notes_public?: string|null;
  notes_internal?: string|null;
  source_file?: string|null;
  source_row_id?: string|null;
};

type CommitRequest = {
  talentId: string;
  year: number;                // 2025|2026|2027
  mode: CommitMode;            // 'merge' or 'replace'
  events: EventInput[];        // already normalized by client dry-run
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth = req.headers.get('Authorization') ?? '';
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  console.log('Weekend Matrix Commit - Request received');

  if (!jwt) {
    console.error('Missing Authorization Bearer token');
    return new Response(
      JSON.stringify({ error: 'Missing Authorization Bearer token' }), 
      { status: 401, headers: corsHeaders }
    );
  }

  const client = createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  let body: CommitRequest;
  try {
    body = await req.json();
    console.log(`Processing commit request: ${body.events?.length || 0} events, mode: ${body.mode}, year: ${body.year}`);
  } catch (error) {
    console.error('Invalid JSON:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }), 
      { status: 400, headers: corsHeaders }
    );
  }

  // Get authenticated user
  const { data: userInfo, error: userErr } = await client.auth.getUser();
  if (userErr || !userInfo.user) {
    console.error('Authentication failed:', userErr);
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }), 
      { status: 401, headers: corsHeaders }
    );
  }
  const uid = userInfo.user.id;
  console.log(`Authenticated user: ${uid}`);

  // Permission helper
  async function hasPerm(scope: string): Promise<boolean> {
    try {
      const { data, error } = await client.rpc('has_permission', { 
        p_uid: uid, 
        p_scope: scope 
      });
      if (error) {
        console.error(`Permission check failed for ${scope}:`, error);
        throw error;
      }
      console.log(`Permission check ${scope}: ${data}`);
      return !!data;
    } catch (e) {
      console.error(`Permission check error for ${scope}:`, e);
      return false;
    }
  }

  // Talent ownership check (for edit_own)
  async function isOwnTalent(talentId: string): Promise<boolean> {
    try {
      const { data, error } = await client
        .from('talent_profiles')
        .select('id')
        .eq('id', talentId)
        .eq('user_id', uid)
        .maybeSingle();
      if (error) {
        console.error('Talent ownership check failed:', error);
        throw error;
      }
      const isOwner = !!data;
      console.log(`Talent ownership check for ${talentId}: ${isOwner}`);
      return isOwner;
    } catch (e) {
      console.error('Talent ownership error:', e);
      return false;
    }
  }

  // Validate mode permissions
  try {
    if (body.mode === 'replace') {
      const canManage = await hasPerm('calendar:manage');
      if (!canManage) {
        console.error('Replace Year mode requires calendar:manage permission');
        return new Response(
          JSON.stringify({ error: 'Forbidden: calendar:manage required for Replace Year mode' }), 
          { status: 403, headers: corsHeaders }
        );
      }
    } else {
      // merge: allow admin/staff with calendar:edit; or talent/business with calendar:edit_own AND ownership
      const canEdit = await hasPerm('calendar:edit');
      if (!canEdit) {
        const canEditOwn = await hasPerm('calendar:edit_own');
        if (canEditOwn) {
          const own = await isOwnTalent(body.talentId);
          if (!own) {
            console.error('User cannot edit calendar for this talent');
            return new Response(
              JSON.stringify({ error: 'Forbidden: can only edit your own talent calendar' }), 
              { status: 403, headers: corsHeaders }
            );
          }
        } else {
          console.error('User lacks calendar edit permissions');
          return new Response(
            JSON.stringify({ error: 'Forbidden: calendar edit permission required' }), 
            { status: 403, headers: corsHeaders }
          );
        }
      }
    }
  } catch (e) {
    console.error('Permission validation failed:', e);
    return new Response(
      JSON.stringify({ error: 'Permission check failed', detail: String(e) }), 
      { status: 500, headers: corsHeaders }
    );
  }

  // Validate year
  if (body.year < 2025 || body.year > 2027) {
    console.error(`Invalid year: ${body.year}`);
    return new Response(
      JSON.stringify({ error: 'Year must be between 2025 and 2027' }), 
      { status: 400, headers: corsHeaders }
    );
  }

  // Filter/normalize events server-side to the selected talent/year bounds
  const from = `${body.year}-01-01`;
  const to = `${body.year + 1}-01-01`;
  const events = (body.events || []).filter(e => {
    const validBounds = e.talent_id === body.talentId &&
      e.start_date >= from && e.start_date < to &&
      e.end_date >= e.start_date;
    
    if (!validBounds) {
      console.log(`Filtering out event: ${e.event_title} - outside year bounds or invalid dates`);
    }
    return validBounds;
  });

  console.log(`Filtered to ${events.length} valid events for processing`);

  // Replace Year delete
  if (body.mode === 'replace') {
    console.log(`Executing Replace Year: deleting all events for talent ${body.talentId} in year ${body.year}`);
    try {
      const { data: delCount, error: delErr } = await client.rpc('delete_calendar_year', {
        p_talent_id: body.talentId,
        p_year: body.year
      });
      if (delErr) {
        console.error('Year delete failed:', delErr);
        return new Response(
          JSON.stringify({ error: 'Year delete failed', detail: delErr.message }), 
          { status: 500, headers: corsHeaders }
        );
      }
      console.log(`Deleted ${delCount} existing events for year ${body.year}`);
    } catch (e) {
      console.error('Year delete exception:', e);
      return new Response(
        JSON.stringify({ error: 'Year delete failed', detail: String(e) }), 
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Idempotent upsert using unique index (talent_id, event_title, start_date, end_date)
  const chunkSize = 500;
  let created = 0, failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < events.length; i += chunkSize) {
    const chunk = events.slice(i, i + chunkSize);
    console.log(`Processing chunk ${Math.floor(i/chunkSize) + 1}: ${chunk.length} events`);
    
    try {
      const { data, error } = await client
        .from('calendar_event')
        .upsert(chunk, {
          onConflict: 'talent_id,event_title,start_date,end_date',
          ignoreDuplicates: false
        })
        .select('id');

      if (error) {
        console.error(`Chunk ${Math.floor(i/chunkSize) + 1} failed:`, error);
        failed += chunk.length;
        errors.push(`Chunk ${Math.floor(i/chunkSize) + 1}: ${error.message}`);
        continue;
      }

      // Count successful upserts
      const successCount = data?.length || chunk.length;
      created += successCount;
      console.log(`Chunk ${Math.floor(i/chunkSize) + 1} completed: ${successCount} events processed`);
    } catch (e) {
      console.error(`Chunk ${Math.floor(i/chunkSize) + 1} exception:`, e);
      failed += chunk.length;
      errors.push(`Chunk ${Math.floor(i/chunkSize) + 1}: ${String(e)}`);
    }
  }

  const response = {
    ok: true,
    counts: { 
      created, 
      updated: 0, // Supabase upsert doesn't differentiate, so we put all in created
      skipped: 0, // Duplicates are handled by unique constraint
      failed 
    },
    errors: errors.length > 0 ? errors : undefined
  };

  console.log('Weekend Matrix Commit completed:', response);

  return new Response(
    JSON.stringify(response), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});