-- ================================
-- ANALYTICS VIEWS RLS POLICIES
-- ================================
-- Bu script, analytics view'ları için RLS politikalarını kurar
-- Analytics verilere sadece yetkili kullanıcılar erişebilir

BEGIN;

-- ================================
-- ANALYTICS ACCESS CONTROL FUNCTIONS
-- ================================

-- Analytics erişim kontrolü için gelişmiş fonksiyon
CREATE OR REPLACE FUNCTION has_analytics_access()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    -- Admin'ler her zaman erişebilir
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        ) THEN true
        -- Analytics permission'ı olan kullanıcılar erişebilir
        WHEN EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid()
            AND permission = 'analytics_access'
            AND (expires_at IS NULL OR expires_at > NOW())
        ) THEN true
        -- VIP kullanıcılar temel analytics'e erişebilir (opsiyonel)
        WHEN EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'vip'
        ) THEN true
        ELSE false
    END;
$$;

-- Analytics view'ları için seviye kontrolü
CREATE OR REPLACE FUNCTION has_advanced_analytics_access()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    -- Sadece admin'ler ve özel izni olanlar
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        ) THEN true
        WHEN EXISTS (
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid()
            AND permission = 'advanced_analytics_access'
            AND (expires_at IS NULL OR expires_at > NOW())
        ) THEN true
        ELSE false
    END;
$$;

-- ================================
-- ANALYTICS TABLES RLS
-- ================================

-- Analytics refresh log - sadece adminler
ALTER TABLE analytics_refresh_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_view_refresh_logs" ON analytics_refresh_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Analytics schedule - sadece adminler
ALTER TABLE analytics_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_view_schedule" ON analytics_schedule
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- ================================
-- MATERIALIZED VIEWS RLS
-- ================================

-- Collection aggregates - analytics yetkisi gerekli
ALTER MATERIALIZED VIEW collection_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_access_collection_aggregates" ON collection_aggregates
    FOR SELECT
    USING (has_analytics_access());

-- Top whiskies by collection - analytics yetkisi gerekli
ALTER MATERIALIZED VIEW top_whiskies_by_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_access_top_whiskies" ON top_whiskies_by_collection
    FOR SELECT
    USING (has_analytics_access());

-- Trends collection daily - ileri seviye analytics
ALTER MATERIALIZED VIEW trends_collection_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advanced_analytics_trends_daily" ON trends_collection_daily
    FOR SELECT
    USING (has_advanced_analytics_access());

-- Taste and rating stats - analytics yetkisi gerekli
ALTER MATERIALIZED VIEW taste_and_rating_stats_by_segment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_access_taste_rating_stats" ON taste_and_rating_stats_by_segment
    FOR SELECT
    USING (has_analytics_access());

-- Notes basic stats - temel analytics
ALTER MATERIALIZED VIEW notes_basic_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "basic_analytics_notes_stats" ON notes_basic_stats
    FOR SELECT
    USING (has_analytics_access());

-- ================================
-- DYNAMIC ANALYTICS VIEWS
-- ================================

-- Gelecekte oluşturulabilecek analytics view'ları için template
-- Bu fonksiyon, yeni view'lar oluşturulduğunda otomatik RLS kurar

CREATE OR REPLACE FUNCTION setup_analytics_view_rls(
    view_name TEXT,
    access_level TEXT DEFAULT 'basic' -- 'basic', 'advanced', 'admin'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    policy_name TEXT;
    access_function TEXT;
BEGIN
    -- View'un var olduğunu kontrol et
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_name = view_name
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_matviews
        WHERE matviewname = view_name
        AND schemaname = 'public'
    ) THEN
        RAISE EXCEPTION 'View % does not exist', view_name;
    END IF;

    -- Access level'a göre fonksiyon seç
    CASE access_level
        WHEN 'basic' THEN
            access_function := 'has_analytics_access()';
        WHEN 'advanced' THEN
            access_function := 'has_advanced_analytics_access()';
        WHEN 'admin' THEN
            access_function := 'is_admin()';
        ELSE
            RAISE EXCEPTION 'Invalid access level: %', access_level;
    END CASE;

    -- RLS'yi etkinleştir
    EXECUTE format('ALTER MATERIALIZED VIEW %I ENABLE ROW LEVEL SECURITY', view_name);

    -- Policy adını oluştur
    policy_name := access_level || '_access_' || view_name;

    -- Policy'yi oluştur
    EXECUTE format(
        'CREATE POLICY %I ON %I FOR SELECT USING (%s)',
        policy_name,
        view_name,
        access_function
    );

    RAISE NOTICE 'RLS setup completed for view: % with access level: %', view_name, access_level;
END;
$$;

-- ================================
-- VIEW SECURITY GRANTS
-- ================================

-- Analytics yetkisi olan rollere view erişimi ver
GRANT SELECT ON collection_aggregates TO whiskyverse_analytics_viewer;
GRANT SELECT ON top_whiskies_by_collection TO whiskyverse_analytics_viewer;
GRANT SELECT ON trends_collection_daily TO whiskyverse_analytics_viewer;
GRANT SELECT ON taste_and_rating_stats_by_segment TO whiskyverse_analytics_viewer;
GRANT SELECT ON notes_basic_stats TO whiskyverse_analytics_viewer;

-- Admin yetkisi olan rollere management tablolarına erişim
GRANT SELECT ON analytics_refresh_log TO whiskyverse_admin;
GRANT SELECT ON analytics_schedule TO whiskyverse_admin;

-- ================================
-- ANALYTICS FUNCTION SECURITY
-- ================================

-- Analytics refresh function'ı sadece adminler çalıştırabilir
REVOKE EXECUTE ON FUNCTION refresh_materialized_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_materialized_view(text) TO whiskyverse_admin;

REVOKE EXECUTE ON FUNCTION refresh_all_analytics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_all_analytics() TO whiskyverse_admin;

-- Setup function'ı sadece adminler kullanabilir
REVOKE EXECUTE ON FUNCTION setup_analytics_view_rls(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION setup_analytics_view_rls(text, text) TO whiskyverse_admin;

-- ================================
-- USAGE MONITORING
-- ================================

-- Analytics kullanım logları için tablo
CREATE TABLE IF NOT EXISTS analytics_usage_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    view_name TEXT NOT NULL,
    access_time TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    session_id TEXT
);

-- Usage log RLS
ALTER TABLE analytics_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_view_usage_logs" ON analytics_usage_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Analytics kullanım logları için trigger
CREATE OR REPLACE FUNCTION log_analytics_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Sadece SELECT işlemlerini logla
    IF TG_OP = 'SELECT' THEN
        INSERT INTO analytics_usage_log (
            user_id,
            view_name,
            access_time
        ) VALUES (
            auth.uid(),
            TG_TABLE_NAME,
            NOW()
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Log hatası analytics erişimini engellemesin
        RETURN COALESCE(NEW, OLD);
END;
$$;

-- ================================
-- SECURITY HARDENING
-- ================================

-- Analytics fonksiyonlarına güvenlik attribute'leri ekle
ALTER FUNCTION has_analytics_access() SET search_path = public, pg_temp;
ALTER FUNCTION has_advanced_analytics_access() SET search_path = public, pg_temp;
ALTER FUNCTION setup_analytics_view_rls(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION log_analytics_access() SET search_path = public, pg_temp;

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Analytics kullanım logları için indexler
CREATE INDEX IF NOT EXISTS idx_analytics_usage_log_user_id
    ON analytics_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_usage_log_view_name
    ON analytics_usage_log(view_name);
CREATE INDEX IF NOT EXISTS idx_analytics_usage_log_access_time
    ON analytics_usage_log(access_time DESC);

COMMIT;

-- ================================
-- VERIFICATION
-- ================================

DO $$
DECLARE
    view_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Analytics view'larının RLS'ye sahip olduğunu kontrol et
    SELECT COUNT(*) INTO view_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname IN (
        'collection_aggregates',
        'top_whiskies_by_collection',
        'trends_collection_daily',
        'taste_and_rating_stats_by_segment',
        'notes_basic_stats'
    )
    AND c.relrowsecurity = true;

    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
        'collection_aggregates',
        'top_whiskies_by_collection',
        'trends_collection_daily',
        'taste_and_rating_stats_by_segment',
        'notes_basic_stats',
        'analytics_refresh_log',
        'analytics_schedule',
        'analytics_usage_log'
    );

    RAISE NOTICE 'Analytics views with RLS enabled: %', view_count;
    RAISE NOTICE 'Analytics policies created: %', policy_count;

    IF view_count > 0 AND policy_count > 0 THEN
        RAISE NOTICE 'Analytics RLS setup completed successfully!';
    ELSE
        RAISE WARNING 'Analytics RLS setup may have issues. Check manually.';
    END IF;
END;
$$;

-- ================================
-- USAGE EXAMPLES
-- ================================

/*
-- Bir kullanıcıya analytics erişimi vermek için:
SELECT grant_analytics_access('user-uuid-here');

-- Gelişmiş analytics erişimi vermek için:
INSERT INTO user_permissions (user_id, permission, granted_by)
VALUES ('user-uuid', 'advanced_analytics_access', auth.uid());

-- Yeni analytics view için RLS kurmak:
SELECT setup_analytics_view_rls('new_analytics_view', 'basic');

-- Analytics kullanımını kontrol etmek:
SELECT * FROM analytics_usage_log WHERE user_id = 'user-uuid';
*/