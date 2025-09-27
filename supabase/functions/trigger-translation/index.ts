import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranslationRequest {
  whisky_id: number
  target_languages?: string[]
  priority?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // N8N webhook URL
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')! // N8N webhook URL'inizi buraya ekleyin

    if (req.method === 'POST') {
      const { whisky_id, target_languages = ['en', 'ru', 'bg'], priority = 5 }: TranslationRequest = await req.json()

      // Whisky verisini kontrol et
      const { data: whisky, error: whiskyError } = await supabase
        .from('whiskies')
        .select('*')
        .eq('id', whisky_id)
        .single()

      if (whiskyError || !whisky) {
        return new Response(
          JSON.stringify({ error: 'Whisky not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const results = []

      // Her dil için çeviri işi oluştur
      for (const targetLang of target_languages) {
        // Mevcut çeviri var mı kontrol et
        const { data: existing } = await supabase
          .from('whisky_translations')
          .select('id')
          .eq('whisky_id', whisky_id)
          .eq('language_code', targetLang)
          .single()

        if (existing) {
          results.push({
            language: targetLang,
            status: 'exists',
            message: 'Translation already exists'
          })
          continue
        }

        // Çeviri işi oluştur
        const { data: job, error: jobError } = await supabase
          .from('translation_jobs')
          .insert({
            whisky_id,
            target_language: targetLang,
            source_language: 'tr',
            source_text: {
              name: whisky.name,
              type: whisky.type,
              description: whisky.description,
              aroma: whisky.aroma,
              taste: whisky.taste,
              finish: whisky.finish,
              color: whisky.color
            },
            priority,
            status: 'pending'
          })
          .select()
          .single()

        if (jobError) {
          console.error('Job creation error:', jobError)
          results.push({
            language: targetLang,
            status: 'error',
            message: jobError.message
          })
          continue
        }

        // N8N webhook'unu tetikle
        try {
          const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              job_id: job.id,
              whisky_id,
              target_language: targetLang,
              source_language: 'tr',
              source_text: job.source_text,
              supabase_url: supabaseUrl,
              supabase_key: supabaseKey,
              webhook_callback_url: `${supabaseUrl}/functions/v1/translation-callback`
            })
          })

          if (n8nResponse.ok) {
            // İş durumunu processing olarak güncelle
            await supabase
              .from('translation_jobs')
              .update({ 
                status: 'processing',
                n8n_execution_id: await n8nResponse.text() 
              })
              .eq('id', job.id)

            results.push({
              language: targetLang,
              status: 'triggered',
              job_id: job.id,
              message: 'Translation job sent to N8N'
            })
          } else {
            throw new Error(`N8N webhook failed: ${n8nResponse.status}`)
          }
        } catch (n8nError) {
          console.error('N8N trigger error:', n8nError)
          
          // İş durumunu failed olarak güncelle
          await supabase
            .from('translation_jobs')
            .update({ 
              status: 'failed',
              error_message: n8nError.message 
            })
            .eq('id', job.id)

          results.push({
            language: targetLang,
            status: 'failed',
            job_id: job.id,
            message: `N8N trigger failed: ${n8nError.message}`
          })
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          whisky_id,
          results
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // GET: Çeviri işlerinin durumunu kontrol et
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const whiskyId = url.searchParams.get('whisky_id')

      if (!whiskyId) {
        return new Response(
          JSON.stringify({ error: 'whisky_id parameter required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Çeviri işlerini getir
      const { data: jobs, error: jobsError } = await supabase
        .from('translation_jobs')
        .select('*')
        .eq('whisky_id', parseInt(whiskyId))
        .order('created_at', { ascending: false })

      if (jobsError) {
        return new Response(
          JSON.stringify({ error: jobsError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Mevcut çevirileri getir
      const { data: translations, error: translationsError } = await supabase
        .from('whisky_translations')
        .select('language_code, name, is_complete, translated_by, translation_quality')
        .eq('whisky_id', parseInt(whiskyId))

      if (translationsError) {
        return new Response(
          JSON.stringify({ error: translationsError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({
          whisky_id: parseInt(whiskyId),
          jobs,
          translations
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
