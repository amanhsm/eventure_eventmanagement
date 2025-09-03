-- Added script for creating authentication users
-- Instructions for creating sample users in Supabase Auth
-- These commands should be run in the Supabase SQL Editor or through the Auth API

-- Note: In production, users would sign up through the application
-- For testing purposes, you can create these users manually in Supabase Dashboard > Authentication > Users

-- Sample credentials for testing:
-- Students:
--   Email: 1234567@christuniversity.in, Password: 12345678
--   Email: 2345678@christuniversity.in, Password: 23456789  
--   Email: 3456789@christuniversity.in, Password: 34567890

-- Organizers:
--   Email: 7654321@christuniversity.in, Password: 76543210
--   Email: 8765432@christuniversity.in, Password: 87654321

-- Admin:
--   Email: admin@christuniversity.in, Password: supersecret

-- After creating users in Supabase Auth Dashboard, update the user_profiles insert statements
-- in 006_insert_sample_data.sql with the actual user IDs from auth.users table

-- To get the actual user IDs after creation, run:
-- SELECT id, email FROM auth.users ORDER BY created_at;
