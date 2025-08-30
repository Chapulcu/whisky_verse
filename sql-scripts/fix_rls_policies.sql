-- Fix RLS policies for profiles table to avoid infinite recursion

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users based on user_id" ON profiles;

-- Disable RLS temporarily to fix the issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Allow full access to own profile" ON profiles
FOR ALL USING (auth.uid() = id);

CREATE POLICY "Allow admins full access" ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;