import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authentication kontrolü
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Admin kontrolü
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const views = [
      'collection_aggregates',
      'top_whiskies_by_collection',
      'trends_collection_daily',
      'taste_and_rating_stats_by_segment',
      'notes_basic_stats'
    ]

    const results = []

    for (const viewName of views) {
      try {
        const { error } = await supabaseClient.rpc('refresh_materialized_view', {
          view_name: viewName
        })

        if (error) {
          console.error(`Failed to refresh ${viewName}:`, error)
          results.push({
            view: viewName,
            success: false,
            error: error.message
          })
        } else {
          results.push({
            view: viewName,
            success: true,
            refreshed_at: new Date().toISOString()
          })
        }
      } catch (e) {
        console.error(`Error refreshing ${viewName}:`, e)
        results.push({
          view: viewName,
          success: false,
          error: e.message
        })
      }
    }

    // İstatistik güncelle
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Analytics refresh completed: ${successCount}/${totalCount} views refreshed`,
        timestamp: new Date().toISOString(),
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Analytics refresh error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('Admin') || error.message.includes('Unauthorized') ? 403 : 500,
      },
    )
  }
})