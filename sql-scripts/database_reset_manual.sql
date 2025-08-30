-- WHISKY COMMUNITY DATABASE RESET SCRIPT
-- Execute this in Supabase SQL Editor if you need to manually reset the database

-- ==================================================
-- STEP 1: Drop existing tables (if they exist)
-- ==================================================
DROP TABLE IF EXISTS user_whiskies CASCADE;
DROP TABLE IF EXISTS whiskies CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ==================================================
-- STEP 2: Create profiles table
-- ==================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'vip', 'admin')),
    language TEXT DEFAULT 'tr' CHECK (language IN ('tr', 'en')),
    bio TEXT,
    location TEXT,
    website TEXT,
    phone TEXT,
    birth_date DATE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- STEP 3: Create whiskies table (with 1-100 rating scale)
-- ==================================================
CREATE TABLE whiskies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    alcohol_percentage DECIMAL(4,2) NOT NULL,
    rating DECIMAL(5,1) CHECK (rating >= 1.0 AND rating <= 100.0),
    age_years INTEGER CHECK (age_years > 0 AND age_years <= 100),
    color VARCHAR(100),
    aroma TEXT,
    taste TEXT,
    finish TEXT,
    description TEXT,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- STEP 4: Create user_whiskies table (user collections)
-- ==================================================
CREATE TABLE user_whiskies (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    whisky_id INTEGER REFERENCES whiskies(id) ON DELETE CASCADE NOT NULL,
    tasted BOOLEAN DEFAULT FALSE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    personal_notes TEXT,
    tasted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, whisky_id)
);

-- ==================================================
-- STEP 5: Add indexes for performance
-- ==================================================
CREATE INDEX idx_whiskies_rating ON whiskies(rating) WHERE rating IS NOT NULL;
CREATE INDEX idx_whiskies_age ON whiskies(age_years) WHERE age_years IS NOT NULL;
CREATE INDEX idx_whiskies_type ON whiskies(type);
CREATE INDEX idx_whiskies_country ON whiskies(country);
CREATE INDEX idx_whiskies_created_by ON whiskies(created_by);
CREATE INDEX idx_user_whiskies_user_id ON user_whiskies(user_id);
CREATE INDEX idx_user_whiskies_whisky_id ON user_whiskies(whisky_id);
CREATE INDEX idx_user_whiskies_tasted ON user_whiskies(tasted);

-- ==================================================
-- STEP 6: Add column comments
-- ==================================================
COMMENT ON COLUMN whiskies.rating IS 'Overall whisky rating on a scale of 1.0 to 100.0';
COMMENT ON COLUMN whiskies.age_years IS 'Age of the whisky in years, null for NAS (No Age Statement) whiskies';
COMMENT ON COLUMN user_whiskies.rating IS 'Personal user rating on a scale of 1 to 5 stars';

-- ==================================================
-- STEP 7: Enable Row Level Security
-- ==================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiskies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_whiskies ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- STEP 8: Create RLS Policies for profiles
-- ==================================================
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ==================================================
-- STEP 9: Create RLS Policies for whiskies
-- ==================================================
CREATE POLICY "Anyone can view whiskies" ON whiskies
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create whiskies" ON whiskies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own whiskies" ON whiskies
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Admins can update all whiskies" ON whiskies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can delete own whiskies" ON whiskies
    FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Admins can delete all whiskies" ON whiskies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ==================================================
-- STEP 10: Create RLS Policies for user_whiskies
-- ==================================================
CREATE POLICY "Users can view own collection" ON user_whiskies
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own collection" ON user_whiskies
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all collections" ON user_whiskies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ==================================================
-- STEP 11: Create update timestamp function and triggers
-- ==================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_whiskies_updated_at 
    BEFORE UPDATE ON whiskies 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_whiskies_updated_at 
    BEFORE UPDATE ON user_whiskies 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- ==================================================
-- DATABASE RESET COMPLETE!
-- ==================================================
-- Your database now includes:
-- 1. profiles table with user information
-- 2. whiskies table with 1-100 rating scale and age support
-- 3. user_whiskies table for user collections with 1-5 star personal ratings
-- 4. All necessary indexes, constraints, and RLS policies
-- 5. Automatic timestamp updates
-- ==================================================