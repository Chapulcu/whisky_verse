-- ======================================
-- ROLE-BASED RLS POLICIES (admin/vip/user)
-- Tables: whiskies, user_whiskies (collections), groups, events
-- Assumptions:
--  - user_whiskies.user_id tracks owner
--  - groups/events have created_by uuid column
--  - whiskies is a public catalog; only admin manages
--  - JWT claim role in {admin, vip, user}
-- ======================================

BEGIN;

-- Helper predicates (inline):
-- is_admin: auth_is_admin()
-- is_vip:   auth_is_vip()

-- =============
-- WHISKIES
-- =============
ALTER TABLE whiskies ENABLE ROW LEVEL SECURITY;

-- Read: public
DROP POLICY IF EXISTS whiskies_select_all ON whiskies;
CREATE POLICY whiskies_select_all ON whiskies
  FOR SELECT
  USING (true);

-- Manage: admin only
DROP POLICY IF EXISTS whiskies_admin_manage ON whiskies;
CREATE POLICY whiskies_admin_manage ON whiskies
  FOR ALL
  USING (auth_is_admin())
  WITH CHECK (auth_is_admin());

-- =============
-- USER COLLECTIONS (user_whiskies)
-- =============
ALTER TABLE user_whiskies ENABLE ROW LEVEL SECURITY;

-- Read: owner or admin
DROP POLICY IF EXISTS user_whiskies_select ON user_whiskies;
CREATE POLICY user_whiskies_select ON user_whiskies
  FOR SELECT
  USING (
    auth_is_admin()
    OR user_id = auth.uid()
  );

-- Insert: any authenticated user (for their own user_id)
DROP POLICY IF EXISTS user_whiskies_insert ON user_whiskies;
CREATE POLICY user_whiskies_insert ON user_whiskies
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- Update/Delete: owner or admin
DROP POLICY IF EXISTS user_whiskies_update ON user_whiskies;
CREATE POLICY user_whiskies_update ON user_whiskies
  FOR UPDATE
  USING (auth_is_admin() OR user_id = auth.uid())
  WITH CHECK (auth_is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS user_whiskies_delete ON user_whiskies;
CREATE POLICY user_whiskies_delete ON user_whiskies
  FOR DELETE
  USING (auth_is_admin() OR user_id = auth.uid());

-- =============
-- GROUPS
-- =============
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Read: public (veya authenticated). Burada public bırakıyoruz.
DROP POLICY IF EXISTS groups_select_all ON groups;
CREATE POLICY groups_select_all ON groups
  FOR SELECT
  USING (true);

-- Insert: vip veya admin
DROP POLICY IF EXISTS groups_insert_vip_or_admin ON groups;
CREATE POLICY groups_insert_vip_or_admin ON groups
  FOR INSERT
  WITH CHECK (auth_is_vip());

-- Update/Delete: owner veya admin
DROP POLICY IF EXISTS groups_owner_or_admin_upd ON groups;
CREATE POLICY groups_owner_or_admin_upd ON groups
  FOR UPDATE
  USING (auth_is_admin() OR created_by = auth.uid())
  WITH CHECK (auth_is_admin() OR created_by = auth.uid());

DROP POLICY IF EXISTS groups_owner_or_admin_del ON groups;
CREATE POLICY groups_owner_or_admin_del ON groups
  FOR DELETE
  USING (auth_is_admin() OR created_by = auth.uid());

-- =============
-- EVENTS
-- =============
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Read: public (veya authenticated). Burada public bırakıyoruz.
DROP POLICY IF EXISTS events_select_all ON events;
CREATE POLICY events_select_all ON events
  FOR SELECT
  USING (true);

-- Insert: vip veya admin
DROP POLICY IF EXISTS events_insert_vip_or_admin ON events;
CREATE POLICY events_insert_vip_or_admin ON events
  FOR INSERT
  WITH CHECK (auth_is_vip());

-- Update/Delete: owner veya admin
DROP POLICY IF EXISTS events_owner_or_admin_upd ON events;
CREATE POLICY events_owner_or_admin_upd ON events
  FOR UPDATE
  USING (auth_is_admin() OR created_by = auth.uid())
  WITH CHECK (auth_is_admin() OR created_by = auth.uid());

DROP POLICY IF EXISTS events_owner_or_admin_del ON events;
CREATE POLICY events_owner_or_admin_del ON events
  FOR DELETE
  USING (auth_is_admin() OR created_by = auth.uid());

COMMIT;

-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies
-- WHERE tablename IN ('whiskies','user_whiskies','groups','events')
-- ORDER BY schemaname, tablename, policyname;
