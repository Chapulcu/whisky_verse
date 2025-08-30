-- Complete Database Setup Script for Whisky Community
-- Run this in your Supabase SQL Editor
-- This will add missing columns and insert sample whisky data

-- Step 1: Add rating column (1-100 scale)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whiskies' AND column_name = 'rating'
    ) THEN
        ALTER TABLE whiskies ADD COLUMN rating DECIMAL(5,1) CHECK (rating >= 1.0 AND rating <= 100.0);
        COMMENT ON COLUMN whiskies.rating IS 'User rating on a scale of 1.0 to 100.0';
        CREATE INDEX idx_whiskies_rating ON whiskies(rating) WHERE rating IS NOT NULL;
    END IF;
END $$;

-- Step 2: Add age_years column
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whiskies' AND column_name = 'age_years'
    ) THEN
        ALTER TABLE whiskies ADD COLUMN age_years INTEGER CHECK (age_years > 0 AND age_years <= 100);
        COMMENT ON COLUMN whiskies.age_years IS 'Age of the whisky in years, null for NAS (No Age Statement) whiskies';
        CREATE INDEX idx_whiskies_age ON whiskies(age_years) WHERE age_years IS NOT NULL;
    END IF;
END $$;

-- Step 3: Clear existing data
DELETE FROM whiskies;

-- Step 4: Insert premium whisky data
INSERT INTO whiskies (name, type, country, region, alcohol_percentage, rating, age_years, description, color, aroma, taste, finish) VALUES

-- Scottish Single Malts
('Macallan 18', 'Single Malt Scotch Whisky', 'Scotland', 'Speyside', 43.0, 92.0, 18, 'Rich and complex with notes of dried fruits and spice', 'Deep amber', 'Rich dried fruits, vanilla, and subtle spice', 'Full-bodied with dried fruits, chocolate, and oak', 'Long and warming with hints of spice and dried fruit'),

('Glenfiddich 12', 'Single Malt Scotch Whisky', 'Scotland', 'Speyside', 40.0, 78.0, 12, 'Fresh and fruity with a smooth finish', 'Golden', 'Pear, apple, and honey', 'Sweet fruit and vanilla', 'Medium finish with subtle oak'),

('Lagavulin 16', 'Single Malt Scotch Whisky', 'Scotland', 'Islay', 43.0, 89.0, 16, 'Intensely peated with maritime character', 'Deep gold', 'Peat smoke, sea salt, and medicinal notes', 'Rich peat, smoke, and dried fruits', 'Very long with smoke and sea spray'),

('Ardbeg 10', 'Single Malt Scotch Whisky', 'Scotland', 'Islay', 46.0, 87.0, 10, 'Intensely smoky Islay single malt', 'Pale gold', 'Peat smoke, lemon, and tar', 'Sweet smoke, citrus, and black pepper', 'Very long with smoke and spice'),

('Glenlivet 18', 'Single Malt Scotch Whisky', 'Scotland', 'Speyside', 43.0, 85.0, 18, 'Elegant and complex with tropical fruit notes', 'Rich gold', 'Tropical fruits, honey, and spice', 'Rich with fruit, nuts, and cinnamon', 'Long with fruit and oak'),

-- Irish Whiskeys
('Jameson Original', 'Irish Whiskey', 'Ireland', 'Cork', 40.0, 75.0, NULL, 'Triple-distilled Irish whiskey with smooth character', 'Golden yellow', 'Light floral and fruity', 'Smooth with vanilla and mild spice', 'Medium finish with gentle warmth'),

('Redbreast 12', 'Irish Single Pot Still Whiskey', 'Ireland', 'Cork', 40.0, 88.0, 12, 'Rich and complex pot still Irish whiskey', 'Golden amber', 'Rich fruits, spices, and toasted wood', 'Full-bodied with fruit cake, spice, and nuts', 'Long with dried fruits and oak'),

('Green Spot', 'Irish Single Pot Still Whiskey', 'Ireland', 'Cork', 40.0, 86.0, NULL, 'Vibrant pot still with fresh fruit character', 'Bright gold', 'Fresh fruits and herbs', 'Spicy with apple and honey', 'Medium with spice and citrus'),

-- American Whiskeys
('Buffalo Trace', 'Bourbon Whiskey', 'USA', 'Kentucky', 45.0, 82.0, NULL, 'Classic American bourbon with sweet vanilla notes', 'Medium amber', 'Vanilla, mint, and molasses', 'Sweet with vanilla, caramel, and spice', 'Medium finish with pepper and oak'),

('Makers Mark', 'Bourbon Whiskey', 'USA', 'Kentucky', 45.0, 79.0, NULL, 'Wheated bourbon with soft, sweet character', 'Rich amber', 'Vanilla, caramel, and honey', 'Sweet with vanilla, honey, and cinnamon', 'Medium finish with warm spice'),

('Woodford Reserve', 'Bourbon Whiskey', 'USA', 'Kentucky', 45.5, 84.0, NULL, 'Premium small-batch bourbon', 'Rich amber', 'Vanilla, wood smoke, and spice', 'Complex with vanilla, spice, and fruit', 'Long with oak and spice'),

('Jack Daniels Old No.7', 'Tennessee Whiskey', 'USA', 'Tennessee', 40.0, 73.0, NULL, 'Charcoal mellowed Tennessee whiskey', 'Golden amber', 'Vanilla and caramel', 'Sweet with vanilla and smoke', 'Medium with charcoal and spice'),

-- Japanese Whiskies
('Hibiki 12', 'Japanese Whisky', 'Japan', 'Honshu', 43.0, 95.0, 12, 'Harmonious blend of malt and grain whiskies', 'Amber gold', 'Honey, orange peel, and white chocolate', 'Smooth with honey, citrus, and oak', 'Long and elegant with subtle spice'),

('Yamazaki 12', 'Japanese Single Malt Whisky', 'Japan', 'Honshu', 43.0, 93.0, 12, 'Elegant Japanese single malt with fruit and spice', 'Golden amber', 'Stone fruits and honey', 'Rich with fruit, spice, and mizunara oak', 'Long with fruit and Japanese oak'),

('Nikka Coffey Grain', 'Japanese Grain Whisky', 'Japan', 'Honshu', 45.0, 81.0, NULL, 'Smooth grain whisky from coffey stills', 'Light gold', 'Vanilla, corn, and citrus', 'Sweet with vanilla and tropical fruit', 'Medium with gentle spice'),

-- Blended Scotch
('Johnnie Walker Blue Label', 'Blended Scotch Whisky', 'Scotland', 'Various', 40.0, 85.0, NULL, 'Premium blend of rare and exceptional whiskies', 'Deep amber', 'Rich honey, dried fruits, and smoke', 'Smooth with honey, nuts, and sherry', 'Long and warming with gentle smoke'),

('Chivas Regal 18', 'Blended Scotch Whisky', 'Scotland', 'Various', 40.0, 83.0, 18, 'Premium aged blend with rich complexity', 'Deep gold', 'Dried fruits, honey, and chocolate', 'Rich with fruit, nuts, and spice', 'Long with dried fruit and oak'),

-- Canadian Whisky
('Crown Royal', 'Canadian Whisky', 'Canada', 'Manitoba', 40.0, 76.0, NULL, 'Smooth Canadian blend', 'Golden amber', 'Vanilla, oak, and fruit', 'Smooth with vanilla and spice', 'Medium with gentle warmth'),

-- World Whiskies
('Kavalan Solist Vinho Barrique', 'Taiwanese Single Malt Whisky', 'Taiwan', 'Yilan', 57.8, 90.0, NULL, 'Cask strength Taiwanese single malt', 'Deep amber', 'Wine, fruit, and spice', 'Rich with wine, chocolate, and fruit', 'Long with wine and spice'),

('Amrut Fusion', 'Indian Single Malt Whisky', 'India', 'Bangalore', 50.0, 84.0, NULL, 'Unique blend of Indian and Scottish barley', 'Golden amber', 'Honey, vanilla, and spice', 'Rich with honey, fruit, and spice', 'Long with spice and oak');

-- Step 5: Verify the insertion
DO $$
DECLARE
    whisky_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO whisky_count FROM whiskies;
    RAISE NOTICE 'Successfully inserted % whiskies into the database', whisky_count;
END $$;

-- Show sample data
SELECT 
    id, name, type, country, rating, age_years,
    CASE 
        WHEN age_years IS NULL THEN 'NAS' 
        ELSE age_years::text || ' years'
    END as age_display
FROM whiskies 
ORDER BY rating DESC 
LIMIT 10;