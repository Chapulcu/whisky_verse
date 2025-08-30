import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranslationCallback {
  whisky_id: number
  language: string
  status: 'completed' | 'failed'
  quality?: number
  error?: string
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

    if (req.method === 'POST') {
      const { whisky_id, language, status, quality, error }: TranslationCallback = await req.json()

      console.log(`Translation callback: whisky_id=${whisky_id}, language=${language}, status=${status}`)

      if (status === 'completed') {
        // Frontend'e başarılı çeviri bildirimini gönder
        // Bu kısım WebSocket veya Server-Sent Events ile implement edilebilir
        
        // Şimdilik basit bir log
        console.log(`✅ Translation completed for whisky ${whisky_id} in ${language} (quality: ${quality})`)
        
        // İsteğe bağlı: Cache'i temizle
        // await supabase.functions.invoke('clear-cache', { 
        //   body: { whisky_id, language } 
        // })
        
      } else if (status === 'failed') {
        console.error(`❌ Translation failed for whisky ${whisky_id} in ${language}: ${error}`)
        
        // Hata durumunda yeniden deneme mantığı eklenebilir
        // veya admin bildirimi gönderilebilir
      }

      // Callback'i kaydet (isteğe bağlı)
      const { error: logError } = await supabase
        .from('translation_logs')  // Bu tablo opsiyonel
        .insert({
          whisky_id,
          language,
          status,
          quality,
          error_message: error,
          callback_received_at: new Date().toISOString()
        })

      if (logError) {
        console.warn('Failed to log translation callback:', logError.message)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Callback processed'
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
    console.error('Callback function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})