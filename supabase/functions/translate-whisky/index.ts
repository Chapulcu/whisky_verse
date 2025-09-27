// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: translate-whisky (HTTP)
// Enqueue translation jobs for a whisky into translation_jobs
// Run with service role (via Supabase Edge Functions)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import type { AppLanguage } from "../_shared/translator.ts";

interface EnqueueRequest {
  whisky_id: number
  source_language: AppLanguage
  target_languages?: AppLanguage[]
  overwriteMachine?: boolean
}

function jsonResponse(body: any, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  })
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, { status: 405 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })

    const body = (await req.json()) as EnqueueRequest
    const { whisky_id, source_language, target_languages, overwriteMachine } = body

    if (!whisky_id || !source_language) {
      return jsonResponse({ error: 'whisky_id and source_language are required' }, { status: 400 })
    }

    // Fetch source translation fields
    const { data: src, error: srcErr } = await supabase
      .from('whisky_translations')
      .select('name, description, aroma, taste, finish, color, region, type')
      .eq('whisky_id', whisky_id)
      .eq('language_code', source_language)
      .maybeSingle()

    if (srcErr) {
      return jsonResponse({ error: srcErr.message }, { status: 500 })
    }

    if (!src) {
      return jsonResponse({ error: 'Source language row not found for whisky' }, { status: 404 })
    }

    const defaultTargets: AppLanguage[] = ['tr', 'en', 'ru', 'bg']
    const targets: AppLanguage[] = (target_languages && target_languages.length > 0)
      ? target_languages
      : (defaultTargets.filter(l => l !== source_language) as AppLanguage[])

    const fields = src

    // Optionally avoid duplicating machine translations unless overwriteMachine=true
    if (!overwriteMachine) {
      // For each target lang, check if human translation already exists
      const { data: existing, error: exErr } = await supabase
        .from('whisky_translations')
        .select('language_code, translation_status')
        .eq('whisky_id', whisky_id)
        .in('language_code', targets)

      if (exErr) {
        return jsonResponse({ error: exErr.message }, { status: 500 })
      }

      const skip = new Set<AppLanguage>()
      for (const row of (existing || [])) {
        if (row.translation_status === 'human') {
          skip.add(row.language_code as AppLanguage)
        }
      }

      // Filter out languages with existing human translations
      for (let i = targets.length - 1; i >= 0; i--) {
        if (skip.has(targets[i])) targets.splice(i, 1)
      }
    }

    // Enqueue jobs
    const rows = targets.map(tl => ({
      whisky_id,
      source_language,
      target_language: tl,
      fields,
      status: 'pending' as const,
    }))

    if (rows.length === 0) {
      return jsonResponse({ ok: true, message: 'No targets to enqueue' })
    }

    const { error: insErr } = await supabase.from('translation_jobs').insert(rows)
    if (insErr) {
      return jsonResponse({ error: insErr.message }, { status: 500 })
    }

    return jsonResponse({ ok: true, enqueued: rows.length })
  } catch (e: any) {
    return jsonResponse({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
})
