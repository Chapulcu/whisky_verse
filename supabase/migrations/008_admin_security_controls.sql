-- Admin-only database access controls with GRANT/REVOKE

-- Admin role için özel database role oluştur
CREATE ROLE whiskyverse_admin;
CREATE ROLE whiskyverse_analytics_viewer;
CREATE ROLE whiskyverse_data_manager;

-- Analytics view'lar için özel erişim
GRANT SELECT ON collection_aggregates TO whiskyverse_analytics_viewer;
GRANT SELECT ON top_whiskies_by_collection TO whiskyverse_analytics_viewer;
GRANT SELECT ON trends_collection_daily TO whiskyverse_analytics_viewer;
GRANT SELECT ON taste_and_rating_stats_by_segment TO whiskyverse_analytics_viewer;
GRANT SELECT ON notes_basic_stats TO whiskyverse_analytics_viewer;
GRANT SELECT ON analytics_refresh_log TO whiskyverse_analytics_viewer;
GRANT SELECT ON analytics_schedule TO whiskyverse_analytics_viewer;

-- Admin'ler analytics yönetim yetkisi
GRANT whiskyverse_analytics_viewer TO whiskyverse_admin;
GRANT EXECUTE ON FUNCTION refresh_materialized_view(text) TO whiskyverse_admin;
GRANT EXECUTE ON FUNCTION refresh_all_analytics() TO whiskyverse_admin;

-- Data manager yetkisi (CRUD işlemleri)
GRANT SELECT, INSERT, UPDATE, DELETE ON whiskies TO whiskyverse_data_manager;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO whiskyverse_data_manager;
GRANT SELECT, INSERT, UPDATE, DELETE ON collections TO whiskyverse_data_manager;
GRANT SELECT, INSERT, UPDATE, DELETE ON reviews TO whiskyverse_data_manager;

-- Admin'ler tüm yetkilere sahip
GRANT whiskyverse_data_manager TO whiskyverse_admin;

-- User access management function
CREATE OR REPLACE FUNCTION grant_admin_access(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sadece mevcut adminler yeni admin yetkisi verebilir
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Only admins can grant admin access';
  END IF;

  -- Kullanıcıyı admin yap
  UPDATE profiles
  SET
    role = 'admin',
    updated_at = NOW()
  WHERE id = user_id;

  -- Log işlemi
  INSERT INTO admin_access_log (
    user_id,
    action,
    granted_by,
    granted_at
  ) VALUES (
    user_id,
    'GRANT_ADMIN',
    auth.uid(),
    NOW()
  );

END;
$$;

CREATE OR REPLACE FUNCTION revoke_admin_access(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sadece mevcut adminler admin yetkisi kaldırabilir
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Only admins can revoke admin access';
  END IF;

  -- Kendisinin admin yetkisini kaldıramaz
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot revoke own admin access';
  END IF;

  -- Son admin kalmışsa kaldırılamaz
  IF (
    SELECT COUNT(*) FROM profiles
    WHERE role = 'admin'
  ) <= 1 THEN
    RAISE EXCEPTION 'Cannot revoke access from last admin';
  END IF;

  -- Kullanıcının admin yetkisini kaldır
  UPDATE profiles
  SET
    role = 'user',
    updated_at = NOW()
  WHERE id = user_id;

  -- Log işlemi
  INSERT INTO admin_access_log (
    user_id,
    action,
    granted_by,
    granted_at
  ) VALUES (
    user_id,
    'REVOKE_ADMIN',
    auth.uid(),
    NOW()
  );

END;
$$;

-- Admin access log tablosu
CREATE TABLE IF NOT EXISTS admin_access_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('GRANT_ADMIN', 'REVOKE_ADMIN', 'GRANT_ANALYTICS', 'REVOKE_ANALYTICS')),
  granted_by UUID NOT NULL REFERENCES profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log tablosu için RLS
ALTER TABLE admin_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view access logs" ON admin_access_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Analytics-only access functions
CREATE OR REPLACE FUNCTION grant_analytics_access(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sadece adminler analytics erişimi verebilir
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Only admins can grant analytics access';
  END IF;

  -- User metadata'da analytics_access flag'i set et
  INSERT INTO user_permissions (user_id, permission, granted_at, granted_by)
  VALUES (user_id, 'analytics_access', NOW(), auth.uid())
  ON CONFLICT (user_id, permission)
  DO UPDATE SET
    granted_at = NOW(),
    granted_by = auth.uid();

  -- Log işlemi
  INSERT INTO admin_access_log (
    user_id,
    action,
    granted_by,
    granted_at
  ) VALUES (
    user_id,
    'GRANT_ANALYTICS',
    auth.uid(),
    NOW()
  );

END;
$$;

CREATE OR REPLACE FUNCTION revoke_analytics_access(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sadece adminler analytics erişimini kaldırabilir
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Only admins can revoke analytics access';
  END IF;

  -- User permissions'dan analytics erişimini kaldır
  DELETE FROM user_permissions
  WHERE user_id = user_id
  AND permission = 'analytics_access';

  -- Log işlemi
  INSERT INTO admin_access_log (
    user_id,
    action,
    granted_by,
    granted_at
  ) VALUES (
    user_id,
    'REVOKE_ANALYTICS',
    auth.uid(),
    NOW()
  );

END;
$$;

-- User permissions tablosu
CREATE TABLE IF NOT EXISTS user_permissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  permission TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

-- User permissions RLS
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own permissions" ON user_permissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all permissions" ON user_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Analytics access kontrolü için function
CREATE OR REPLACE FUNCTION has_analytics_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Admin'ler her zaman erişebilir
  IF (
    SELECT role FROM profiles WHERE id = auth.uid()
  ) = 'admin' THEN
    RETURN true;
  END IF;

  -- Analytics permission kontrolü
  RETURN EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = auth.uid()
    AND permission = 'analytics_access'
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- Database connection limitleri
CREATE OR REPLACE FUNCTION set_user_connection_limit(user_id uuid, connection_limit int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sadece adminler bağlantı limitlerini ayarlayabilir
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Only admins can set connection limits';
  END IF;

  -- User metadata'da connection limit set et
  INSERT INTO user_permissions (user_id, permission, granted_at, granted_by)
  VALUES (user_id, 'connection_limit_' || connection_limit::text, NOW(), auth.uid())
  ON CONFLICT (user_id, permission)
  DO UPDATE SET
    granted_at = NOW(),
    granted_by = auth.uid();

END;
$$;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_admin_access_log_user_id ON admin_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_log_action ON admin_access_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_access_log_granted_at ON admin_access_log(granted_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires_at ON user_permissions(expires_at) WHERE expires_at IS NOT NULL;