-- =============================================
-- WhiskyVerse Gamification System Database Schema
-- =============================================

-- User Progress Table: Kullanıcı aktivite verilerini tutar
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    whiskies_added INTEGER DEFAULT 0,
    photos_taken INTEGER DEFAULT 0,
    shares_made INTEGER DEFAULT 0,
    locations_visited INTEGER DEFAULT 0,
    ratings_made INTEGER DEFAULT 0,
    account_created INTEGER DEFAULT 1, -- Hesap oluşturma (her zaman 1)
    daily_login INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0, -- En uzun seri
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Her kullanıcı için tek kayıt
    UNIQUE(user_id)
);

-- User Achievements Table: Kazanılmış başarımları tutar
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id VARCHAR(100) NOT NULL, -- achievement.ts'deki ID
    achievement_title VARCHAR(200) NOT NULL,
    achievement_description TEXT,
    achievement_icon VARCHAR(10),
    achievement_category VARCHAR(50),
    achievement_rarity VARCHAR(20),
    points INTEGER NOT NULL DEFAULT 0,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Aynı başarım birden fazla kez kazanılamaz
    UNIQUE(user_id, achievement_id)
);

-- User Statistics View: Kullanıcı istatistiklerini görüntülemek için
CREATE OR REPLACE VIEW user_statistics AS
SELECT
    up.user_id,
    up.whiskies_added,
    up.photos_taken,
    up.shares_made,
    up.locations_visited,
    up.ratings_made,
    up.daily_login,
    up.current_streak,
    up.max_streak,
    up.last_login,
    COALESCE(achievement_stats.total_achievements, 0) as total_achievements,
    COALESCE(achievement_stats.total_points, 0) as total_points,
    CASE
        WHEN COALESCE(achievement_stats.total_points, 0) < 100 THEN 1
        WHEN COALESCE(achievement_stats.total_points, 0) < 300 THEN 2
        WHEN COALESCE(achievement_stats.total_points, 0) < 600 THEN 3
        WHEN COALESCE(achievement_stats.total_points, 0) < 1000 THEN 4
        WHEN COALESCE(achievement_stats.total_points, 0) < 1500 THEN 5
        WHEN COALESCE(achievement_stats.total_points, 0) < 2500 THEN 6
        WHEN COALESCE(achievement_stats.total_points, 0) < 4000 THEN 7
        WHEN COALESCE(achievement_stats.total_points, 0) < 6000 THEN 8
        WHEN COALESCE(achievement_stats.total_points, 0) < 9000 THEN 9
        ELSE 10
    END as level,
    CASE
        WHEN COALESCE(achievement_stats.total_points, 0) < 100 THEN 100
        WHEN COALESCE(achievement_stats.total_points, 0) < 300 THEN 300
        WHEN COALESCE(achievement_stats.total_points, 0) < 600 THEN 600
        WHEN COALESCE(achievement_stats.total_points, 0) < 1000 THEN 1000
        WHEN COALESCE(achievement_stats.total_points, 0) < 1500 THEN 1500
        WHEN COALESCE(achievement_stats.total_points, 0) < 2500 THEN 2500
        WHEN COALESCE(achievement_stats.total_points, 0) < 4000 THEN 4000
        WHEN COALESCE(achievement_stats.total_points, 0) < 6000 THEN 6000
        WHEN COALESCE(achievement_stats.total_points, 0) < 9000 THEN 9000
        ELSE 15000
    END as next_level_points
FROM user_progress up
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*) as total_achievements,
        SUM(points) as total_points
    FROM user_achievements
    GROUP BY user_id
) achievement_stats ON up.user_id = achievement_stats.user_id;

-- Achievement Leaderboard View: Liderlik tablosu
CREATE OR REPLACE VIEW achievement_leaderboard AS
SELECT
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    us.level,
    us.total_points,
    us.total_achievements,
    us.current_streak,
    us.max_streak,
    ROW_NUMBER() OVER (ORDER BY us.total_points DESC) as rank
FROM profiles p
INNER JOIN user_statistics us ON p.id = us.user_id
ORDER BY us.total_points DESC;

-- =============================================
-- Functions: Gamification işlevleri
-- =============================================

-- Function: Kullanıcı progress'ini başlat
CREATE OR REPLACE FUNCTION initialize_user_progress(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_progress (user_id, account_created, last_login)
    VALUES (p_user_id, 1, NOW())
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Aktivite güncellemesi
CREATE OR REPLACE FUNCTION update_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(50),
    p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    -- User progress kaydını oluştur (yoksa)
    INSERT INTO user_progress (user_id, account_created)
    VALUES (p_user_id, 1)
    ON CONFLICT (user_id) DO NOTHING;

    -- Aktiviteye göre ilgili alanı güncelle
    CASE p_activity_type
        WHEN 'whisky_added' THEN
            UPDATE user_progress
            SET whiskies_added = whiskies_added + p_increment,
                updated_at = NOW()
            WHERE user_id = p_user_id;
        WHEN 'photo_taken' THEN
            UPDATE user_progress
            SET photos_taken = photos_taken + p_increment,
                updated_at = NOW()
            WHERE user_id = p_user_id;
        WHEN 'share_made' THEN
            UPDATE user_progress
            SET shares_made = shares_made + p_increment,
                updated_at = NOW()
            WHERE user_id = p_user_id;
        WHEN 'location_visited' THEN
            UPDATE user_progress
            SET locations_visited = locations_visited + p_increment,
                updated_at = NOW()
            WHERE user_id = p_user_id;
        WHEN 'rating_made' THEN
            UPDATE user_progress
            SET ratings_made = ratings_made + p_increment,
                updated_at = NOW()
            WHERE user_id = p_user_id;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Günlük giriş kaydı
CREATE OR REPLACE FUNCTION record_daily_login(p_user_id UUID)
RETURNS INTEGER AS $$ -- Yeni streak değerini döndürür
DECLARE
    v_last_login DATE;
    v_current_streak INTEGER;
    v_new_streak INTEGER;
BEGIN
    -- Mevcut streak ve son giriş tarihini al
    SELECT DATE(last_login), current_streak
    INTO v_last_login, v_current_streak
    FROM user_progress
    WHERE user_id = p_user_id;

    -- User progress kaydını oluştur (yoksa)
    IF v_last_login IS NULL THEN
        INSERT INTO user_progress (user_id, account_created, daily_login, current_streak, last_login)
        VALUES (p_user_id, 1, 1, 1, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            daily_login = daily_login + 1,
            current_streak = 1,
            last_login = NOW(),
            updated_at = NOW();
        RETURN 1;
    END IF;

    -- Bugün zaten giriş yapılmışsa hiçbir şey yapma
    IF v_last_login = CURRENT_DATE THEN
        RETURN v_current_streak;
    END IF;

    -- Streak hesaplama
    IF v_last_login = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Dün giriş yapılmış, streak devam ediyor
        v_new_streak := v_current_streak + 1;
    ELSE
        -- Streak kırılmış, yeniden başla
        v_new_streak := 1;
    END IF;

    -- Progress güncelle
    UPDATE user_progress
    SET daily_login = daily_login + 1,
        current_streak = v_new_streak,
        max_streak = GREATEST(max_streak, v_new_streak),
        last_login = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN v_new_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Başarım ekleme
CREATE OR REPLACE FUNCTION add_achievement(
    p_user_id UUID,
    p_achievement_id VARCHAR(100),
    p_title VARCHAR(200),
    p_description TEXT,
    p_icon VARCHAR(10),
    p_category VARCHAR(50),
    p_rarity VARCHAR(20),
    p_points INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO user_achievements (
        user_id, achievement_id, achievement_title, achievement_description,
        achievement_icon, achievement_category, achievement_rarity, points
    )
    VALUES (
        p_user_id, p_achievement_id, p_title, p_description,
        p_icon, p_category, p_rarity, p_points
    )
    ON CONFLICT (user_id, achievement_id) DO NOTHING;

    -- Başarım eklendiyse true, zaten varsa false döndür
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Triggers: Otomatik işlemler
-- =============================================

-- Trigger: Yeni kullanıcı kaydında progress başlat
CREATE OR REPLACE FUNCTION trigger_initialize_user_progress()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM initialize_user_progress(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_initialize_user_progress();

-- =============================================
-- RLS Policies: Güvenlik kuralları
-- =============================================

-- User Progress RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi progress'lerini görüp güncelleyebilir
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Achievements RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi başarımlarını görebilir
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Başarımları silme yasak (sadece kazanma var)
CREATE POLICY "Achievements cannot be deleted" ON user_achievements
    FOR DELETE USING (false);

-- =============================================
-- Indexes: Performans optimizasyonu
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);
CREATE INDEX IF NOT EXISTS idx_achievement_leaderboard_points ON user_achievements(points DESC);

-- =============================================
-- Sample Data: Test verileri
-- =============================================

-- Bu komut test için - production'da kullanılmayacak
/*
-- Test kullanıcı progress verisi ekle
INSERT INTO user_progress (user_id, whiskies_added, photos_taken, shares_made, daily_login, current_streak)
SELECT
    p.id,
    FLOOR(RANDOM() * 20) + 1, -- 1-20 viski
    FLOOR(RANDOM() * 10) + 1, -- 1-10 fotoğraf
    FLOOR(RANDOM() * 5) + 1,  -- 1-5 paylaşım
    FLOOR(RANDOM() * 30) + 1, -- 1-30 gün
    FLOOR(RANDOM() * 7) + 1   -- 1-7 streak
FROM profiles p
ON CONFLICT (user_id) DO NOTHING;
*/