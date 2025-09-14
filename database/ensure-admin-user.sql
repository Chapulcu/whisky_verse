-- Ensure admin user exists with proper role
-- First, create or update the admin user in profiles table

-- Delete existing admin user if exists to recreate
DELETE FROM profiles WHERE email = 'admin@whiskyverse.com';

-- Insert admin user with proper values
INSERT INTO profiles (
    id,
    email, 
    full_name,
    role,
    language,
    avatar_url,
    bio,
    location,
    website,
    phone,
    birth_date,
    preferences,
    created_at,
    updated_at
) VALUES (
    '57d4cd45-a7c6-443d-88f1-b8538dc27b32'::uuid, -- Use known admin UUID
    'admin@whiskyverse.com',
    'System Administrator',
    'admin',
    'tr',
    NULL,
    'WhiskyVerse System Administrator',
    NULL,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    email = 'admin@whiskyverse.com',
    full_name = 'System Administrator',
    updated_at = NOW();

-- Check if admin user was created/updated
SELECT id, email, full_name, role FROM profiles WHERE email = 'admin@whiskyverse.com';