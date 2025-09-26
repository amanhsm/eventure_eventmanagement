-- =============================================
-- SIMPLE DATABASE STATE CHECK
-- Run this to see what currently exists
-- =============================================

-- 1. LIST ALL EXISTING TABLES
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. CHECK CORE TABLES EXISTENCE
SELECT 
    'users' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'organizers' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizers') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'students' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'events' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'venues' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'venues') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'blocks' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blocks') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'event_categories' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_categories') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'administrators' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'administrators') 
         THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'event_registrations' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_registrations') 
         THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 3. IF USERS TABLE EXISTS, CHECK DATA
SELECT 'USERS TABLE DATA:' as info, 'Check below' as note;
SELECT id, usernumber, user_type, email, created_at 
FROM users 
ORDER BY id
LIMIT 10;

-- 4. IF ORGANIZERS TABLE EXISTS, CHECK DATA  
SELECT 'ORGANIZERS TABLE DATA:' as info, 'Check below' as note;
SELECT o.id, o.user_id, o.name, o.department, u.usernumber, u.email
FROM organizers o
LEFT JOIN users u ON o.user_id = u.id
ORDER BY o.id
LIMIT 10;

-- 5. IF EVENTS TABLE EXISTS, CHECK DATA
SELECT 'EVENTS TABLE DATA:' as info, 'Check below' as note;
SELECT id, title, status, approval_status, organizer_id, created_at
FROM events 
ORDER BY created_at DESC
LIMIT 10;

-- 6. IF VENUES TABLE EXISTS, CHECK DATA
SELECT 'VENUES TABLE DATA:' as info, 'Check below' as note;
SELECT v.id, v.venue_name, v.max_capacity, b.block_name
FROM venues v
LEFT JOIN blocks b ON v.block_id = b.id
ORDER BY v.id
LIMIT 10;

-- 7. IF EVENT CATEGORIES TABLE EXISTS, CHECK DATA
SELECT 'EVENT CATEGORIES DATA:' as info, 'Check below' as note;
SELECT id, name, description, color_code
FROM event_categories 
ORDER BY id;

-- 8. IF BLOCKS TABLE EXISTS, CHECK DATA
SELECT 'BLOCKS DATA:' as info, 'Check below' as note;
SELECT id, block_name, description
FROM blocks 
ORDER BY id;
