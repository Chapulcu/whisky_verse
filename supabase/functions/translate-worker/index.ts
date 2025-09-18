// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: translate-worker (Scheduled or manual trigger)
// Processes pending jobs from translation_jobs, translates, and upserts into whisky_translations

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTranslatorFromEnv, translateFields } from "../_shared/translator.ts";

import type { AppLanguage } from "../_shared/translator.ts";

function jsonResponse(body: any, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  })
}

serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  const batchSize = Number(Deno.env.get('TRANSLATION_BATCH_SIZE') || 10)
  const retryLimit = Number(Deno.env.get('TRANSLATION_RETRY_LIMIT') || 3)

  // Pick translator provider based on env (google | mock)
  const translator = getTranslatorFromEnv()

  // Fetch a batch of pending jobs
  const { data: jobs, error: jobsErr } = await supabase
    .from('translation_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('id', { ascending: true })
    .limit(batchSize)

  if (jobsErr) {
    return jsonResponse({ error: jobsErr.message }, { status: 500 })
  }

  if (!jobs || jobs.length === 0) {
    return jsonResponse({ ok: true, processed: 0 })
  }

  let processed = 0

  for (const job of jobs) {
    const { id, whisky_id, source_language, target_language, fields } = job as {
      id: number
      whisky_id: number
      source_language: AppLanguage
      target_language: AppLanguage
      fields: Record<string, string | null>
    }

    // Mark processing
    await supabase
      .from('translation_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', id)

    try {
      const translated = await translateFields(fields, source_language, target_language, translator)

      // Upsert into whisky_translations
      const upsertRow: any = {
        whisky_id,
        language_code: target_language,
        source_language_code: source_language,
        translation_status: 'machine',
        updated_at: new Date().toISOString(),
        ...translated,
      }

      const { error: upErr } = await supabase
        .from('whisky_translations')
        .upsert(upsertRow, { onConflict: 'whisky_id,language_code' })

      if (upErr) throw upErr

      await supabase
        .from('translation_jobs')
        .update({ status: 'done', updated_at: new Date().toISOString() })
        .eq('id', id)

      processed++
    } catch (e: any) {
      const attempts = (job.attempts || 0) + 1
      const status = attempts >= retryLimit ? 'failed' : 'pending'

      await supabase
        .from('translation_jobs')
        .update({
          status,
          attempts,
          last_error: String(e?.message || e),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    }
  }

  return jsonResponse({ ok: true, processed })
})
