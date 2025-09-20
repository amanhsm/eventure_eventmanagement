-- Debug script to check profile data
-- Run this in your Supabase SQL editor

-- Check users table
SELECT 'Users table:' as info;
SELECT id, usernumber, user_type FROM users ORDER BY id;

-- Check students table
SELECT 'Students table:' as info;
SELECT id, user_id, name, department FROM students ORDER BY id;

-- Check organizers table  
SELECT 'Organizers table:' as info;
SELECT id, user_id, name, department FROM organizers ORDER BY id;

-- Check the relationship between users and students
SELECT 'Users -> Students relationship:' as info;
SELECT u.id as user_id, u.usernumber, u.user_type, s.id as student_id, s.name as student_name
FROM users u
LEFT JOIN students s ON u.id = s.user_id
ORDER BY u.id;

-- Check the relationship between users and organizers
SELECT 'Users -> Organizers relationship:' as info;
SELECT u.id as user_id, u.usernumber, u.user_type, o.id as organizer_id, o.name as organizer_name
FROM users u
LEFT JOIN organizers o ON u.id = o.user_id
ORDER BY u.id;

-- Test specific user lookups
SELECT 'Testing user 1234567 lookup:' as info;
SELECT u.id, u.usernumber, u.user_type, s.name, s.department
FROM users u
LEFT JOIN students s ON u.id = s.user_id
WHERE u.usernumber = '1234567';

