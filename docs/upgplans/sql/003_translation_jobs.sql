-- Queue table for translation jobs
-- Safe to run multiple times

CREATE TABLE IF NOT EXISTS public.translation_jobs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  whisky_id BIGINT NOT NULL REFERENCES public.whiskies(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_translation_jobs_whisky ON public.translation_jobs(whisky_id);
