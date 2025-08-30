-- Data Migration Script
-- This script migrates existing whisky data to the new multilingual structure

-- First, migrate the non-translatable whisky data
INSERT INTO whiskies_new (id, alcohol_percentage, image_url, country, region, created_at)
SELECT id, alcohol_percentage, image_url, country, region, created_at 
FROM whiskies
ON CONFLICT (id) DO NOTHING;

-- Update the sequence to continue from the highest existing ID
SELECT setval('whiskies_new_id_seq', (SELECT COALESCE(MAX(id), 0) FROM whiskies_new));

-- Migrate existing whisky translations (assuming current data is in Turkish)
INSERT INTO whisky_translations (whisky_id, language_code, name, type, description, aroma, taste, finish, color, created_at)
SELECT id, 'tr', name, type, description, aroma, taste, finish, color, created_at
FROM whiskies
ON CONFLICT (whisky_id, language_code) DO NOTHING;

-- Create placeholder English translations (copy from Turkish for now)
INSERT INTO whisky_translations (whisky_id, language_code, name, type, description, aroma, taste, finish, color, created_at)
SELECT id, 'en', name, type, description, aroma, taste, finish, color, created_at
FROM whiskies
ON CONFLICT (whisky_id, language_code) DO NOTHING;

-- Create placeholder Russian translations (copy from Turkish for now)
INSERT INTO whisky_translations (whisky_id, language_code, name, type, description, aroma, taste, finish, color, created_at)
SELECT id, 'ru', name, type, description, aroma, taste, finish, color, created_at
FROM whiskies
ON CONFLICT (whisky_id, language_code) DO NOTHING;

-- After migration is complete, you can:
-- 1. Drop the old whiskies table: DROP TABLE whiskies;
-- 2. Rename the new table: ALTER TABLE whiskies_new RENAME TO whiskies;
-- 3. Add the foreign key constraint to whisky_translations table