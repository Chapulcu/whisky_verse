-- Migration: Update rating scale from 1-10 to 1-100
-- Created: 2025-01-24
-- Description: Updates whisky rating scale to 1-100 for more precise ratings

-- Drop existing constraint
ALTER TABLE whiskies 
DROP CONSTRAINT IF EXISTS whiskies_rating_check;

-- Update column type to support larger numbers with decimal precision
ALTER TABLE whiskies 
ALTER COLUMN rating TYPE DECIMAL(5,1);

-- Add new constraint for 1-100 scale
ALTER TABLE whiskies 
ADD CONSTRAINT whiskies_rating_check CHECK (rating >= 1.0 AND rating <= 100.0);

-- Update column comment
COMMENT ON COLUMN whiskies.rating IS 'User rating on a scale of 1.0 to 100.0';