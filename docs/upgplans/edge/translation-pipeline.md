# Supabase Edge Function: Whisky Translation Pipeline

## Goals
- Translate whisky content from a source language (TR/EN/RU) into the other languages asynchronously.
- Keep secrets server-side; never expose translation API keys to the frontend.
- Provide retries, rate-limits, and observability.

## Components
- Edge Function `translate-whisky` (HTTP-triggered):
  - Enqueues translation jobs (whisky_id, source_language, target_languages[], fields) into a queue.
- Edge Function `translate-worker` (scheduled or polling):
  - Dequeues jobs, calls provider (e.g., Google Translate), and upserts into `public.whisky_translations` with `translation_status='machine'`.

## Environment Variables
- `TRANSLATE_PROVIDER` = `google|azure|deepl`
- Provider-specific keys:
  - `GOOGLE_PROJECT_ID`, `GOOGLE_API_KEY`
  - or `AZURE_TRANSLATOR_KEY`, `AZURE_TRANSLATOR_REGION`
  - or `DEEPL_API_KEY`
- `TRANSLATION_BATCH_SIZE` (default: 10)
- `TRANSLATION_RETRY_LIMIT` (default: 3)

## Queue Options
- Use Postgres table `translation_jobs` with status index or `pgmq` if enabled.
- Minimal schema (example):
```sql
CREATE TABLE IF NOT EXISTS public.translation_jobs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  whisky_id BIGINT NOT NULL,
  source_language TEXT NOT NULL CHECK (source_language IN ('tr','en','ru')),
  target_language TEXT NOT NULL CHECK (target_language IN ('tr','en','ru')),
  fields JSONB NOT NULL, -- e.g. {"name": "...", "description": "..."}
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_status ON public.translation_jobs(status);
```

## API Contract
- `POST /translate-whisky`
  - Body: `{ whisky_id: number, source_language: 'tr'|'en'|'ru', target_languages?: ('tr'|'en'|'ru')[], overwriteMachine?: boolean }`
  - Behavior:
    - Fetch source language row from `whisky_translations`.
    - For each `target_language` not equal to source:
      - Insert a job if missing or `overwriteMachine=true`.
- Worker process:
  - `SELECT ... FROM translation_jobs WHERE status='pending' ORDER BY id LIMIT :batch FOR UPDATE SKIP LOCKED`.
  - Mark `processing`.
  - Translate `fields` map via provider.
  - `UPSERT` into `public.whisky_translations (whisky_id, language_code, ...)` with `translation_status='machine'`.
  - Mark job `done`. On error, increment attempts; if attempts >= limit, mark `failed` with error.

## Provider Abstraction (Pseudo-code)
```ts
export interface Translator {
  translate(text: string, from: string, to: string): Promise<string>
}

export async function translateFields(fields: Record<string, string>, from: string, to: string, t: Translator) {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(fields)) {
    out[k] = v ? await t.translate(v, from, to) : v
  }
  return out
}
```

## Security & RLS
- Ensure Edge Functions use service role key to bypass RLS or add specific RLS policies that allow updates by a designated role.
- Frontend never calls providers directly.

## Observability
- Log job IDs, latency, provider response codes.
- Metrics: processed/minute, failures/minute, retry counts.

## Failure Handling
- Exponential backoff per job (`attempts` counter).
- DLQ (dead-letter) if attempts exceed threshold; manual re-queue from Admin UI.

## Integration Points
- On create/update in UI: call `POST /translate-whisky` (server-side) after writing source language row.
- Admin `TranslationManager`: button to re-translate a single language.

## Backfill Strategy
- Iterate all whiskies with only source language rows; enqueue jobs for missing languages.
- Throttle to avoid rate-limit.
