-- QUICK TEST DATA - Just 5 sample whiskies for testing

-- Make sure whiskies table exists
CREATE TABLE IF NOT EXISTS whiskies (
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

-- Enable RLS
ALTER TABLE whiskies ENABLE ROW LEVEL SECURITY;

-- Add basic policy
CREATE POLICY IF NOT EXISTS "Anyone can view whiskies" ON whiskies FOR SELECT USING (true);

-- Insert test data
INSERT INTO whiskies (name, type, country, region, alcohol_percentage, color, aroma, taste, finish, description) VALUES 
('Macallan 12', 'Single Malt', 'İskoçya', 'Speyside', 40.0, 'Golden', 'Bal, vanilya, meşe', 'Karamel, vanilya, meşe', 'Orta uzunlukta, tatlı', 'Klasik Speyside single malt viski'),
('Lagavulin 16', 'Single Malt', 'İskoçya', 'Islay', 43.0, 'Dark Amber', 'Turba, is, deniz tuzu', 'Is, turba, baharat', 'Uzun, isli', 'İskoçya''nın en ünlü isli viskilerinden biri'),
('Jameson', 'Blended', 'İrlanda', NULL, 40.0, 'Golden', 'Hafif, meyveli', 'Yumuşak, tatlı', 'Kısa, temiz', 'İrlanda''nın en popüler viskisi'),
('Jack Daniel''s', 'Tennessee Whiskey', 'ABD', 'Tennessee', 40.0, 'Amber', 'Vanilya, karamel', 'Tatlı, yumuşak', 'Orta uzunlukta', 'Klasik Amerika viskisi'),
('Hibiki Harmony', 'Blended', 'Japonya', NULL, 43.0, 'Golden', 'Çiçeksi, meyveli', 'Dengeli, karmaşık', 'Uzun, zarif', 'Japon viski sanatının en güzel örneklerinden');

-- Verify data
SELECT COUNT(*) as total_whiskies FROM whiskies;
SELECT name, type, country FROM whiskies;