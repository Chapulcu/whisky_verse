-- Check admin user in profiles table
SELECT id, email, full_name, role, created_at FROM profiles WHERE email = 'admin@whiskyverse.com';

-- Also check if there are any users
SELECT COUNT(*) as total_users FROM profiles;

-- Check admin users
SELECT id, email, full_name, role FROM profiles WHERE role = 'admin';