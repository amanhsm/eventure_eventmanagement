-- =============================================
-- REMOVE ORGANIZATION FIELD FROM ORGANIZERS
-- Make organizers independent from clubs and societies
-- =============================================

-- 1. Check current organizers table structure
SELECT 
    'CURRENT ORGANIZERS TABLE STRUCTURE' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizers'
ORDER BY ordinal_position;

-- 2. Show current organizer data with organization field
SELECT 
    'CURRENT ORGANIZER DATA' as section,
    id,
    name,
    department,
    organization,
    user_id
FROM organizers
LIMIT 5;

-- 3. Remove organization column if it exists
ALTER TABLE organizers DROP COLUMN IF EXISTS organization;

-- 4. Show updated table structure
SELECT 
    'UPDATED ORGANIZERS TABLE STRUCTURE' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizers'
ORDER BY ordinal_position;

-- 5. Show updated organizer data
SELECT 
    'UPDATED ORGANIZER DATA' as section,
    id,
    name,
    department,
    user_id
FROM organizers
LIMIT 5;

SELECT 'Organization field removed from organizers! Organizers are now independent. ✅' as result;
