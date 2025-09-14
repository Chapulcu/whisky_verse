-- Set akhantalip@gmail.com as admin user
-- First check if user exists
SELECT id, email, full_name, role FROM profiles WHERE email = 'akhantalip@gmail.com';

-- Update user role to admin
UPDATE profiles 
SET 
    role = 'admin',
    full_name = COALESCE(full_name, 'Admin User'),
    updated_at = NOW()
WHERE email = 'akhantalip@gmail.com';

-- If user doesn't exist, create it
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
) 
SELECT 
    '57d4cd45-a7c6-443d-88f1-b8538dc27b32'::uuid,
    'akhantalip@gmail.com',
    'Admin User',
    'admin',
    'tr',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'akhantalip@gmail.com');

-- Verify the change
SELECT id, email, full_name, role FROM profiles WHERE email = 'akhantalip@gmail.com';