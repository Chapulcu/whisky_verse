-- Add is_published column to whiskies table for publication status
-- This allows admins to control which whiskies are visible to users

-- Add the is_published column (default to true for existing records)
ALTER TABLE whiskies
ADD COLUMN is_published BOOLEAN DEFAULT true NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_whiskies_published ON whiskies(is_published);

-- Add index for combined queries (published + other filters)
CREATE INDEX IF NOT EXISTS idx_whiskies_published_created ON whiskies(is_published, created_at DESC);

-- Comment on the column
COMMENT ON COLUMN whiskies.is_published IS 'Controls whether the whisky is visible to users (published) or hidden (draft)';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'whiskies' AND column_name = 'is_published';