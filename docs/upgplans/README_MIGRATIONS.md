# Migration & Operations Guide

## Order of SQL scripts

1. `docs/upgplans/sql/001_whisky_translations.sql`
2. (If needed) Align existing live table with ALTERs from troubleshooting steps (add missing columns)
3. `docs/upgplans/sql/002_backfill_whisky_translations.sql`
4. `docs/upgplans/sql/003_translation_jobs.sql`
5. (Optional) `docs/upgplans/sql/004_rls_policies.sql` if you enable RLS

## Notes

- 001 creates `public.whisky_translations` for multilingual fields.
- 002 backfills current `public.whiskies` string columns into TR (`language_code='tr'`) rows in `whisky_translations`.
- 003 creates `public.translation_jobs` queue for Edge Functions.
- 004 enables example RLS policies — adjust to your security model.

## Troubleshooting schema drift

If the live `public.whisky_translations` was created before and lacks some columns, run the provided ALTER blocks (in chat) to add:
- `source_language_code`
- localized fields (`name, description, aroma, taste, finish, color, region, type`)
- `translation_status`, `updated_by`, `updated_at`

Then re-run `002_backfill_whisky_translations.sql`.

## Verifying columns

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'whisky_translations'
ORDER BY column_name;
```

## Next

- Implement/Deploy Edge Functions for translation (`docs/upgplans/edge/translation-pipeline.md`).
- Hook is ready: `useWhiskiesMultilingual` is integrated into `src/pages/WhiskiesPage.tsx`.
- App will gracefully use base table until translations are populated.
