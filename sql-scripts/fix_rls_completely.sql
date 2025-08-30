-- Complete RLS fix for all tables

-- 1. Profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Allow full access to own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admins full access" ON profiles;

-- Simple non-recursive policies for profiles
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Whiskies table - allow read access to all
ALTER TABLE whiskies DISABLE ROW LEVEL SECURITY;
ALTER TABLE whiskies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view whiskies" ON whiskies;
DROP POLICY IF EXISTS "Anyone can insert whiskies" ON whiskies;
DROP POLICY IF EXISTS "Authenticated users can create whiskies" ON whiskies;
DROP POLICY IF EXISTS "Users can update own whiskies" ON whiskies;
DROP POLICY IF EXISTS "Admins can update all whiskies" ON whiskies;
DROP POLICY IF EXISTS "Users can delete own whiskies" ON whiskies;
DROP POLICY IF EXISTS "Admins can delete all whiskies" ON whiskies;

-- Simple policies for whiskies
CREATE POLICY "whiskies_select_all" ON whiskies FOR SELECT TO public USING (true);
CREATE POLICY "whiskies_insert_auth" ON whiskies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "whiskies_update_auth" ON whiskies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "whiskies_delete_auth" ON whiskies FOR DELETE TO authenticated USING (true);

-- 3. User_whiskies table
ALTER TABLE user_whiskies DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_whiskies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own whiskies" ON user_whiskies;
DROP POLICY IF EXISTS "Users can insert their own whiskies" ON user_whiskies;
DROP POLICY IF EXISTS "Users can update their own whiskies" ON user_whiskies;
DROP POLICY IF EXISTS "Users can delete their own whiskies" ON user_whiskies;

-- Simple policies for user_whiskies
CREATE POLICY "user_whiskies_select_own" ON user_whiskies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_whiskies_insert_own" ON user_whiskies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_whiskies_update_own" ON user_whiskies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_whiskies_delete_own" ON user_whiskies FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT ALL ON whiskies TO authenticated;
GRANT SELECT ON whiskies TO anon;
GRANT ALL ON user_whiskies TO authenticated;

-- Show final policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'whiskies', 'user_whiskies')
ORDER BY tablename, policyname;