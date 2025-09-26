-- Ensure all users with user_type='organizer' have corresponding organizer records
-- This fixes the foreign key constraint issue for event creation

-- 1. Check current organizer records
SELECT 
    u.id as user_id,
    u.usernumber,
    u.user_type,
    u.email,
    o.id as organizer_id,
    o.name as organizer_name
FROM users u
LEFT JOIN organizers o ON u.id = o.user_id
WHERE u.user_type = 'organizer'
ORDER BY u.id;

-- 2. Find users with user_type='organizer' but no organizer record
SELECT 
    u.id as user_id,
    u.usernumber,
    u.email,
    u.user_type
FROM users u
LEFT JOIN organizers o ON u.id = o.user_id
WHERE u.user_type = 'organizer' AND o.id IS NULL;

-- 3. Create organizer records for users who don't have them
-- (Uncomment after reviewing the results above)
/*
INSERT INTO organizers (user_id, name, department, organization)
SELECT 
    u.id,
    COALESCE(u.email, u.usernumber) as name, -- Use email or usernumber as default name
    'General' as department, -- Default department
    'Student Organization' as organization -- Default organization
FROM users u
LEFT JOIN organizers o ON u.id = o.user_id
WHERE u.user_type = 'organizer' AND o.id IS NULL;
*/

-- 4. Alternative: Create a specific organizer record for a known user
-- Replace USER_ID with the actual user ID that's trying to create events
/*
INSERT INTO organizers (user_id, name, department, organization, phone)
VALUES 
    (10, 'Event Organizer', 'Computer Science', 'Tech Club', '+1234567890')
ON CONFLICT (user_id) DO NOTHING;
*/

-- 5. Verify the organizer records after creation
/*
SELECT 
    u.id as user_id,
    u.usernumber,
    u.user_type,
    u.email,
    o.id as organizer_id,
    o.name as organizer_name,
    o.department,
    o.organization
FROM users u
JOIN organizers o ON u.id = o.user_id
WHERE u.user_type = 'organizer'
ORDER BY u.id;
*/

-- Note: 
-- 1. Run queries 1-2 first to see what's missing
-- 2. Uncomment and run query 3 to create missing organizer records
-- 3. Or use query 4 to create a specific organizer record
-- 4. Run query 5 to verify the results
