-- Backfill existing whiskies into whisky_translations as Turkish (source)
-- Assumes original text columns exist on public.whiskies for now
-- Run after 001_whisky_translations.sql

INSERT INTO public.whisky_translations (
  whisky_id,
  language_code,
  source_language_code,
  name,
  description,
  aroma,
  taste,
  finish,
  color,
  region,
  type,
  translation_status,
  updated_by
)
SELECT
  w.id,
  'tr' AS language_code,
  'tr' AS source_language_code,
  w.name,
  w.description,
  w.aroma,
  w.taste,
  w.finish,
  w.color,
  w.region,
  w.type,
  'human' AS translation_status,
  w.created_by
FROM public.whiskies w
ON CONFLICT (whisky_id, language_code) DO NOTHING;
