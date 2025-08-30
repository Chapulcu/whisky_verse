-- TEST 2: Create Tables
-- Run this if tables don't exist

-- Create whiskies table
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
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create basic policy
ALTER TABLE whiskies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view whiskies" ON whiskies;
CREATE POLICY "Anyone can view whiskies" ON whiskies FOR SELECT USING (true);

-- Verify table creation
SELECT 'Tables created successfully!' as result;
SELECT COUNT(*) as whisky_count FROM whiskies;