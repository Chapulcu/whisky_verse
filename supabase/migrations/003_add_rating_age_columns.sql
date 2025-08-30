-- Migration: Add rating and age columns to whiskies table
-- Created: 2025-01-24
-- Description: Adds user rating (1-10 scale) and whisky age columns to enhance whisky properties

-- Add rating column (decimal for precise ratings like 8.5)
ALTER TABLE whiskies 
ADD COLUMN rating DECIMAL(3,1) CHECK (rating >= 1.0 AND rating <= 10.0);

-- Add age column (integer for years, nullable for NAS whiskies)
ALTER TABLE whiskies 
ADD COLUMN age_years INTEGER CHECK (age_years > 0 AND age_years <= 100);

-- Add comments for documentation
COMMENT ON COLUMN whiskies.rating IS 'User rating on a scale of 1.0 to 10.0';
COMMENT ON COLUMN whiskies.age_years IS 'Age of the whisky in years, null for NAS (No Age Statement) whiskies';

-- Create index for better performance on rating queries
CREATE INDEX idx_whiskies_rating ON whiskies(rating) WHERE rating IS NOT NULL;

-- Create index for age queries
CREATE INDEX idx_whiskies_age ON whiskies(age_years) WHERE age_years IS NOT NULL;