-- Check if country column exists in whisky_translations table
-- Run this in Supabase SQL Editor

-- First, check current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'whisky_translations'
ORDER BY ordinal_position;

-- Add country column if it doesn't exist
ALTER TABLE whisky_translations
ADD COLUMN IF NOT EXISTS country TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'whisky_translations'
  AND column_name = 'country';