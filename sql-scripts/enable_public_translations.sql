-- Enable public read access for whisky_translations (for testing)
-- Run this in Supabase SQL Editor

-- Option 1: Allow public read access to translations
DROP POLICY IF EXISTS "Enable read access for all users" ON whisky_translations;
CREATE POLICY "Enable read access for all users"
ON whisky_translations FOR SELECT
TO public
USING (true);

-- Option 2: Allow public insert access for testing (remove after)
DROP POLICY IF EXISTS "Enable insert for all users" ON whisky_translations;
CREATE POLICY "Enable insert for all users"
ON whisky_translations FOR INSERT
TO public
WITH CHECK (true);

-- Now try inserting test data again
INSERT INTO whisky_translations (
  whisky_id, language_code, source_language_code, name, description, aroma, taste, finish, color, type, region, country, translation_status
) VALUES
(34, 'en', 'tr', 'Lagavulin 8 Year Old', '[EN] A younger expression of Lagavulin.', '[EN] Intense peat smoke.', '[EN] Rich peat smoke.', '[EN] Long, smoky finish.', '[EN] Golden amber', 'Single Malt', 'Islay', 'Scotland', 'machine'),
(34, 'ru', 'tr', 'Lagavulin 8 лет', '[RU] Молодое выражение Лагавулина.', '[RU] Интенсивный торфяной дым.', '[RU] Богатый торфяной дым.', '[RU] Долгое дымное послевкусие.', '[RU] Золотисто-янтарный', 'Single Malt', 'Islay', 'Шотландия', 'machine'),
(46, 'en', 'tr', 'Lagavulin 16 Year Old', '[EN] The classic Lagavulin expression.', '[EN] Intense smoky peat.', '[EN] Full-bodied with rich peat.', '[EN] Very long finish.', '[EN] Deep amber gold', 'Single Malt', 'Islay', 'Scotland', 'machine'),
(46, 'ru', 'tr', 'Lagavulin 16 лет', '[RU] Классическое выражение Лагавулина.', '[RU] Интенсивный дымный торф.', '[RU] Полнотелый с богатым торфом.', '[RU] Очень долгое послевкусие.', '[RU] Глубокий янтарно-золотой', 'Single Malt', 'Islay', 'Шотландия', 'machine')
ON CONFLICT (whisky_id, language_code) DO NOTHING;

-- Check if data was inserted
SELECT whisky_id, language_code, name FROM whisky_translations
WHERE whisky_id IN (34, 46)
ORDER BY whisky_id, language_code;