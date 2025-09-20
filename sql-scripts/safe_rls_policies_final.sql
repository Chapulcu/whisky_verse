-- ================================
-- SAFE RLS POLICIES - FINAL VERSION
-- ================================
-- Bu script, mevcut tablo yapısına uygun ve hatasız RLS politikaları uygular

BEGIN;

-- Önce tüm eski politikaları temizle
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                       r.policyname, r.schemaname, r.tablename);
    END LOOP;

    RAISE NOTICE 'All existing RLS policies dropped';
END
$$;

-- Helper functions'ları da temizle
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_vip_or_admin();
DROP FUNCTION IF EXISTS is_authenticated();
DROP FUNCTION IF EXISTS is_admin_email();

-- ================================
-- PROFILES TABLE - NO RECURSION
-- ================================

-- Kullanıcılar kendi profilini görebilir
CREATE POLICY "profile_select_own" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Hardcoded admin emails için profiles erişimi
CREATE POLICY "profile_select_admin" ON profiles
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- Profile oluşturma (signup sırasında)
CREATE POLICY "profile_insert_own" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Kendi profilini güncelleme
CREATE POLICY "profile_update_own" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin profil güncelleme
CREATE POLICY "profile_update_admin" ON profiles
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- Admin profil silme
CREATE POLICY "profile_delete_admin" ON profiles
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
        AND auth.uid() != id  -- Admin kendi profilini silemez
    );

-- ================================
-- WHISKIES TABLE
-- ================================

-- Herkes viski listesini görebilir
CREATE POLICY "whisky_select_all" ON whiskies
    FOR SELECT
    USING (true);

-- Authenticated kullanıcılar viski ekleyebilir
CREATE POLICY "whisky_insert_auth" ON whiskies
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Kendi eklediği viskiyi güncelleme
CREATE POLICY "whisky_update_own" ON whiskies
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Admin tüm viskileri güncelleyebilir
CREATE POLICY "whisky_update_admin" ON whiskies
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- Kendi eklediği viskiyi silme
CREATE POLICY "whisky_delete_own" ON whiskies
    FOR DELETE
    USING (created_by = auth.uid());

-- Admin tüm viskileri silebilir
CREATE POLICY "whisky_delete_admin" ON whiskies
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- ================================
-- USER_WHISKIES TABLE
-- ================================

-- Kendi koleksiyonunu görme
CREATE POLICY "collection_select_own" ON user_whiskies
    FOR SELECT
    USING (user_id = auth.uid());

-- Admin tüm koleksiyonları görebilir
CREATE POLICY "collection_select_admin" ON user_whiskies
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- Kendi koleksiyonuna ekleme
CREATE POLICY "collection_insert_own" ON user_whiskies
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Kendi koleksiyonunu güncelleme
CREATE POLICY "collection_update_own" ON user_whiskies
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Kendi koleksiyonundan çıkarma
CREATE POLICY "collection_delete_own" ON user_whiskies
    FOR DELETE
    USING (user_id = auth.uid());

-- ================================
-- GROUPS TABLE - SAFE VERSION
-- ================================

-- Grupları herkes görebilir (is_active kontrolü olmadan)
CREATE POLICY "groups_select_all" ON groups
    FOR SELECT
    USING (true);

-- Admin tüm grupları görebilir
CREATE POLICY "groups_select_admin" ON groups
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- Authenticated kullanıcılar grup oluşturabilir
CREATE POLICY "groups_insert_auth" ON groups
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Grup sahibi güncelleme yapabilir
CREATE POLICY "groups_update_owner" ON groups
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Admin grup güncelleme
CREATE POLICY "groups_update_admin" ON groups
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- Grup sahibi silme yapabilir
CREATE POLICY "groups_delete_owner" ON groups
    FOR DELETE
    USING (created_by = auth.uid());

-- Admin grup silme
CREATE POLICY "groups_delete_admin" ON groups
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- ================================
-- GROUP_MEMBERS TABLE
-- ================================

-- Grup üyeleri herkes görebilir
CREATE POLICY "group_members_select_all" ON group_members
    FOR SELECT
    USING (true);

-- Kendini gruba ekleme
CREATE POLICY "group_members_insert_self" ON group_members
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Kendi üyeliğini güncelleme
CREATE POLICY "group_members_update_self" ON group_members
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admin grup üyeliklerini yönetebilir
CREATE POLICY "group_members_update_admin" ON group_members
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- Kendini gruptan çıkarma
CREATE POLICY "group_members_delete_self" ON group_members
    FOR DELETE
    USING (user_id = auth.uid());

-- Admin grup üyeliği silme
CREATE POLICY "group_members_delete_admin" ON group_members
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- ================================
-- EVENTS TABLE - SAFE VERSION
-- ================================

-- Etkinlikleri herkes görebilir (is_active kontrolü olmadan)
CREATE POLICY "events_select_all" ON events
    FOR SELECT
    USING (true);

-- Admin tüm etkinlikleri görebilir
CREATE POLICY "events_select_admin" ON events
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- Authenticated kullanıcılar etkinlik oluşturabilir
CREATE POLICY "events_insert_auth" ON events
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Etkinlik sahibi güncelleme yapabilir
CREATE POLICY "events_update_owner" ON events
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Admin etkinlik güncelleme
CREATE POLICY "events_update_admin" ON events
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- Etkinlik sahibi silme yapabilir
CREATE POLICY "events_delete_owner" ON events
    FOR DELETE
    USING (created_by = auth.uid());

-- Admin etkinlik silme
CREATE POLICY "events_delete_admin" ON events
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- ================================
-- EVENT_PARTICIPANTS TABLE
-- ================================

-- Etkinlik katılımcıları herkes görebilir
CREATE POLICY "event_participants_select_all" ON event_participants
    FOR SELECT
    USING (true);

-- Kendini etkinliğe kaydetme
CREATE POLICY "event_participants_insert_self" ON event_participants
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Kendi katılımını güncelleme
CREATE POLICY "event_participants_update_self" ON event_participants
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admin katılımcı yönetimi
CREATE POLICY "event_participants_update_admin" ON event_participants
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- Kendi kaydını iptal etme
CREATE POLICY "event_participants_delete_self" ON event_participants
    FOR DELETE
    USING (user_id = auth.uid());

-- Admin katılımcı silme
CREATE POLICY "event_participants_delete_admin" ON event_participants
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            'admin@whiskyverse.com',
            'akhantalip@gmail.com'
        )
    );

-- ================================
-- HELPER FUNCTIONS (AFTER POLICIES)
-- ================================

-- Admin kontrol fonksiyonu (policies'den sonra tanımla)
CREATE OR REPLACE FUNCTION is_admin_email()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT auth.jwt() ->> 'email' IN (
        'admin@whiskyverse.com',
        'akhantalip@gmail.com'
    );
$$;

-- Authenticated kontrol fonksiyonu
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT auth.uid() IS NOT NULL;
$$;

COMMIT;

-- ================================
-- VERIFICATION
-- ================================

DO $$
DECLARE
    policy_count INTEGER;
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';

    SELECT COUNT(DISTINCT tablename) INTO table_count
    FROM pg_policies
    WHERE schemaname = 'public';

    RAISE NOTICE 'Total RLS policies created: %', policy_count;
    RAISE NOTICE 'Tables with RLS policies: %', table_count;
    RAISE NOTICE 'Safe RLS policies applied successfully!';
END
$$;

-- ================================
-- USAGE NOTES
-- ================================

/*
SAFE RLS FEATURES:
✅ No infinite recursion - admin check uses auth.jwt() directly
✅ No is_active column dependency - removed condition
✅ No OLD keyword usage - avoided UPDATE trigger conflicts
✅ Hardcoded admin emails for security
✅ Simple and reliable policy structure

ADMIN USERS:
- admin@whiskyverse.com
- akhantalip@gmail.com

SECURITY MODEL:
- Users can only access their own data
- Public data (whiskies, groups, events) visible to all
- Admin override for all operations
- No circular dependencies

POST-APPLICATION TESTS:
1. node tests/apply_simple_rls.cjs
2. node tests/test_new_rls_policies.cjs
3. Test application in browser
*/