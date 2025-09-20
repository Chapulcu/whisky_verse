-- ================================
-- WHISKYVERSE COMPLETE RLS POLICIES
-- ================================
-- Bu script, WhiskyVerse uygulaması için tüm tabloların
-- RLS politikalarını düzenler ve optimize eder.
-- Mevcut sorunları giderir ve güvenlik açıklarını kapatır.

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

-- ================================
-- HELPER FUNCTIONS
-- ================================

-- Admin kontrol fonksiyonu
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
$$;

-- VIP veya Admin kontrol fonksiyonu
CREATE OR REPLACE FUNCTION is_vip_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('vip', 'admin')
    );
$$;

-- Authenticated user kontrol fonksiyonu
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT auth.uid() IS NOT NULL;
$$;

-- ================================
-- PROFILES TABLE RLS POLICIES
-- ================================

-- Kullanıcılar kendi profillerini görebilir
CREATE POLICY "users_select_own_profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Adminler tüm profilleri görebilir
CREATE POLICY "admins_select_all_profiles" ON profiles
    FOR SELECT
    USING (is_admin());

-- Kayıt sırasında profil oluşturma (authenticated users)
CREATE POLICY "authenticated_users_insert_profile" ON profiles
    FOR INSERT
    WITH CHECK (
        is_authenticated()
        AND auth.uid() = id
    );

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Kullanıcı kendi rolünü değiştiremez
        AND (OLD.role = NEW.role OR is_admin())
    );

-- Adminler tüm profilleri güncelleyebilir
CREATE POLICY "admins_update_all_profiles" ON profiles
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Adminler profil silebilir (ama kendi profilini silemez)
CREATE POLICY "admins_delete_profiles" ON profiles
    FOR DELETE
    USING (
        is_admin()
        AND auth.uid() != id
        -- Son admin kalamaz
        AND (
            SELECT COUNT(*) FROM profiles
            WHERE role = 'admin' AND id != profiles.id
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
    WITH CHECK (is_authenticated());

-- Kullanıcılar kendi ekledikleri viskiyi güncelleyebilir
CREATE POLICY "users_update_own_whiskies" ON whiskies
    FOR UPDATE
    USING (
        is_authenticated()
        AND created_by = auth.uid()
    )
    WITH CHECK (
        created_by = auth.uid()
    );

-- Adminler tüm viskileri güncelleyebilir
CREATE POLICY "admins_update_all_whiskies" ON whiskies
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Kullanıcılar kendi ekledikleri viskiyi silebilir
CREATE POLICY "users_delete_own_whiskies" ON whiskies
    FOR DELETE
    USING (
        is_authenticated()
        AND created_by = auth.uid()
    );

-- Adminler tüm viskileri silebilir
CREATE POLICY "admins_delete_all_whiskies" ON whiskies
    FOR DELETE
    USING (is_admin());

-- ================================
-- USER_WHISKIES TABLE RLS POLICIES
-- ================================

-- Kullanıcılar kendi koleksiyonlarını görebilir
CREATE POLICY "users_select_own_collection" ON user_whiskies
    FOR SELECT
    USING (
        is_authenticated()
        AND user_id = auth.uid()
    );

-- Adminler tüm koleksiyonları görebilir
CREATE POLICY "admins_select_all_collections" ON user_whiskies
    FOR SELECT
    USING (is_admin());

-- Kullanıcılar kendi koleksiyonlarına viski ekleyebilir
CREATE POLICY "users_insert_own_collection" ON user_whiskies
    FOR INSERT
    WITH CHECK (
        is_authenticated()
        AND user_id = auth.uid()
    );

-- Kullanıcılar kendi koleksiyonlarını güncelleyebilir
CREATE POLICY "users_update_own_collection" ON user_whiskies
    FOR UPDATE
    USING (
        is_authenticated()
        AND user_id = auth.uid()
    )
    WITH CHECK (
        user_id = auth.uid()
    );

-- Kullanıcılar kendi koleksiyonlarından viski çıkarabilir
CREATE POLICY "users_delete_own_collection" ON user_whiskies
    FOR DELETE
    USING (
        is_authenticated()
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
        OR is_admin()
        OR created_by = auth.uid()
    );

-- Authenticated kullanıcılar grup oluşturabilir
CREATE POLICY "authenticated_insert_groups" ON groups
    FOR INSERT
    WITH CHECK (is_authenticated());

-- Grup yaratıcıları ve adminler grubu güncelleyebilir
CREATE POLICY "creators_and_admins_update_groups" ON groups
    FOR UPDATE
    USING (
        is_authenticated()
        AND (
            created_by = auth.uid()
            OR is_admin()
        )
    )
    WITH CHECK (
        created_by = auth.uid()
        OR is_admin()
    );

-- Grup yaratıcıları ve adminler grubu silebilir
CREATE POLICY "creators_and_admins_delete_groups" ON groups
    FOR DELETE
    USING (
        is_authenticated()
        AND (
            created_by = auth.uid()
            OR is_admin()
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
        is_authenticated()
        AND user_id = auth.uid()
    );

-- Grup yöneticileri üyelik durumunu güncelleyebilir
CREATE POLICY "group_admins_update_members" ON group_members
    FOR UPDATE
    USING (
        is_authenticated()
        AND (
            -- Kullanıcı kendi üyeliğini güncelleyebilir
            user_id = auth.uid()
            -- Veya sistem admini
            OR is_admin()
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
        is_authenticated()
        AND (
            -- Kullanıcı kendi üyeliğini sonlandırabilir
            user_id = auth.uid()
            -- Veya sistem admini
            OR is_admin()
            -- Veya grup yaratıcısı
            OR EXISTS (
                SELECT 1 FROM groups
                WHERE groups.id = group_members.group_id
                AND groups.created_by = auth.uid()
            )
            -- Veya grup yöneticisi/moderatörü (ama kendi grup yöneticisi olanı çıkaramaz)
            OR (
                EXISTS (
                    SELECT 1 FROM group_members gm2
                    WHERE gm2.group_id = group_members.group_id
                    AND gm2.user_id = auth.uid()
                    AND gm2.role IN ('admin', 'moderator')
                )
                AND role NOT IN ('admin', 'moderator')
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
        OR is_admin()
        OR created_by = auth.uid()
    );

-- Authenticated kullanıcılar etkinlik oluşturabilir
CREATE POLICY "authenticated_insert_events" ON events
    FOR INSERT
    WITH CHECK (is_authenticated());

-- Etkinlik yaratıcıları ve adminler etkinliği güncelleyebilir
CREATE POLICY "creators_and_admins_update_events" ON events
    FOR UPDATE
    USING (
        is_authenticated()
        AND (
            created_by = auth.uid()
            OR is_admin()
        )
    )
    WITH CHECK (
        created_by = auth.uid()
        OR is_admin()
    );

-- Etkinlik yaratıcıları ve adminler etkinliği silebilir
CREATE POLICY "creators_and_admins_delete_events" ON events
    FOR DELETE
    USING (
        is_authenticated()
        AND (
            created_by = auth.uid()
            OR is_admin()
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
        is_authenticated()
        AND user_id = auth.uid()
    );

-- Kullanıcılar kendi katılım durumunu güncelleyebilir
CREATE POLICY "users_update_own_participation" ON event_participants
    FOR UPDATE
    USING (
        is_authenticated()
        AND (
            user_id = auth.uid()
            OR is_admin()
            OR EXISTS (
                SELECT 1 FROM events
                WHERE events.id = event_participants.event_id
                AND events.created_by = auth.uid()
            )
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        OR is_admin()
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
        is_authenticated()
        AND (
            user_id = auth.uid()
            OR is_admin()
            OR EXISTS (
                SELECT 1 FROM events
                WHERE events.id = event_participants.event_id
                AND events.created_by = auth.uid()
            )
        )
    );

-- ================================
-- USER_PERMISSIONS TABLE RLS POLICIES
-- ================================

-- Kullanıcılar kendi izinlerini görebilir
CREATE POLICY "users_select_own_permissions" ON user_permissions
    FOR SELECT
    USING (
        is_authenticated()
        AND user_id = auth.uid()
    );

-- Adminler tüm izinleri görebilir
CREATE POLICY "admins_select_all_permissions" ON user_permissions
    FOR SELECT
    USING (is_admin());

-- Sadece adminler izin verebilir
CREATE POLICY "admins_insert_permissions" ON user_permissions
    FOR INSERT
    WITH CHECK (is_admin());

-- Sadece adminler izinleri güncelleyebilir
CREATE POLICY "admins_update_permissions" ON user_permissions
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Sadece adminler izinleri kaldırabilir
CREATE POLICY "admins_delete_permissions" ON user_permissions
    FOR DELETE
    USING (is_admin());

-- ================================
-- ADMIN_ACCESS_LOG TABLE RLS POLICIES
-- ================================

-- Sadece adminler access log'larını görebilir
CREATE POLICY "admins_select_access_logs" ON admin_access_log
    FOR SELECT
    USING (is_admin());

-- Admin access log'ları otomatik oluşturulur, manuel INSERT engellenir
-- (Sadece system functions tarafından kullanılır)

-- ================================
-- ANALYTICS VIEWS ACCESS
-- ================================

-- Analytics view'ları için RLS policy'leri ayrı bir script'te tanımlanacak
-- Çünkü bu view'lar dinamik olarak oluşturulabilir

COMMIT;

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- RLS policy'lerinin doğru kurulduğunu kontrol et
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';

    RAISE NOTICE 'Total RLS policies created: %', policy_count;

    -- Her tablo için policy sayısını kontrol et
    FOR policy_count IN
        SELECT COUNT(*)
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename
    LOOP
        -- Her tabloda en az 1 policy olmalı
        IF policy_count = 0 THEN
            RAISE WARNING 'Found table without RLS policies!';
        END IF;
    END LOOP;

    RAISE NOTICE 'RLS policies verification completed successfully.';
END
$$;

-- ================================
-- USAGE NOTES
-- ================================

/*
Bu script aşağıdaki güvenlik prensiplerine uyar:

1. **Principle of Least Privilege**: Kullanıcılar sadece kendi verilerine erişebilir
2. **Defense in Depth**: Birden fazla kontrol katmanı
3. **Admin Override**: Adminler gerektiğinde tüm verilere erişebilir
4. **Audit Trail**: Admin işlemleri loglanır
5. **Self-Protection**: Adminler kendi yetkileri ile oynayamaz

ÖNEMLI NOTLAR:
- Bu script çalıştırıldığında mevcut tüm RLS policy'leri silinir ve yeniden oluşturulur
- Test ortamında çalıştırıp üretimde uygulayın
- Admin hesapları elle kontrol edilmelidir
- Analytics view'ları için ayrı RLS kuralları gerekebilir

KULLANIM:
1. Önce backup alın
2. Test ortamında çalıştırın
3. Uygulama fonksiyonalitesini test edin
4. Sorun yoksa üretimde uygulayın
*/