-- =============================================
-- CHECK ORGANIZER TABLE STRUCTURE
-- See what fields are available for organizers
-- =============================================

-- 1. Check organizers table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'organizers'
ORDER BY ordinal_position;

-- 2. Check users table structure (linked to organizers)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 3. Show sample organizer data
SELECT 
    o.id,
    o.name,
    o.department,
    o.organization,
    o.user_id,
    u.email,
    u.phone,
    u.created_at
FROM organizers o
JOIN users u ON o.user_id = u.id
LIMIT 5;

-- 4. Check if there are any other organizer-related fields
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name LIKE '%organizer%' OR table_name LIKE '%organizer%'
ORDER BY table_name, column_name;
