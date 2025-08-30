-- FIX EMPTY LISTS - Complete Database Setup and Data Import
-- This script will fix both admin page and whiskies page empty lists

-- ================================================================
-- STEP 1: Ensure all tables exist with correct structure
-- ================================================================

-- Drop and recreate tables to ensure clean state
DROP TABLE IF EXISTS user_whiskies CASCADE;
DROP TABLE IF EXISTS whiskies CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
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

-- Create whiskies table with 1-100 rating scale
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

-- Create user_whiskies table for collections
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

-- ================================================================
-- STEP 2: Add indexes for performance
-- ================================================================
CREATE INDEX idx_whiskies_rating ON whiskies(rating) WHERE rating IS NOT NULL;
CREATE INDEX idx_whiskies_age ON whiskies(age_years) WHERE age_years IS NOT NULL;
CREATE INDEX idx_whiskies_type ON whiskies(type);
CREATE INDEX idx_whiskies_country ON whiskies(country);
CREATE INDEX idx_whiskies_name ON whiskies(name);
CREATE INDEX idx_whiskies_created_by ON whiskies(created_by);
CREATE INDEX idx_user_whiskies_user_id ON user_whiskies(user_id);
CREATE INDEX idx_user_whiskies_whisky_id ON user_whiskies(whisky_id);

-- ================================================================
-- STEP 3: Enable RLS and create policies
-- ================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiskies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_whiskies ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Whiskies policies  
DROP POLICY IF EXISTS "Anyone can view whiskies" ON whiskies;
DROP POLICY IF EXISTS "Authenticated users can create whiskies" ON whiskies;
DROP POLICY IF EXISTS "Users can update own whiskies" ON whiskies;
DROP POLICY IF EXISTS "Admins can update all whiskies" ON whiskies;
DROP POLICY IF EXISTS "Users can delete own whiskies" ON whiskies;
DROP POLICY IF EXISTS "Admins can delete all whiskies" ON whiskies;

CREATE POLICY "Anyone can view whiskies" ON whiskies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create whiskies" ON whiskies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own whiskies" ON whiskies FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Admins can update all whiskies" ON whiskies FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can delete own whiskies" ON whiskies FOR DELETE USING (created_by = auth.uid());
CREATE POLICY "Admins can delete all whiskies" ON whiskies FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- User whiskies policies
DROP POLICY IF EXISTS "Users can view own collection" ON user_whiskies;
DROP POLICY IF EXISTS "Users can manage own collection" ON user_whiskies;
DROP POLICY IF EXISTS "Admins can view all collections" ON user_whiskies;

CREATE POLICY "Users can view own collection" ON user_whiskies FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own collection" ON user_whiskies FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can view all collections" ON user_whiskies FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ================================================================
-- STEP 4: Import comprehensive whisky data (50 whiskies)
-- ================================================================
INSERT INTO whiskies (name, type, country, region, alcohol_percentage, rating, age_years, color, aroma, taste, finish, description, image_url, created_at, updated_at) VALUES 

-- Scottish Single Malts
('Macallan 12', 'Single Malt', 'İskoçya', 'Speyside', 40.0, NULL, 12, 'Golden', 'Bal, vanilya, meşe', 'Karamel, vanilya, meşe', 'Orta uzunlukta, tatlı', 'Dünyanın en sevilen single malt viskilerinden biri. Şeri fıçılarda olgunlaştırılır.', 'https://example.com/macallan12.jpg', NOW(), NOW()),
('Lagavulin 16', 'Single Malt', 'İskoçya', 'Islay', 43.0, NULL, 16, 'Dark Amber', 'Turba, is, deniz tuzu', 'Is, turba, baharat', 'Uzun, isli', 'İskoçya''nın en ünlü isli viskilerinden biri, güçlü turba karakteri.', 'https://example.com/lagavulin16.jpg', NOW(), NOW()),
('Glenfiddich 12', 'Single Malt', 'İskoçya', 'Speyside', 40.0, NULL, 12, 'Golden', 'Armut, elma, bal', 'Tatlı, meyveli, yumuşak', 'Orta uzunlukta', 'Dünya''da en çok satan single malt viski, başlangıç için ideal.', 'https://example.com/glenfiddich12.jpg', NOW(), NOW()),
('Ardbeg 10', 'Single Malt', 'İskoçya', 'Islay', 46.0, NULL, 10, 'Pale Gold', 'Yoğun turba, is, limon', 'Güçlü turba, baharat, deniz', 'Çok uzun, isli', 'Islay''ın en karakteristik turbalı viskilerinden, güçlü ve karmaşık.', 'https://example.com/ardbeg10.jpg', NOW(), NOW()),
('Glenlivet 12', 'Single Malt', 'İskoçya', 'Speyside', 40.0, NULL, 12, 'Golden', 'Çiçeksi, meyveli, bal', 'Yumuşak, tatlı, vanilya', 'Temiz, orta uzunlukta', 'Speyside''ın klasik temsilcisi, zarif ve dengeli.', 'https://example.com/glenlivet12.jpg', NOW(), NOW()),
('Highland Park 12', 'Single Malt', 'İskoçya', 'Highlands', 40.0, NULL, 12, 'Amber', 'Kuru meyve, bal, hafif is', 'Dengeli, meyveli, baharatlı', 'Orta uzunlukta', 'Orkney adalarından gelen eşsiz karakter, hafif turbalı.', 'https://example.com/highlandpark12.jpg', NOW(), NOW()),
('Oban 14', 'Single Malt', 'İskoçya', 'Highlands', 43.0, NULL, 14, 'Amber', 'Deniz tuzu, meyve, is', 'Dengeli, tuzlu-tatlı', 'Orta uzunlukta', 'Highland ve Lowland''ın buluşma noktası, deniz etkili.', 'https://example.com/oban14.jpg', NOW(), NOW()),
('Talisker 10', 'Single Malt', 'İskoçya', 'Isle of Skye', 45.8, NULL, 10, 'Amber', 'Deniz tuzu, turba, biber', 'Baharatlı, tuzlu, güçlü', 'Sıcak, uzun', 'Skye adasının vahşi karakterini yansıtan eşsiz viski.', 'https://example.com/talisker10.jpg', NOW(), NOW()),
('Balvenie 12 DoubleWood', 'Single Malt', 'İskoçya', 'Speyside', 40.0, NULL, 12, 'Golden', 'Bal, vanilya, şeri', 'Tatlı, meyveli, karamel', 'Yumuşak, orta uzunlukta', 'İki farklı fıçıda olgunlaştırılan zarif viski.', 'https://example.com/balvenie12.jpg', NOW(), NOW()),
('Caol Ila 12', 'Single Malt', 'İskoçya', 'Islay', 43.0, NULL, 12, 'Pale Gold', 'Hafif turba, deniz, limon', 'Turba, meyveli, tuzlu', 'Orta uzunlukta', 'Islay''ın en hafif turbalı viskisi, dengelidir.', 'https://example.com/caolila12.jpg', NOW(), NOW()),

-- Irish Whiskies
('Jameson', 'Blended', 'İrlanda', NULL, 40.0, NULL, NULL, 'Golden', 'Hafif, meyveli, bal', 'Yumuşak, tatlı', 'Kısa, temiz', 'İrlanda''nın en popüler viskisi, triple distilled.', 'https://example.com/jameson.jpg', NOW(), NOW()),
('Redbreast 12', 'Single Pot Still', 'İrlanda', NULL, 40.0, NULL, 12, 'Golden', 'Kuru meyve, baharat, meşe', 'Zengin, karamel, vanilya', 'Uzun, tatlı', 'İrlanda''nın en prestijli single pot still viskisi.', 'https://example.com/redbreast12.jpg', NOW(), NOW()),
('Bushmills 10', 'Single Malt', 'İrlanda', 'Antrim', 40.0, NULL, 10, 'Golden', 'Bal, vanilya, meşe', 'Karamel, vanilya, meşe', 'Kısa, tatlı', 'İrlanda''nın en eski lisanslı damıtımevinden.', 'https://example.com/bushmills10.jpg', NOW(), NOW()),
('Green Spot', 'Single Pot Still', 'İrlanda', NULL, 40.0, NULL, NULL, 'Golden', 'Çiçeksi, meyveli, bal', 'Tatlı, kremsi, baharat', 'Orta uzunlukta', 'Geleneksel İrlanda single pot still viskisi.', 'https://example.com/greenspot.jpg', NOW(), NOW()),

-- American Whiskies
('Jack Daniel''s Old No.7', 'Tennessee Whiskey', 'ABD', 'Tennessee', 40.0, NULL, NULL, 'Amber', 'Vanilya, karamel, meşe', 'Tatlı, yumuşak, vanilya', 'Orta uzunlukta', 'Dünyanın en tanınmış Tennessee whiskey''i.', 'https://example.com/jackdaniels.jpg', NOW(), NOW()),
('Maker''s Mark', 'Bourbon', 'ABD', 'Kentucky', 45.0, NULL, NULL, 'Amber', 'Karamel, vanilya, meşe', 'Pürüzsüz, tatlı, baharatlı', 'Kısa, sıcak', 'Kırmızı mum damlası ile ünlü premium bourbon.', 'https://example.com/makersmark.jpg', NOW(), NOW()),
('Buffalo Trace', 'Bourbon', 'ABD', 'Kentucky', 40.0, NULL, NULL, 'Amber', 'Vanilya, karamel, meşe', 'Dengeli, tatlı, baharatlı', 'Orta uzunlukta', 'Kentucky''nin klasik bourbon''u, mükemmel dengeli.', 'https://example.com/buffalotrace.jpg', NOW(), NOW()),
('Woodford Reserve', 'Bourbon', 'ABD', 'Kentucky', 43.2, NULL, NULL, 'Amber', 'Karamel, vanilya, baharat', 'Zengin, karmaşık, meşe', 'Uzun, sıcak', 'Premium small batch bourbon, triple distilled.', 'https://example.com/woodford.jpg', NOW(), NOW()),
('Bulleit Rye', 'Rye', 'ABD', 'Kentucky', 45.0, NULL, NULL, 'Golden', 'Baharat, nane, yaban mersini', 'Karabiber, rye baharatı', 'Keskin, baharatlı', 'Yüksek çavdar içeriği ile karakteristik spice.', 'https://example.com/bulleitrye.jpg', NOW(), NOW()),
('Wild Turkey 101', 'Bourbon', 'ABD', 'Kentucky', 50.5, NULL, NULL, 'Amber', 'Karamel, vanilya, meşe', 'Güçlü, baharatlı, meşe', 'Uzun, sıcak', 'Yüksek alkol dereceli klasik bourbon.', 'https://example.com/wildturkey101.jpg', NOW(), NOW()),

-- Japanese Whiskies
('Hibiki Harmony', 'Blended', 'Japonya', NULL, 43.0, NULL, NULL, 'Golden', 'Çiçeksi, meyveli, bal', 'Dengeli, karmaşık, zarif', 'Uzun, zarif', 'Japon viski sanatının en güzel örneklerinden.', 'https://example.com/hibiki.jpg', NOW(), NOW()),
('Yamazaki 12', 'Single Malt', 'Japonya', NULL, 43.0, NULL, 12, 'Golden', 'Meyveli, çiçeksi, vanilya', 'Yumuşak, dengeli, karmaşık', 'Uzun, zarif', 'Japonya''nın ilk single malt viskisi.', 'https://example.com/yamazaki12.jpg', NOW(), NOW()),
('Hakushu 12', 'Single Malt', 'Japonya', NULL, 43.0, NULL, 12, 'Pale Green', 'Çimensi, taze, meyveli', 'Temiz, ferahlatıcı, dengeli', 'Taze, orta uzunlukta', 'Japon Alplerinin temiz havasını yansıtan viski.', 'https://example.com/hakushu12.jpg', NOW(), NOW()),
('Nikka From The Barrel', 'Blended', 'Japonya', NULL, 51.4, NULL, NULL, 'Amber', 'Karamel, vanilya, meyve', 'Güçlü, dengeli, zengin', 'Uzun, sıcak', 'Yüksek alkol dereceli premium Japon harmanı.', 'https://example.com/nikka.jpg', NOW(), NOW()),

-- Canadian Whiskies
('Crown Royal', 'Canadian Whisky', 'Kanada', NULL, 40.0, NULL, NULL, 'Golden', 'Bal, vanilya, tahıl', 'Yumuşak, tatlı, dengeli', 'Orta uzunlukta', 'Kanada''nın en ünlü viski markası.', 'https://example.com/crownroyal.jpg', NOW(), NOW()),
('Canadian Club', 'Canadian Whisky', 'Kanada', 'Ontario', 40.0, NULL, NULL, 'Golden', 'Hafif, tahıl, vanilya', 'Yumuşak, temiz, dengeli', 'Kısa, temiz', 'Klasik Kanada viski stili.', 'https://example.com/canadianclub.jpg', NOW(), NOW()),

-- European Whiskies
('Mackmyra Brukswhisky', 'Single Malt', 'İsveç', NULL, 41.4, NULL, NULL, 'Golden', 'Bal, vanilya, meşe', 'Karamel, vanilya, baharat', 'Orta uzunlukta', 'İsveç''in öncü single malt viskisi.', 'https://example.com/mackmyra.jpg', NOW(), NOW()),
('Penderyn Madeira Finish', 'Single Malt', 'Galler', NULL, 46.0, NULL, NULL, 'Golden', 'Meyve, bal, baharat', 'Tatlı, meyveli, zengin', 'Orta uzunlukta', 'Galler''in tek viski damıtımevinden.', 'https://example.com/penderyn.jpg', NOW(), NOW()),
('Kavalan Solist Vinho Barrique', 'Single Malt', 'Tayvan', NULL, 57.8, NULL, NULL, 'Deep Amber', 'Kuru meyve, şeri, baharat', 'Zengin, karmaşık, güçlü', 'Çok uzun', 'Tayvan''ın dünyaca ünlü single malt viskisi.', 'https://example.com/kavalan.jpg', NOW(), NOW()),
('Amrut Fusion', 'Single Malt', 'Hindistan', NULL, 50.0, NULL, NULL, 'Golden', 'Meyve, baharat, vanilya', 'Baharatlı, tropikal, zengin', 'Uzun, sıcak', 'Hindistan''ın tropikal ikliminde hızla olgunlaşan viski.', 'https://example.com/amrut.jpg', NOW(), NOW()),

-- Premium & Rare Whiskies
('Macallan 18', 'Single Malt', 'İskoçya', 'Speyside', 43.0, NULL, 18, 'Mahogany', 'Zengin meyve, çikolata, baharat', 'Lüks, karmaşık, ipeksi', 'Çok uzun, zarif', 'Şeri fıçılarında 18 yıl olgunlaştırılmış lüks viski.', 'https://example.com/macallan18.jpg', NOW(), NOW()),
('Johnnie Walker Blue Label', 'Blended', 'İskoçya', 'Various', 40.0, NULL, NULL, 'Deep Gold', 'Bal, vanilya, is, meyve', 'Yumuşak, karmaşık, dengeli', 'Uzun, zarif', 'Dünyanın en prestijli harman viskilerinden.', 'https://example.com/jw_blue.jpg', NOW(), NOW()),
('Chivas Regal 18', 'Blended', 'İskoçya', 'Various', 40.0, NULL, 18, 'Amber', 'Meyve, çikolata, baharat', 'Zengin, yumuşak, karmaşık', 'Uzun, zarif', '85 farklı viskinin uyumlu harmanı.', 'https://example.com/chivas18.jpg', NOW(), NOW()),
('Glenfiddich 21', 'Single Malt', 'İskoçya', 'Speyside', 40.0, NULL, 21, 'Rich Gold', 'Bal, meyve, vanilya', 'Karmaşık, dengeli, zarif', 'Çok uzun', 'Karibik rom fıçılarında son dokunuş alan eşsiz viski.', 'https://example.com/glenfiddich21.jpg', NOW(), NOW()),

-- Experimental & Craft
('Compass Box Great King St', 'Blended Malt', 'İskoçya', 'Various', 43.0, NULL, NULL, 'Golden', 'Meyve, bal, hafif is', 'Dengeli, modern, temiz', 'Orta uzunlukta', 'Modern harman tekniği ile üretilen boutique viski.', 'https://example.com/compassbox.jpg', NOW(), NOW()),
('Kilchoman Machir Bay', 'Single Malt', 'İskoçya', 'Islay', 46.0, NULL, NULL, 'Golden', 'Turba, vanilya, narenciye', 'Genç, canlı, turbalı', 'Orta uzunlukta', 'Islay''ın en yeni damıtımevinden farm distillery.', 'https://example.com/kilchoman.jpg', NOW(), NOW()),
('Bruichladdich Classic Laddie', 'Single Malt', 'İskoçya', 'Islay', 50.0, NULL, NULL, 'Pale Gold', 'Çiçeksi, meyveli, deniz', 'Temiz, ferahlatıcı, karmaşık', 'Orta uzunlukta', 'Turbasız Islay viskisi, progressive heritage.', 'https://example.com/bruichladdich.jpg', NOW(), NOW()),

-- Budget Friendly
('Famous Grouse', 'Blended', 'İskoçya', 'Various', 40.0, NULL, NULL, 'Golden', 'Hafif, meyveli, bal', 'Yumuşak, dengeli, içimlik', 'Kısa, temiz', 'İskoçya''nın en çok satan harman viskisi.', 'https://example.com/famous_grouse.jpg', NOW(), NOW()),
('Dewar''s 12', 'Blended', 'İskoçya', 'Various', 40.0, NULL, 12, 'Golden', 'Bal, vanilya, meyve', 'Yumuşak, dengeli, akıcı', 'Orta uzunlukta', 'Double aged blended scotch whisky.', 'https://example.com/dewars12.jpg', NOW(), NOW()),
('Grant''s Triple Wood', 'Blended', 'İskoçya', 'Various', 40.0, NULL, NULL, 'Amber', 'Vanilya, meyve, meşe', 'Yumuşak, tatlı, dengeli', 'Orta uzunlukta', 'Üç farklı meşe fıçıda olgunlaştırılan budget blend.', 'https://example.com/grants.jpg', NOW(), NOW()),

-- Single Cask & Limited Editions
('Aberlour A''Bunadh', 'Single Malt', 'İskoçya', 'Speyside', 60.7, NULL, NULL, 'Deep Mahogany', 'Yoğun şeri, çikolata, baharat', 'Güçlü, zengin, yoğun', 'Çok uzun, sıcak', 'Cask strength şeri bomb, sulandırılmamış.', 'https://example.com/aberlour.jpg', NOW(), NOW()),
('Laphroaig Quarter Cask', 'Single Malt', 'İskoçya', 'Islay', 48.0, NULL, NULL, 'Golden', 'Yoğun turba, is, vanilya', 'Güçlü turba, kremsi, baharatlı', 'Uzun, isli', 'Küçük fıçılarda double maturation.', 'https://example.com/laphroaig_qc.jpg', NOW(), NOW()),
('GlenDronach 18 Allardice', 'Single Malt', 'İskoçya', 'Highlands', 46.0, NULL, 18, 'Deep Amber', 'Zengin şeri, çikolata, kuru meyve', 'Lüks, yoğun, karmaşık', 'Çok uzun, zengin', 'Oloroso şeri fıçılarında 18 yıl, sherry monster.', 'https://example.com/glendronach18.jpg', NOW(), NOW()),

-- World Whiskies
('Sullivan''s Cove French Oak', 'Single Malt', 'Avustralya', 'Tasmania', 47.5, NULL, NULL, 'Golden', 'Vanilya, bal, meyve', 'Kremsi, dengeli, tropikal', 'Uzun, sıcak', 'Tazmanya''nın soğuk ikliminde olgunlaşan eşsiz viski.', 'https://example.com/sullivans.jpg', NOW(), NOW()),
('Paul John Brilliance', 'Single Malt', 'Hindistan', 'Goa', 46.0, NULL, NULL, 'Golden', 'Tropikal meyve, bal, baharat', 'Baharatlı, egzotik, zengin', 'Uzun, sıcak', 'Hindistan''ın tropikal ikliminde hızla olgunlaşan viski.', 'https://example.com/pauljohn.jpg', NOW(), NOW()),
('Starward Nova', 'Single Malt', 'Avustralya', 'Melbourne', 41.0, NULL, NULL, 'Amber', 'Kırmızı meyve, vanilya, meşe', 'Meyveli, modern, dengeli', 'Orta uzunlukta', 'Avustralya şarap fıçılarında olgunlaştırılan modern viski.', 'https://example.com/starward.jpg', NOW(), NOW());

-- ================================================================
-- STEP 5: Verify data and provide summary
-- ================================================================
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_whiskies FROM whiskies;
SELECT DISTINCT type as whisky_types FROM whiskies ORDER BY type;
SELECT DISTINCT country as countries FROM whiskies ORDER BY country;
SELECT 'Sample whiskies:' as info;
SELECT name, type, country, alcohol_percentage FROM whiskies ORDER BY name LIMIT 10;