-- =============================================
-- ANALYZE CURRENT DATABASE STATE
-- Run this FIRST to see what exists before restoration
-- =============================================

-- 1. CHECK WHAT TABLES CURRENTLY EXIST
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. CHECK TABLE SIZES AND ROW COUNTS
SELECT 
    schemaname,
    relname as table_name,
    n_tup_ins as "rows_inserted",
    n_tup_upd as "rows_updated", 
    n_tup_del as "rows_deleted",
    n_live_tup as "current_rows",
    n_dead_tup as "dead_rows"
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 3. CHECK IF CORE TABLES EXIST AND THEIR STRUCTURE
-- Users table
SELECT 'users' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check users data if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE 'USERS TABLE DATA:';
        PERFORM * FROM users LIMIT 5;
    END IF;
END $$;

-- Organizers table
SELECT 'organizers' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizers') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Events table  
SELECT 'events' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Venues table
SELECT 'venues' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'venues') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Event categories table
SELECT 'event_categories' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_categories') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Blocks table
SELECT 'blocks' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blocks') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Students table
SELECT 'students' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Administrators table
SELECT 'administrators' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'administrators') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Event registrations table
SELECT 'event_registrations' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_registrations') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 4. IF TABLES EXIST, CHECK THEIR DATA
-- Users data (if exists)
SELECT 'USERS DATA:' as info;
SELECT id, usernumber, user_type, email, created_at 
FROM users 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
ORDER BY id
LIMIT 10;

-- Organizers data (if exists)
SELECT 'ORGANIZERS DATA:' as info;
SELECT o.id, o.user_id, o.name, o.department, u.usernumber, u.email
FROM organizers o
LEFT JOIN users u ON o.user_id = u.id
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizers')
ORDER BY o.id
LIMIT 10;

-- Events data (if exists)
SELECT 'EVENTS DATA:' as info;
SELECT id, title, status, approval_status, organizer_id, created_at
FROM events 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events')
ORDER BY created_at DESC
LIMIT 10;

-- Venues data (if exists)
SELECT 'VENUES DATA:' as info;
SELECT v.id, v.venue_name, v.max_capacity, b.block_name
FROM venues v
LEFT JOIN blocks b ON v.block_id = b.id
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'venues')
ORDER BY v.id
LIMIT 10;

-- Event categories data (if exists)
SELECT 'EVENT CATEGORIES DATA:' as info;
SELECT id, name, description, color_code
FROM event_categories 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_categories')
ORDER BY id;

-- Blocks data (if exists)
SELECT 'BLOCKS DATA:' as info;
SELECT id, block_name, description
FROM blocks 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blocks')
ORDER BY id;

-- 5. CHECK FOREIGN KEY RELATIONSHIPS
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 6. CHECK INDEXES
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 7. CHECK RLS STATUS
SELECT 
    t.table_name,
    CASE WHEN c.relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as "RLS_status"
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- 8. SUMMARY REPORT
SELECT 
    'SUMMARY REPORT' as report_type,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
    (SELECT COUNT(*) FROM users WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')) as total_users,
    (SELECT COUNT(*) FROM organizers WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizers')) as total_organizers,
    (SELECT COUNT(*) FROM events WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events')) as total_events,
    (SELECT COUNT(*) FROM venues WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'venues')) as total_venues;
