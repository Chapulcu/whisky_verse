-- Sample translations for testing multilingual system
-- Run this in Supabase SQL editor with proper permissions

-- First, let's check what whiskies we have with rich descriptions
SELECT id, name, description, aroma, taste, finish
FROM whiskies
WHERE description IS NOT NULL
  AND aroma IS NOT NULL
  AND taste IS NOT NULL
LIMIT 5;

-- Add English translations for first few whiskies
INSERT INTO whisky_translations (
  whisky_id,
  language_code,
  source_language_code,
  name,
  description,
  aroma,
  taste,
  finish,
  color,
  type,
  region,
  translation_status
) VALUES
-- Whisky ID 34 - Lagavulin 8 (assuming this exists)
(34, 'en', 'tr', 'Lagavulin 8', '[EN] Rich and complex Islay single malt with intense smoky flavors.', '[EN] Intense peat smoke, maritime sea salt, and vanilla sweetness.', '[EN] Bold peat smoke balanced with honey and spice.', '[EN] Long, warming finish with lingering smoke.', '[EN] Golden amber', 'Single Malt', 'Islay', 'machine'),

-- Whisky ID 30 - Talisker 18 (assuming this exists)
(30, 'en', 'tr', 'Talisker 18', '[EN] Aged 18 years, this maritime whisky delivers exceptional depth and complexity.', '[EN] Sea spray, pepper, and tropical fruits with underlying smoke.', '[EN] Rich and full-bodied with warming spices and fruit.', '[EN] Very long finish with gentle smoke and spice.', '[EN] Deep gold', 'Single Malt', 'Isle of Skye', 'machine'),

-- Russian translations
(34, 'ru', 'tr', 'Lagavulin 8', '[RU] Богатый и сложный односолодовый виски с острова Айла с интенсивным дымным вкусом.', '[RU] Интенсивный торфяной дым, морская соль и ванильная сладость.', '[RU] Смелый торфяной дым, сбалансированный медом и специями.', '[RU] Долгое, согревающее послевкусие с задерживающимся дымом.', '[RU] Золотисто-янтарный', 'Single Malt', 'Islay', 'machine'),

(30, 'ru', 'tr', 'Talisker 18', '[RU] Выдержанный 18 лет, этот морской виски обладает исключительной глубиной и сложностью.', '[RU] Морские брызги, перец и тропические фрукты с дымным оттенком.', '[RU] Богатый и полнотелый с согревающими специями и фруктами.', '[RU] Очень долгое послевкусие с мягким дымом и специями.', '[RU] Глубокое золото', 'Single Malt', 'Isle of Skye', 'machine');

-- Check what we added
SELECT
  wt.whisky_id,
  w.name as original_name,
  wt.language_code,
  wt.name as translated_name,
  LEFT(wt.description, 50) as description_preview
FROM whisky_translations wt
JOIN whiskies w ON w.id = wt.whisky_id
ORDER BY wt.whisky_id, wt.language_code;