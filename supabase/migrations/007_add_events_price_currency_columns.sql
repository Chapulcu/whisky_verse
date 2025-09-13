-- Add missing price and currency columns to events table
-- Created: 2024-09-12

-- Add currency column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'currency' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE events ADD COLUMN currency varchar(10) DEFAULT 'TRY';
        RAISE NOTICE 'Added currency column to events table';
    END IF;
END $$;

-- Add price column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'price' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE events ADD COLUMN price decimal(10,2) DEFAULT 0;
        RAISE NOTICE 'Added price column to events table';
    END IF;
END $$;

-- Update existing events to have default values
UPDATE events 
SET currency = COALESCE(currency, 'TRY')
WHERE currency IS NULL;

UPDATE events 
SET price = COALESCE(price, 0)
WHERE price IS NULL;