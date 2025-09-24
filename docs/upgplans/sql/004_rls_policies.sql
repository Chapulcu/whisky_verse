-- RLS policy templates for whisky_translations and translation_jobs
-- Adjust roles and conditions per your security model.

-- Enable RLS (only if you use RLS). Comment out if not using RLS.
ALTER TABLE public.whisky_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_jobs ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users (example)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'whisky_translations' AND policyname = 'whisky_translations_select'
  ) THEN
    CREATE POLICY whisky_translations_select ON public.whisky_translations
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Allow updates/inserts to whisky_translations by authenticated users on rows they "own" (example)
-- Replace owner check with your real ownership model. If you keep ownership in base table, you can join via function.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'whisky_translations' AND policyname = 'whisky_translations_modify_owned'
  ) THEN
    CREATE POLICY whisky_translations_modify_owned ON public.whisky_translations
      FOR INSERT WITH CHECK (true)
      TO authenticated;
    CREATE POLICY whisky_translations_update_owned ON public.whisky_translations
      FOR UPDATE USING (true) WITH CHECK (true)
      TO authenticated;
  END IF;
END $$;

-- translation_jobs: Typically only service role (Edge Functions) should modify; users should not see jobs.
-- Example: deny all to authenticated, allow service_role via PostgREST key (outside of RLS policies).
-- If you want authenticated users to see only their jobs, add a user_id column and write policies accordingly.

-- Optional: block SELECT for authenticated users explicitly (no policy created means denied by default when RLS is enabled).
