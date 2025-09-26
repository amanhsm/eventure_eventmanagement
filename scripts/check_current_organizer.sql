-- Check the current organizer setup for debugging
-- This will help identify why the organizer_id foreign key is failing

-- 1. Check all users and their types
SELECT 
    id,
    usernumber,
    user_type,
    email,
    is_active,
    created_at
FROM users 
ORDER BY id;

-- 2. Check all organizers and their user relationships
SELECT 
    o.id as organizer_id,
    o.user_id,
    o.name as organizer_name,
    o.department,
    o.organization,
    u.usernumber,
    u.user_type,
    u.email
FROM organizers o
JOIN users u ON o.user_id = u.id
ORDER BY o.id;

-- 3. Check for any organizer-type users WITHOUT organizer records
SELECT 
    u.id as user_id,
    u.usernumber,
    u.user_type,
    u.email,
    'MISSING ORGANIZER RECORD' as status
FROM users u
LEFT JOIN organizers o ON u.id = o.user_id
WHERE u.user_type = 'organizer' AND o.id IS NULL;

-- 4. Check recent events to see what organizer_ids are being used
SELECT 
    e.id,
    e.title,
    e.organizer_id,
    o.name as organizer_name,
    u.usernumber,
    e.created_at
FROM events e
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN users u ON o.user_id = u.id
ORDER BY e.created_at DESC
LIMIT 5;

-- 5. If you know your user ID (from the error message it was 10), check specifically:
SELECT 
    u.id as user_id,
    u.usernumber,
    u.user_type,
    u.email,
    o.id as organizer_id,
    o.name as organizer_name,
    CASE 
        WHEN o.id IS NULL THEN 'ORGANIZER RECORD MISSING'
        ELSE 'ORGANIZER RECORD EXISTS'
    END as status
FROM users u
LEFT JOIN organizers o ON u.id = o.user_id
WHERE u.id = 10; -- Replace 10 with your actual user ID if different
