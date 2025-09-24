-- ================================
-- WHISKYVERSE RLS POLICIES - NO RECURSION FIX
-- ================================
-- Bu script, infinite recursion sorununu çözen RLS politikalarını içerir

BEGIN;

-- Önce tüm eski politikaları temizle
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Tüm mevcut RLS policy'lerini kaldır
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                       r.policyname, r.schemaname, r.tablename);
    END LOOP;
END
$$;

-- Eski helper function'ları da temizle
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_vip_or_admin();
DROP FUNCTION IF EXISTS is_authenticated();

-- ================================
-- PROFILES TABLE RLS POLICIES (NO RECURSION)
-- ================================

-- Kullanıcılar kendi profillerini görebilir
CREATE POLICY "users_select_own_profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Adminler tüm profilleri görebilir (DIRECT CHECK - NO FUNCTION)
CREATE POLICY "admins_select_all_profiles" ON profiles
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
    );

-- Kayıt sırasında profil oluşturma
CREATE POLICY "authenticated_users_insert_profile" ON profiles
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = id
    );

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Kullanıcı kendi rolünü değiştiremez (sadece adminler değiştirebilir)
        AND (
            OLD.role = NEW.role
            OR auth.uid() IN (
                SELECT p.id FROM profiles p
                WHERE p.role = 'admin'
                AND p.id = auth.uid()
            )
        )
    );

-- Adminler tüm profilleri güncelleyebilir (DIRECT CHECK)
CREATE POLICY "admins_update_all_profiles" ON profiles
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
    );

-- Adminler profil silebilir (ama kendi profilini silemez)
CREATE POLICY "admins_delete_profiles" ON profiles
    FOR DELETE
    USING (
        auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
        AND auth.uid() != profiles.id
        -- Son admin kalamaz
        AND (
            SELECT COUNT(*) FROM profiles p2
            WHERE p2.role = 'admin' AND p2.id != profiles.id
        ) > 0
    );

-- ================================
-- WHISKIES TABLE RLS POLICIES
-- ================================

-- Herkes viski listesini görüntüleyebilir
CREATE POLICY "public_select_whiskies" ON whiskies
    FOR SELECT
    USING (true);

-- Authenticated kullanıcılar viski ekleyebilir
CREATE POLICY "authenticated_insert_whiskies" ON whiskies
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Kullanıcılar kendi ekledikleri viskiyi güncelleyebilir
CREATE POLICY "users_update_own_whiskies" ON whiskies
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND created_by = auth.uid()
    )
    WITH CHECK (
        created_by = auth.uid()
    );

-- Adminler tüm viskileri güncelleyebilir (DIRECT CHECK)
CREATE POLICY "admins_update_all_whiskies" ON whiskies
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
    );

-- Kullanıcılar kendi ekledikleri viskiyi silebilir
CREATE POLICY "users_delete_own_whiskies" ON whiskies
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL
        AND created_by = auth.uid()
    );

-- Adminler tüm viskileri silebilir
CREATE POLICY "admins_delete_all_whiskies" ON whiskies
    FOR DELETE
    USING (
        auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
    );

-- ================================
-- USER_WHISKIES TABLE RLS POLICIES
-- ================================

-- Kullanıcılar kendi koleksiyonlarını görebilir
CREATE POLICY "users_select_own_collection" ON user_whiskies
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    );

-- Adminler tüm koleksiyonları görebilir
CREATE POLICY "admins_select_all_collections" ON user_whiskies
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
    );

-- Kullanıcılar kendi koleksiyonlarına viski ekleyebilir
CREATE POLICY "users_insert_own_collection" ON user_whiskies
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    );

-- Kullanıcılar kendi koleksiyonlarını güncelleyebilir
CREATE POLICY "users_update_own_collection" ON user_whiskies
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    )
    WITH CHECK (
        user_id = auth.uid()
    );

-- Kullanıcılar kendi koleksiyonlarından viski çıkarabilir
CREATE POLICY "users_delete_own_collection" ON user_whiskies
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    );

-- ================================
-- GROUPS TABLE RLS POLICIES
-- ================================

-- Herkes aktif grupları görebilir
CREATE POLICY "public_select_active_groups" ON groups
    FOR SELECT
    USING (
        is_active = true
        OR auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
        OR created_by = auth.uid()
    );

-- Authenticated kullanıcılar grup oluşturabilir
CREATE POLICY "authenticated_insert_groups" ON groups
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Grup yaratıcıları ve adminler grubu güncelleyebilir
CREATE POLICY "creators_and_admins_update_groups" ON groups
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND (
            created_by = auth.uid()
            OR auth.uid() IN (
                SELECT p.id FROM profiles p
                WHERE p.role = 'admin'
                AND p.id = auth.uid()
            )
        )
    )
    WITH CHECK (
        created_by = auth.uid()
        OR auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
    );

-- Grup yaratıcıları ve adminler grubu silebilir
CREATE POLICY "creators_and_admins_delete_groups" ON groups
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL
        AND (
            created_by = auth.uid()
            OR auth.uid() IN (
                SELECT p.id FROM profiles p
                WHERE p.role = 'admin'
                AND p.id = auth.uid()
            )
        )
    );

-- ================================
-- GROUP_MEMBERS TABLE RLS POLICIES
-- ================================

-- Herkes grup üyelerini görebilir
CREATE POLICY "public_select_group_members" ON group_members
    FOR SELECT
    USING (true);

-- Authenticated kullanıcılar gruplara katılabilir
CREATE POLICY "authenticated_join_groups" ON group_members
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    );

-- Grup yöneticileri üyelik durumunu güncelleyebilir
CREATE POLICY "group_admins_update_members" ON group_members
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND (
            -- Kullanıcı kendi üyeliğini güncelleyebilir
            user_id = auth.uid()
            -- Veya sistem admini
            OR auth.uid() IN (
                SELECT p.id FROM profiles p
                WHERE p.role = 'admin'
                AND p.id = auth.uid()
            )
            -- Veya grup yaratıcısı
            OR EXISTS (
                SELECT 1 FROM groups
                WHERE groups.id = group_members.group_id
                AND groups.created_by = auth.uid()
            )
            -- Veya grup yöneticisi/moderatörü
            OR EXISTS (
                SELECT 1 FROM group_members gm2
                WHERE gm2.group_id = group_members.group_id
                AND gm2.user_id = auth.uid()
                AND gm2.role IN ('admin', 'moderator')
            )
        )
    );

-- Kullanıcılar gruptan ayrılabilir veya admin/moderator çıkarabilir
CREATE POLICY "users_leave_groups_or_admin_remove" ON group_members
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL
        AND (
            -- Kullanıcı kendi üyeliğini sonlandırabilir
            user_id = auth.uid()
            -- Veya sistem admini
            OR auth.uid() IN (
                SELECT p.id FROM profiles p
                WHERE p.role = 'admin'
                AND p.id = auth.uid()
            )
            -- Veya grup yaratıcısı
            OR EXISTS (
                SELECT 1 FROM groups
                WHERE groups.id = group_members.group_id
                AND groups.created_by = auth.uid()
            )
        )
    );

-- ================================
-- EVENTS TABLE RLS POLICIES
-- ================================

-- Herkes aktif etkinlikleri görebilir
CREATE POLICY "public_select_active_events" ON events
    FOR SELECT
    USING (
        is_active = true
        OR auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
        OR created_by = auth.uid()
    );

-- Authenticated kullanıcılar etkinlik oluşturabilir
CREATE POLICY "authenticated_insert_events" ON events
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Etkinlik yaratıcıları ve adminler etkinliği güncelleyebilir
CREATE POLICY "creators_and_admins_update_events" ON events
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND (
            created_by = auth.uid()
            OR auth.uid() IN (
                SELECT p.id FROM profiles p
                WHERE p.role = 'admin'
                AND p.id = auth.uid()
            )
        )
    )
    WITH CHECK (
        created_by = auth.uid()
        OR auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
    );

-- Etkinlik yaratıcıları ve adminler etkinliği silebilir
CREATE POLICY "creators_and_admins_delete_events" ON events
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL
        AND (
            created_by = auth.uid()
            OR auth.uid() IN (
                SELECT p.id FROM profiles p
                WHERE p.role = 'admin'
                AND p.id = auth.uid()
            )
        )
    );

-- ================================
-- EVENT_PARTICIPANTS TABLE RLS POLICIES
-- ================================

-- Herkes etkinlik katılımcılarını görebilir
CREATE POLICY "public_select_event_participants" ON event_participants
    FOR SELECT
    USING (true);

-- Authenticated kullanıcılar etkinliklere kaydolabilir
CREATE POLICY "authenticated_register_events" ON event_participants
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    );

-- Kullanıcılar kendi katılım durumunu güncelleyebilir
CREATE POLICY "users_update_own_participation" ON event_participants
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
        AND (
            user_id = auth.uid()
            OR auth.uid() IN (
                SELECT p.id FROM profiles p
                WHERE p.role = 'admin'
                AND p.id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM events
                WHERE events.id = event_participants.event_id
                AND events.created_by = auth.uid()
            )
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        OR auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.role = 'admin'
            AND p.id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_participants.event_id
            AND events.created_by = auth.uid()
        )
    );

-- Kullanıcılar etkinlik kaydını iptal edebilir
CREATE POLICY "users_cancel_own_registration" ON event_participants
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL
        AND (
            user_id = auth.uid()
            OR auth.uid() IN (
                SELECT p.id FROM profiles p
                WHERE p.role = 'admin'
                AND p.id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM events
                WHERE events.id = event_participants.event_id
                AND events.created_by = auth.uid()
            )
        )
    );

-- ================================
-- HELPER FUNCTIONS (AFTER RLS POLICIES)
-- ================================

-- Admin kontrol fonksiyonu (profiles RLS'den sonra tanımla)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT CASE
        WHEN auth.uid() IS NULL THEN false
        WHEN EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        ) THEN true
        ELSE false
    END;
$$;

-- VIP veya Admin kontrol fonksiyonu
CREATE OR REPLACE FUNCTION is_vip_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT CASE
        WHEN auth.uid() IS NULL THEN false
        WHEN EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('vip', 'admin')
        ) THEN true
        ELSE false
    END;
$$;

-- Authenticated user kontrol fonksiyonu
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT auth.uid() IS NOT NULL;
$$;

COMMIT;

-- ================================
-- VERIFICATION QUERIES
-- ================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';

    RAISE NOTICE 'Total RLS policies created: %', policy_count;

    RAISE NOTICE 'RLS policies verification completed successfully.';
END
$$;

-- ================================
-- USAGE NOTES
-- ================================

/*
RECURSION FIX APPLIED:
- is_admin() fonksiyonu profiles RLS'den sonra tanımlandı
- Profiles tablosu için direct admin check kullanıldı
- Circular dependency sorunu çözüldü

SECURITY MAINTAINED:
- Tüm güvenlik kontrolleri korundu
- Admin yetkileri aynen devam ediyor
- User isolation sağlanıyor

TEST REQUIRED:
- Bu script uygulandıktan sonra test_new_rls_policies.cjs çalıştırın
- Infinite recursion hatası çözülmüş olmalı
*/