-- Add translations for the actual whiskies shown in logs
-- These are the real IDs from the console logs

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
-- Lagavulin 8 (ID: 34)
(34, 'en', 'tr',
 'Lagavulin 8 Year Old',
 '[EN] A younger expression of the iconic Lagavulin, aged for 8 years with classic Islay peat smoke.',
 '[EN] Intense peat smoke, sea salt, vanilla and honey sweetness.',
 '[EN] Rich peat smoke balanced with honey, citrus and warming spices.',
 '[EN] Long, smoky finish with lingering maritime notes.',
 '[EN] Golden amber',
 'Single Malt', 'Islay', 'machine'),

-- Lagavulin 16 (ID: 46)
(46, 'en', 'tr',
 'Lagavulin 16 Year Old',
 '[EN] The classic Lagavulin expression, aged 16 years with perfect balance of peat and sweetness.',
 '[EN] Intense smoky peat, seaweed, honey and vanilla with fruit undertones.',
 '[EN] Full-bodied with rich peat smoke, sweet honey, dried fruits and spices.',
 '[EN] Very long finish with warming smoke and subtle sweetness.',
 '[EN] Deep amber gold',
 'Single Malt', 'Islay', 'machine'),

-- Lagavulin 10 (ID: 47)
(47, 'en', 'tr',
 'Lagavulin 10 Year Old',
 '[EN] A special cask strength expression of Lagavulin aged for 10 years.',
 '[EN] Powerful peat smoke, maritime sea spray, vanilla and honey.',
 '[EN] Intense and oily with peat smoke, honey sweetness and spice.',
 '[EN] Long, powerful finish with lingering smoke and warmth.',
 '[EN] Rich gold',
 'Single Malt', 'Islay', 'machine'),

-- Russian translations
(34, 'ru', 'tr',
 'Lagavulin 8 лет',
 '[RU] Молодое выражение знаменитого Лагавулина, выдержанное 8 лет с классическим торфяным дымом.',
 '[RU] Интенсивный торфяной дым, морская соль, ваниль и медовая сладость.',
 '[RU] Богатый торфяной дым, сбалансированный медом, цитрусом и согревающими специями.',
 '[RU] Долгое дымное послевкусие с морскими нотами.',
 '[RU] Золотисто-янтарный',
 'Single Malt', 'Islay', 'machine'),

(46, 'ru', 'tr',
 'Lagavulin 16 лет',
 '[RU] Классическое выражение Лагавулина, выдержанное 16 лет с идеальным балансом торфа и сладости.',
 '[RU] Интенсивный дымный торф, водоросли, мед и ваниль с фруктовыми оттенками.',
 '[RU] Полнотелый с богатым торфяным дымом, сладким медом, сухофруктами и специями.',
 '[RU] Очень долгое послевкусие с согревающим дымом и тонкой сладостью.',
 '[RU] Глубокий янтарно-золотой',
 'Single Malt', 'Islay', 'machine'),

(47, 'ru', 'tr',
 'Lagavulin 10 лет',
 '[RU] Специальное выражение бочковой крепости Лагавулина, выдержанное 10 лет.',
 '[RU] Мощный торфяной дым, морские брызги, ваниль и мед.',
 '[RU] Интенсивный и маслянистый с торфяным дымом, медовой сладостью и специями.',
 '[RU] Долгое мощное послевкусие с задерживающимся дымом и теплотой.',
 '[RU] Насыщенное золото',
 'Single Malt', 'Islay', 'machine');

-- Check what we added
SELECT
  wt.whisky_id,
  wt.language_code,
  wt.name,
  LEFT(wt.description, 60) as description_preview
FROM whisky_translations wt
WHERE wt.whisky_id IN (34, 46, 47)
ORDER BY wt.whisky_id, wt.language_code;