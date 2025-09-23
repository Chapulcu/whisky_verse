-- Fix whisky_translations UPDATE RLS policy
-- Run this in Supabase SQL Editor

-- First, check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'whisky_translations';

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Enable update for all users" ON whisky_translations;
DROP POLICY IF EXISTS "Allow updates for authenticated users" ON whisky_translations;
DROP POLICY IF EXISTS "Users can update translations" ON whisky_translations;

-- Create comprehensive UPDATE policy for all users (temporary for admin use)
CREATE POLICY "Enable update access for all users"
ON whisky_translations FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Also ensure INSERT policy exists for CSV import
DROP POLICY IF EXISTS "Enable insert for all users" ON whisky_translations;
CREATE POLICY "Enable insert for all users"
ON whisky_translations FOR INSERT
TO public
WITH CHECK (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'whisky_translations'
ORDER BY cmd, policyname;

-- Test update query
UPDATE whisky_translations
SET description = 'Test update - ' || CURRENT_TIMESTAMP
WHERE id = (SELECT id FROM whisky_translations LIMIT 1)
RETURNING id, name, updated_at;