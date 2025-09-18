# Multilingual Whisky Content Plan (TR/EN/RU)

## Objectives
- Store whisky content once in the entered language (TR/EN/RU) and auto-translate to the other languages.
- Render content in the app’s current language with graceful fallbacks.
- Allow human moderation/override for machine translations.

## Summary Architecture
- Base table `whiskies` keeps language-agnostic fields (e.g., image, ABV, age, rating).
- New table `whisky_translations` holds all localized text fields per whisky + language.
- On create/update in a source language, enqueue translation jobs for the other languages via a serverless function (Supabase Edge Functions).
- UI reads by current i18n language; if missing, falls back to another language (e.g., EN → TR) and indicates machine vs human.

## DB Schema
```sql
-- Language and status can be PostgreSQL enums or validated text
-- Example (text + constraint for portability shown here):

-- Base (existing): language-agnostic
CREATE TABLE IF NOT EXISTS public.whiskies (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image_url TEXT,
  alcohol_percentage NUMERIC,
  rating NUMERIC,
  age_years INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NULL
);

-- Localized content
CREATE TABLE IF NOT EXISTS public.whisky_translations (
  whisky_id BIGINT REFERENCES public.whiskies(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('tr','en','ru')),
  source_language_code TEXT NOT NULL CHECK (source_language_code IN ('tr','en','ru')),

  -- localized fields
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  PRIMARY KEY (whisky_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_whisky_translations_lang
  ON public.whisky_translations(language_code);
```

### Migration Plan
- Create `whisky_translations`.
- Backfill: for each existing `whiskies` row (assume TR by default), insert `whisky_translations (whisky_id, language_code='tr', source_language_code='tr', translation_status='human', ...)` using current string columns.
- Optionally remove string columns from `whiskies` after migration (or keep temporarily for compatibility), migrating reads to use translations.

## Translation Provider & Abstraction
- Providers: Google Cloud Translate (broad support), Azure Translator (enterprise), DeepL (high quality; check RU plan support).
- Create a server-side abstraction: `translateText({ text, from, to }): { text }` with retries and rate limiting.
- Store API keys only in Edge Function env vars (never in frontend).

## Translation Pipeline (Create/Update)
- On create in source language Ls:
  1. Insert base `whiskies` row.
  2. Insert `whisky_translations` for Ls with `translation_status='human'`.
  3. Enqueue jobs for the other languages: set `translation_status='pending'`.
- On update in source language:
  1. Update Ls row with `translation_status='human'`.
  2. Enqueue refresh jobs for other languages.
- Edge Function worker:
  - Consumes queue (pg/cron-based) → translate with provider → upsert `whisky_translations` for target language with `translation_status='machine'` or `failed`.

## Data Access Layer (Hooks)
- Implement `useWhiskiesMultilingual(limit, offset, search, country, type, lang)`:
  - Server-side: select from `whiskies` with filters + pagination.
  - Join `whisky_translations` on `(whisky_id, language_code)` for `lang`.
  - Fallback: if missing, attempt `'en'`, then `'tr'` (configurable order); pick best available row.
  - Return rows + `totalCount` for proper pagination.
- Rationale: Keeps pagination on the server and ensures localized text is fetched in one query.

## UI / Admin
- Add/Edit Whisky Form:
  - “Entry language” selector defaulting to current i18n language.
  - Save only into that language’s `whisky_translations` row.
- Translation Manager:
  - View/edit TR/EN/RU versions per whisky.
  - Show badges: `machine` vs `human`; allow “Re-translate” action.

## Language Switch Behavior
- `i18next` already configured (`src/lib/i18n.ts`).
- On `languageChanged`, refetch list/detail via hook to load translations for the new language.
- Rationale: UI automatically renders localized content when user switches language.

## Background Jobs & Backfill
- One-off backfill job to populate translations for existing data.
- Nightly/periodic job to retry failed translations.
- Optional quality checks: length anomalies, profanity filters.

## Testing
- Unit: fallback resolver picks correct language; mapping from joined rows to UI model.
- Integration: hooks fetch expected language; provider errors handled.
- E2E (Cypress): language switch on `/whiskies` reflects localized name/description; admin override persists.

## Observability & Controls
- Log translation latency, provider errors, request IDs.
- Admin controls per whisky: disable auto-translation; force re-translate.

## Next Steps
1. Ship DB migration for `whisky_translations` and backfill.
2. Implement Edge Function: `/translate` + worker with provider abstraction (Google default).
3. Create `useWhiskiesMultilingual` hook that returns `{ rows, totalCount }` using current `i18n.language`.
4. Wire `WhiskiesPage` to the multilingual hook and remove client-side re-slice for pagination.
5. Extend Add/Edit forms with entry language and add `TranslationManager` moderation.
6. Add tests (unit/integration/E2E) for language switch, fallback, and moderation flows.
