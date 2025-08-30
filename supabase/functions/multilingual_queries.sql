-- Database Functions for Multilingual Queries
-- These functions provide efficient querying with automatic fallback to default language

-- Function to get whiskies with translations and fallback
CREATE OR REPLACE FUNCTION get_whiskies_with_translations(
  p_language_code VARCHAR(2) DEFAULT 'tr',
  p_limit INTEGER DEFAULT NULL,
  p_offset INTEGER DEFAULT 0,
  p_search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  alcohol_percentage DECIMAL,
  image_url TEXT,
  country VARCHAR,
  region VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  name VARCHAR(255),
  type VARCHAR(100),
  description TEXT,
  aroma TEXT,
  taste TEXT,
  finish TEXT,
  color VARCHAR(100),
  language_code VARCHAR(2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.alcohol_percentage,
    w.image_url,
    w.country,
    w.region,
    w.created_at,
    COALESCE(wt.name, wt_default.name) as name,
    COALESCE(wt.type, wt_default.type) as type,
    COALESCE(wt.description, wt_default.description) as description,
    COALESCE(wt.aroma, wt_default.aroma) as aroma,
    COALESCE(wt.taste, wt_default.taste) as taste,
    COALESCE(wt.finish, wt_default.finish) as finish,
    COALESCE(wt.color, wt_default.color) as color,
    p_language_code as language_code
  FROM whiskies_new w
  LEFT JOIN whisky_translations wt ON w.id = wt.whisky_id AND wt.language_code = p_language_code
  LEFT JOIN whisky_translations wt_default ON w.id = wt_default.whisky_id AND wt_default.language_code = 'tr'
  WHERE (p_search_term IS NULL OR 
         COALESCE(wt.name, wt_default.name) ILIKE '%' || p_search_term || '%' OR
         COALESCE(wt.type, wt_default.type) ILIKE '%' || p_search_term || '%' OR
         COALESCE(wt.description, wt_default.description) ILIKE '%' || p_search_term || '%')
  ORDER BY w.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get a single whisky with translations
CREATE OR REPLACE FUNCTION get_whisky_with_translations(
  p_whisky_id BIGINT,
  p_language_code VARCHAR(2) DEFAULT 'tr'
)
RETURNS TABLE (
  id BIGINT,
  alcohol_percentage DECIMAL,
  image_url TEXT,
  country VARCHAR,
  region VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  name VARCHAR(255),
  type VARCHAR(100),
  description TEXT,
  aroma TEXT,
  taste TEXT,
  finish TEXT,
  color VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.alcohol_percentage,
    w.image_url,
    w.country,
    w.region,
    w.created_at,
    COALESCE(wt.name, wt_default.name) as name,
    COALESCE(wt.type, wt_default.type) as type,
    COALESCE(wt.description, wt_default.description) as description,
    COALESCE(wt.aroma, wt_default.aroma) as aroma,
    COALESCE(wt.taste, wt_default.taste) as taste,
    COALESCE(wt.finish, wt_default.finish) as finish,
    COALESCE(wt.color, wt_default.color) as color
  FROM whiskies_new w
  LEFT JOIN whisky_translations wt ON w.id = wt.whisky_id AND wt.language_code = p_language_code
  LEFT JOIN whisky_translations wt_default ON w.id = wt_default.whisky_id AND wt_default.language_code = 'tr'
  WHERE w.id = p_whisky_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get all translations for a whisky
CREATE OR REPLACE FUNCTION get_whisky_all_translations(p_whisky_id BIGINT)
RETURNS TABLE (
  whisky_id BIGINT,
  language_code VARCHAR(2),
  language_name VARCHAR(50),
  name VARCHAR(255),
  type VARCHAR(100),
  description TEXT,
  aroma TEXT,
  taste TEXT,
  finish TEXT,
  color VARCHAR(100),
  is_complete BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wt.whisky_id,
    wt.language_code,
    l.name as language_name,
    wt.name,
    wt.type,
    wt.description,
    wt.aroma,
    wt.taste,
    wt.finish,
    wt.color,
    (wt.name IS NOT NULL AND wt.name != '' AND 
     wt.type IS NOT NULL AND wt.type != '') as is_complete
  FROM whisky_translations wt
  JOIN languages l ON wt.language_code = l.code
  WHERE wt.whisky_id = p_whisky_id AND l.is_active = true
  ORDER BY l.is_default DESC, wt.language_code;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert whisky translation
CREATE OR REPLACE FUNCTION upsert_whisky_translation(
  p_whisky_id BIGINT,
  p_language_code VARCHAR(2),
  p_name VARCHAR(255),
  p_type VARCHAR(100) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_aroma TEXT DEFAULT NULL,
  p_taste TEXT DEFAULT NULL,
  p_finish TEXT DEFAULT NULL,
  p_color VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO whisky_translations (
    whisky_id, language_code, name, type, description, 
    aroma, taste, finish, color, updated_at
  ) VALUES (
    p_whisky_id, p_language_code, p_name, p_type, p_description,
    p_aroma, p_taste, p_finish, p_color, NOW()
  )
  ON CONFLICT (whisky_id, language_code)
  DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    aroma = EXCLUDED.aroma,
    taste = EXCLUDED.taste,
    finish = EXCLUDED.finish,
    color = EXCLUDED.color,
    updated_at = NOW();
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;