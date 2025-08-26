import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the JWT and get user
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user has admin or staff role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!['admin', 'staff'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin or Staff role required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user_id from query parameters
    const url = new URL(req.url)
    const targetUserId = url.searchParams.get('user_id')
    
    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'user_id parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Exporting login history for user: ${targetUserId} by admin: ${user.id}`)

    // Get all login history for the specified user
    const { data: loginHistory, error: historyError } = await supabase
      .from('user_login_history')
      .select('ip_address, user_agent, login_time, location_info')
      .eq('user_id', targetUserId)
      .order('login_time', { ascending: false })

    if (historyError) {
      console.error('Error fetching login history:', historyError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch login history' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate CSV content
    const csvHeaders = 'ip_address,city,region,country,login_time,user_agent\n'
    const csvRows = loginHistory.map(record => {
      const city = record.location_info?.city || ''
      const region = record.location_info?.region || ''
      const country = record.location_info?.country || ''
      const loginTime = new Date(record.login_time).toISOString()
      const userAgent = (record.user_agent || '').replace(/"/g, '""') // Escape quotes
      
      return `"${record.ip_address}","${city}","${region}","${country}","${loginTime}","${userAgent}"`
    }).join('\n')

    const csvContent = csvHeaders + csvRows
    
    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const filename = `login-history-${targetUserId}-${today}.csv`

    console.log(`Generated CSV with ${loginHistory.length} records for user ${targetUserId}`)

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Unexpected error in export-login-history:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})