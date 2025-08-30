-- ========================================
-- CLEAN USER SYSTEM RESET 
-- ========================================
-- This script resets ONLY user/auth system
-- Keeps ALL whiskies and storage images intact

-- 1. BACKUP WHISKY DATA (just to be safe)
CREATE TABLE IF NOT EXISTS whiskies_backup_before_user_reset AS 
SELECT * FROM whiskies;

-- 2. CLEAN USER SYSTEM

-- Drop user-related tables (keeps whiskies intact)
DROP TABLE IF EXISTS user_whiskies CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Clean auth.users (this removes all users but keeps whiskies)
-- WARNING: This will log out all users
DELETE FROM auth.users;

-- 3. RECREATE CLEAN USER SYSTEM

-- Recreate profiles table with clean structure
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('user', 'vip', 'admin')) DEFAULT 'user',
    language TEXT CHECK (language IN ('tr', 'en')) DEFAULT 'tr',
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    phone TEXT,
    birth_date DATE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate user_whiskies table
CREATE TABLE user_whiskies (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    whisky_id BIGINT REFERENCES whiskies(id) ON DELETE CASCADE NOT NULL,
    tasted BOOLEAN DEFAULT FALSE,
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    personal_notes TEXT,
    tasted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, whisky_id)
);

-- 4. SIMPLE RLS POLICIES (No infinite recursion)

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.uid() = id);

-- User whiskies RLS  
ALTER TABLE user_whiskies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_whiskies_select" ON user_whiskies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_whiskies_insert" ON user_whiskies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_whiskies_update" ON user_whiskies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_whiskies_delete" ON user_whiskies FOR DELETE USING (auth.uid() = user_id);

-- 5. GRANTS
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON user_whiskies TO authenticated;
GRANT SELECT ON profiles TO anon;

-- 6. TRIGGER FOR PROFILE AUTO-CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    CASE 
      WHEN NEW.email = 'admin@whiskyverse.com' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. VERIFICATION
SELECT 'User system reset complete!' as status;
SELECT COUNT(*) as whisky_count FROM whiskies;
SELECT COUNT(*) as profile_count FROM profiles;
SELECT COUNT(*) as user_whisky_count FROM user_whiskies;

-- Show existing storage buckets (should be intact)
SELECT name, created_at FROM storage.buckets WHERE name LIKE '%whisky%' OR name LIKE '%avatar%';