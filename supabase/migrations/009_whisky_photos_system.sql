-- =============================================
-- WhiskyVerse Photo System Database Schema
-- Migration: 009_whisky_photos_system.sql
-- =============================================

-- Whisky Photos Table: Viski fotoğraflarını tutar
CREATE TABLE IF NOT EXISTS whisky_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    whisky_id INTEGER REFERENCES whiskies(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    content_type TEXT,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_approved BOOLEAN DEFAULT true, -- Şimdilik otomatik onay
    is_primary BOOLEAN DEFAULT false, -- Ana fotoğraf mı?
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Functions: Photo işlevleri
-- =============================================

-- Function: Fotoğraf upload'ında achievement güncelle
CREATE OR REPLACE FUNCTION trigger_photo_achievement()
RETURNS TRIGGER AS $$
BEGIN
    -- photos_taken sayısını artır (user_progress tablosunda)
    INSERT INTO user_progress (user_id, photos_taken, account_created)
    VALUES (NEW.user_id, 1, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET
        photos_taken = user_progress.photos_taken + 1,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Fotoğraf silindiğinde achievement güncelle
CREATE OR REPLACE FUNCTION trigger_photo_delete_achievement()
RETURNS TRIGGER AS $$
BEGIN
    -- photos_taken sayısını azalt (minimum 0)
    UPDATE user_progress
    SET photos_taken = GREATEST(photos_taken - 1, 0),
        updated_at = NOW()
    WHERE user_id = OLD.user_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Triggers: Otomatik işlemler
-- =============================================

-- Trigger: Yeni fotoğraf upload'ında achievement güncelle
DROP TRIGGER IF EXISTS on_photo_uploaded ON whisky_photos;
CREATE TRIGGER on_photo_uploaded
    AFTER INSERT ON whisky_photos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_photo_achievement();

-- Trigger: Fotoğraf silindiğinde achievement güncelle
DROP TRIGGER IF EXISTS on_photo_deleted ON whisky_photos;
CREATE TRIGGER on_photo_deleted
    AFTER DELETE ON whisky_photos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_photo_delete_achievement();

-- =============================================
-- RLS Policies: Güvenlik kuralları
-- =============================================

-- Whisky Photos RLS
ALTER TABLE whisky_photos ENABLE ROW LEVEL SECURITY;

-- Herkes onaylanmış fotoğrafları görebilir
CREATE POLICY "Anyone can view approved photos" ON whisky_photos
    FOR SELECT USING (is_approved = true);

-- Kullanıcılar kendi fotoğraflarını görebilir (onaylanmamış dahil)
CREATE POLICY "Users can view own photos" ON whisky_photos
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi fotoğraflarını yükleyebilir
CREATE POLICY "Users can upload own photos" ON whisky_photos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi fotoğraflarını güncelleyebilir
CREATE POLICY "Users can update own photos" ON whisky_photos
    FOR UPDATE USING (auth.uid() = user_id);

-- Kullanıcılar kendi fotoğraflarını silebilir
CREATE POLICY "Users can delete own photos" ON whisky_photos
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Indexes: Performans optimizasyonu
-- =============================================

CREATE INDEX IF NOT EXISTS idx_whisky_photos_user_id ON whisky_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_whisky_photos_whisky_id ON whisky_photos(whisky_id);
CREATE INDEX IF NOT EXISTS idx_whisky_photos_approved ON whisky_photos(is_approved);
CREATE INDEX IF NOT EXISTS idx_whisky_photos_primary ON whisky_photos(is_primary);
CREATE INDEX IF NOT EXISTS idx_whisky_photos_upload_date ON whisky_photos(upload_date DESC);

-- =============================================
-- Views: Kullanışlı sorgular
-- =============================================

-- User Photo Stats View
CREATE OR REPLACE VIEW user_photo_stats AS
SELECT
    user_id,
    COUNT(*) as total_photos,
    COUNT(*) FILTER (WHERE is_approved = true) as approved_photos,
    COUNT(*) FILTER (WHERE is_primary = true) as primary_photos,
    MIN(upload_date) as first_photo_date,
    MAX(upload_date) as last_photo_date
FROM whisky_photos
GROUP BY user_id;

-- Whisky Photo Gallery View
CREATE OR REPLACE VIEW whisky_photo_gallery AS
SELECT
    wp.id,
    wp.whisky_id,
    wp.photo_url,
    wp.file_name,
    wp.upload_date,
    wp.is_primary,
    wp.description,
    p.full_name as photographer_name,
    p.avatar_url as photographer_avatar
FROM whisky_photos wp
LEFT JOIN profiles p ON wp.user_id = p.id
WHERE wp.is_approved = true
ORDER BY wp.is_primary DESC, wp.upload_date DESC;