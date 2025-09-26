-- =============================================
-- SINGLE QUERY DATABASE CHECK
-- This will show all results in one output
-- =============================================

WITH table_status AS (
  SELECT 
    table_name,
    CASE WHEN table_name IN ('users', 'organizers', 'students', 'events', 'venues', 'blocks', 'event_categories', 'administrators', 'event_registrations') 
         THEN 'CORE TABLE' 
         ELSE 'OTHER TABLE' END as table_category,
    'EXISTS' as status
  FROM information_schema.tables 
  WHERE table_schema = 'public'
),
missing_tables AS (
  SELECT unnest(ARRAY['users', 'organizers', 'students', 'events', 'venues', 'blocks', 'event_categories', 'administrators', 'event_registrations']) as table_name,
         'CORE TABLE' as table_category,
         'MISSING' as status
  WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = unnest(ARRAY['users', 'organizers', 'students', 'events', 'venues', 'blocks', 'event_categories', 'administrators', 'event_registrations']))
),
all_table_status AS (
  SELECT * FROM table_status
  UNION ALL
  SELECT * FROM missing_tables
)
SELECT 
  '=== TABLE STATUS REPORT ===' as report_section,
  table_name,
  table_category,
  status
FROM all_table_status
WHERE table_category = 'CORE TABLE'
ORDER BY 
  CASE WHEN status = 'EXISTS' THEN 1 ELSE 2 END,
  table_name;

-- Show data counts for existing tables
SELECT 
  '=== DATA COUNTS ===' as report_section,
  'users' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
       THEN (SELECT COUNT(*)::text FROM users) 
       ELSE 'TABLE MISSING' END as row_count
UNION ALL
SELECT 
  '=== DATA COUNTS ===' as report_section,
  'organizers' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizers') 
       THEN (SELECT COUNT(*)::text FROM organizers) 
       ELSE 'TABLE MISSING' END as row_count
UNION ALL
SELECT 
  '=== DATA COUNTS ===' as report_section,
  'events' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') 
       THEN (SELECT COUNT(*)::text FROM events) 
       ELSE 'TABLE MISSING' END as row_count
UNION ALL
SELECT 
  '=== DATA COUNTS ===' as report_section,
  'venues' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'venues') 
       THEN (SELECT COUNT(*)::text FROM venues) 
       ELSE 'TABLE MISSING' END as row_count
UNION ALL
SELECT 
  '=== DATA COUNTS ===' as report_section,
  'blocks' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blocks') 
       THEN (SELECT COUNT(*)::text FROM blocks) 
       ELSE 'TABLE MISSING' END as row_count
UNION ALL
SELECT 
  '=== DATA COUNTS ===' as report_section,
  'event_categories' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_categories') 
       THEN (SELECT COUNT(*)::text FROM event_categories) 
       ELSE 'TABLE MISSING' END as row_count
ORDER BY report_section, table_name;
