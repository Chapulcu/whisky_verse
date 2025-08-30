-- Migration: Add missing rating and age_years columns to whiskies table
-- Created: 2025-08-26
-- Description: Adds the rating and age_years columns that are expected by the application but missing from the database

-- Add rating column (decimal for precise ratings like 85.5)
ALTER TABLE whiskies 
ADD COLUMN IF NOT EXISTS rating DECIMAL(5,1) CHECK (rating >= 1.0 AND rating <= 100.0);

-- Add age column (integer for years, nullable for NAS whiskies)
ALTER TABLE whiskies 
ADD COLUMN IF NOT EXISTS age_years INTEGER CHECK (age_years > 0 AND age_years <= 100);

-- Add comments for documentation
COMMENT ON COLUMN whiskies.rating IS 'Overall whisky rating on a scale of 1.0 to 100.0';
COMMENT ON COLUMN whiskies.age_years IS 'Age of the whisky in years, null for NAS (No Age Statement) whiskies';

-- Create index for better performance on rating queries
CREATE INDEX IF NOT EXISTS idx_whiskies_rating ON whiskies(rating) WHERE rating IS NOT NULL;

-- Create index for age queries
CREATE INDEX IF NOT EXISTS idx_whiskies_age ON whiskies(age_years) WHERE age_years IS NOT NULL;