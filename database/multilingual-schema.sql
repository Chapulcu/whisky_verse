-- =====================================================
-- ÇOKLU DİL SİSTEMİ - DATABASE SCHEMA
-- =====================================================

-- 1. Diller tablosu
CREATE TABLE IF NOT EXISTS languages (
    code VARCHAR(5) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    native_name VARCHAR(50) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan dilleri ekle
INSERT INTO languages (code, name, native_name, flag_emoji) VALUES
('tr', 'Turkish', 'Türkçe', '🇹🇷'),
('en', 'English', 'English', '🇺🇸'),
('ru', 'Russian', 'Русский', '🇷🇺'),
('bg', 'Bulgarian', 'Български', '🇧🇬')
ON CONFLICT (code) DO NOTHING;

-- 2. Viski çevirileri tablosu
CREATE TABLE IF NOT EXISTS whisky_translations (
    id SERIAL PRIMARY KEY,
    whisky_id INTEGER NOT NULL REFERENCES whiskies(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL REFERENCES languages(code),
    name VARCHAR(255),
    type VARCHAR(100),
    description TEXT,
    aroma TEXT,
    taste TEXT,
    finish TEXT,
    color VARCHAR(100),
    is_complete BOOLEAN DEFAULT false,
    translated_by VARCHAR(50) DEFAULT 'auto', -- 'auto', 'human', 'n8n'
    translation_quality NUMERIC(3,2) DEFAULT 0.85, -- Çeviri kalitesi (0-1)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(whisky_id, language_code)
);

-- 3. Çeviri işleri tablosu (N8N için)
CREATE TABLE IF NOT EXISTS translation_jobs (
    id SERIAL PRIMARY KEY,
    whisky_id INTEGER NOT NULL REFERENCES whiskies(id) ON DELETE CASCADE,
    source_language VARCHAR(5) NOT NULL DEFAULT 'tr',
    target_language VARCHAR(5) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    source_text JSONB NOT NULL, -- {name, type, description, aroma, taste, finish, color}
    translated_text JSONB, -- Çeviri sonucu
    provider VARCHAR(50) DEFAULT 'openai', -- openai, google, deepl
    error_message TEXT,
    n8n_execution_id VARCHAR(255), -- N8N workflow execution ID
    priority INTEGER DEFAULT 5, -- 1-10 (1 = en yüksek öncelik)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. İndeksler
CREATE INDEX IF NOT EXISTS idx_whisky_translations_whisky_id ON whisky_translations(whisky_id);
CREATE INDEX IF NOT EXISTS idx_whisky_translations_language ON whisky_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_status ON translation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_priority ON translation_jobs(priority, created_at);

-- =====================================================
-- RPC FONksiyonları
-- =====================================================

-- 1. Viski çevirisini kaydet/güncelle
CREATE OR REPLACE FUNCTION upsert_whisky_translation(
    p_whisky_id INTEGER,
    p_language_code VARCHAR(5),
    p_name VARCHAR(255) DEFAULT NULL,
    p_type VARCHAR(100) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_aroma TEXT DEFAULT NULL,
    p_taste TEXT DEFAULT NULL,
    p_finish TEXT DEFAULT NULL,
    p_color VARCHAR(100) DEFAULT NULL,
    p_translated_by VARCHAR(50) DEFAULT 'human'
) RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
    INSERT INTO whisky_translations (
        whisky_id, language_code, name, type, description, 
        aroma, taste, finish, color, translated_by, updated_at
    ) VALUES (
        p_whisky_id, p_language_code, p_name, p_type, p_description,
        p_aroma, p_taste, p_finish, p_color, p_translated_by, NOW()
    )
    ON CONFLICT (whisky_id, language_code) 
    DO UPDATE SET
        name = COALESCE(p_name, whisky_translations.name),
        type = COALESCE(p_type, whisky_translations.type),
        description = COALESCE(p_description, whisky_translations.description),
        aroma = COALESCE(p_aroma, whisky_translations.aroma),
        taste = COALESCE(p_taste, whisky_translations.taste),
        finish = COALESCE(p_finish, whisky_translations.finish),
        color = COALESCE(p_color, whisky_translations.color),
        translated_by = p_translated_by,
        updated_at = NOW(),
        is_complete = CASE 
            WHEN p_name IS NOT NULL AND p_type IS NOT NULL THEN true
            ELSE whisky_translations.is_complete
        END;
    
    RETURN QUERY SELECT true, 'Translation saved successfully';
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 2. Viski için tüm çevirileri getir
CREATE OR REPLACE FUNCTION get_whisky_all_translations(p_whisky_id INTEGER)
RETURNS TABLE(
    whisky_id INTEGER,
    language_code VARCHAR(5),
    language_name VARCHAR(50),
    name VARCHAR(255),
    type VARCHAR(100),
    description TEXT,
    aroma TEXT,
    taste TEXT,
    finish TEXT,
    color VARCHAR(100),
    is_complete BOOLEAN,
    translated_by VARCHAR(50),
    translation_quality NUMERIC(3,2)
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
        wt.is_complete,
        wt.translated_by,
        wt.translation_quality
    FROM whisky_translations wt
    JOIN languages l ON l.code = wt.language_code
    WHERE wt.whisky_id = p_whisky_id
    ORDER BY l.code;
END;
$$ LANGUAGE plpgsql;

-- 3. Çeviri işi oluştur (N8N tetikleyici)
CREATE OR REPLACE FUNCTION create_translation_job(
    p_whisky_id INTEGER,
    p_target_language VARCHAR(5),
    p_source_language VARCHAR(5) DEFAULT 'tr',
    p_priority INTEGER DEFAULT 5
) RETURNS TABLE(job_id INTEGER, success BOOLEAN, message TEXT) AS $$
DECLARE
    v_job_id INTEGER;
    v_source_text JSONB;
BEGIN
    -- Ana viski verisini al
    SELECT jsonb_build_object(
        'name', w.name,
        'type', w.type,
        'description', w.description,
        'aroma', w.aroma,
        'taste', w.taste,
        'finish', w.finish,
        'color', w.color
    )
    INTO v_source_text
    FROM whiskies w
    WHERE w.id = p_whisky_id;
    
    IF v_source_text IS NULL THEN
        RETURN QUERY SELECT NULL, false, 'Whisky not found';
        RETURN;
    END IF;
    
    -- Çeviri işi oluştur
    INSERT INTO translation_jobs (
        whisky_id, source_language, target_language, 
        source_text, priority, status
    ) VALUES (
        p_whisky_id, p_source_language, p_target_language,
        v_source_text, p_priority, 'pending'
    ) RETURNING id INTO v_job_id;
    
    RETURN QUERY SELECT v_job_id, true, 'Translation job created';
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT NULL, false, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 4. Çoklu dil verisiyle viski getir
CREATE OR REPLACE FUNCTION get_whisky_with_translations(
    p_whisky_id INTEGER,
    p_language_code VARCHAR(5) DEFAULT 'tr'
) RETURNS TABLE(
    id INTEGER,
    alcohol_percentage NUMERIC,
    rating NUMERIC,
    age_years INTEGER,
    image_url TEXT,
    country VARCHAR(100),
    region VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE,
    name VARCHAR(255),
    type VARCHAR(100),
    description TEXT,
    aroma TEXT,
    taste TEXT,
    finish TEXT,
    color VARCHAR(100),
    language_code VARCHAR(5)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.alcohol_percentage,
        w.rating,
        w.age_years,
        w.image_url,
        w.country,
        w.region,
        w.created_at,
        COALESCE(wt.name, w.name) as name,
        COALESCE(wt.type, w.type) as type,
        COALESCE(wt.description, w.description) as description,
        COALESCE(wt.aroma, w.aroma) as aroma,
        COALESCE(wt.taste, w.taste) as taste,
        COALESCE(wt.finish, w.finish) as finish,
        COALESCE(wt.color, w.color) as color,
        p_language_code as language_code
    FROM whiskies w
    LEFT JOIN whisky_translations wt ON (
        wt.whisky_id = w.id AND 
        wt.language_code = p_language_code
    )
    WHERE w.id = p_whisky_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRİGGER FONKSYONLARı (Otomatik çeviri tetikleyici)
-- =====================================================

-- Yeni viski eklendiğinde otomatik çeviri işleri oluştur
CREATE OR REPLACE FUNCTION trigger_auto_translation()
RETURNS TRIGGER AS $$
BEGIN
    -- Sadece INSERT ve önemli UPDATE'lerde tetikle
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (
        OLD.name IS DISTINCT FROM NEW.name OR
        OLD.description IS DISTINCT FROM NEW.description OR
        OLD.aroma IS DISTINCT FROM NEW.aroma OR
        OLD.taste IS DISTINCT FROM NEW.taste
    )) THEN
        -- İngilizce, Rusça ve Bulgarca çeviri işleri oluştur
        INSERT INTO translation_jobs (whisky_id, target_language, source_text, priority)
        SELECT 
            NEW.id,
            lang.code,
            jsonb_build_object(
                'name', NEW.name,
                'type', NEW.type,
                'description', NEW.description,
                'aroma', NEW.aroma,
                'taste', NEW.taste,
                'finish', NEW.finish,
                'color', NEW.color
            ),
            CASE lang.code WHEN 'en' THEN 3 ELSE 5 END -- İngilizce öncelikli
        FROM languages lang
        WHERE lang.code IN ('en', 'ru', 'bg') AND lang.is_active = true
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı whiskies tablosuna bağla
DROP TRIGGER IF EXISTS auto_translation_trigger ON whiskies;
CREATE TRIGGER auto_translation_trigger
    AFTER INSERT OR UPDATE ON whiskies
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_translation();

-- =====================================================
-- WEBHOOK ENDPOİNTLERİ (N8N için)
-- =====================================================

-- N8N webhook URL'leri için Edge Functions kullanacağız
-- Bu fonksiyonlar daha sonra Supabase Edge Functions olarak implement edilecek

COMMENT ON TABLE translation_jobs IS 'N8N otomasyonu için çeviri işleri tablosu';
COMMENT ON TABLE whisky_translations IS 'Çoklu dil viski verileri';
COMMENT ON FUNCTION create_translation_job IS 'N8N workflow tetikleyicisi';
