-- ================================================
-- FINAL RLS DISABLE FOR EXISTING TABLES
-- ================================================
-- Copy this SQL and run in Supabase Dashboard > SQL Editor

-- Disable RLS for main tables only (storage excluded due to permissions)
ALTER TABLE "whiskies" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "site_background_settings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "group_members" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "event_participants" DISABLE ROW LEVEL SECURITY;

-- Verify which tables have RLS disabled
SELECT table_name, row_security
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('whiskies', 'profiles', 'site_background_settings', 'group_members', 'event_participants');