-- ======================================
-- Helper functions for role-based RLS
-- Provides centralized checks for admin/vip roles
-- ======================================

BEGIN;

-- Ensure the functions run with a predictable search path
-- and can be used safely inside RLS policies.

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM profiles
  WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
  OR (auth.jwt() ->> 'email') IN (
    'admin@whiskyverse.com',
    'akhantalip@gmail.com'
  );
$$;

CREATE OR REPLACE FUNCTION auth_is_vip()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role IN ('vip', 'admin')
  )
  OR (auth.jwt() ->> 'email') IN (
    'admin@whiskyverse.com',
    'akhantalip@gmail.com'
  );
$$;

COMMIT;
