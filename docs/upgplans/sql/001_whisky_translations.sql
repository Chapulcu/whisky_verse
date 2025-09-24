-- Migration: create multilingual translations for whiskies
-- Safe to run multiple times (IF NOT EXISTS used where possible)

-- Base table assumed to exist: public.whiskies
-- language-agnostic fields live in public.whiskies

CREATE TABLE IF NOT EXISTS public.whisky_translations (
  whisky_id BIGINT REFERENCES public.whiskies(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('tr','en','ru')),
  source_language_code TEXT NOT NULL CHECK (source_language_code IN ('tr','en','ru')),

  -- Localized text fields
  name TEXT NOT NULL,
  description TEXT NULL,
  aroma TEXT NULL,
  taste TEXT NULL,
  finish TEXT NULL,
  color TEXT NULL,
  region TEXT NULL,
  type TEXT NULL,

  translation_status TEXT NOT NULL CHECK (translation_status IN ('human','machine','pending','failed')),
  quality_score NUMERIC NULL,
  updated_by UUID NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (whisky_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_whisky_translations_lang
  ON public.whisky_translations(language_code);

-- Optional helper view to simplify reads (prefers current language, then EN, then TR)
-- Replace :lang with a bind variable in app code; view shown here as documentation.
-- CREATE VIEW public.whiskies_localized AS
-- SELECT w.*, t.name, t.description, t.aroma, t.taste, t.finish, t.color, t.region, t.type, t.language_code
-- FROM public.whiskies w
-- JOIN public.whisky_translations t ON t.whisky_id = w.id;
