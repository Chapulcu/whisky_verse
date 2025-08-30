-- TEST 1: Basic Connection Test
-- Run this first to verify your database connection

SELECT 'Database connection successful!' as test_result;

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('whiskies', 'profiles', 'user_whiskies');

-- If whiskies table exists, check count
SELECT COUNT(*) as current_whisky_count FROM whiskies;