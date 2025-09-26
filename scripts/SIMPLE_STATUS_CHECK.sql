-- =============================================
-- SIMPLE DATABASE STATUS CHECK
-- Run this single query to see everything
-- =============================================

-- Show all existing tables and their status
SELECT 
  '1. EXISTING TABLES' as report_section,
  table_name,
  'EXISTS' as status,
  '' as details
FROM information_schema.tables 
WHERE table_schema = 'public'

UNION ALL

-- Show core table status
SELECT 
  '2. CORE TABLE STATUS' as report_section,
  'users' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
       THEN 'EXISTS' ELSE 'MISSING' END as status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
       THEN 'Authentication table' ELSE 'NEEDS CREATION' END as details

UNION ALL

SELECT 
  '2. CORE TABLE STATUS' as report_section,
  'organizers' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizers') 
       THEN 'EXISTS' ELSE 'MISSING' END as status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizers') 
       THEN 'Organizer profiles' ELSE 'NEEDS CREATION' END as details

UNION ALL

SELECT 
  '2. CORE TABLE STATUS' as report_section,
  'events' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') 
       THEN 'EXISTS' ELSE 'MISSING' END as status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') 
       THEN 'Event management' ELSE 'NEEDS CREATION' END as details

UNION ALL

SELECT 
  '2. CORE TABLE STATUS' as report_section,
  'venues' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'venues') 
       THEN 'EXISTS' ELSE 'MISSING' END as status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'venues') 
       THEN 'Venue management' ELSE 'NEEDS CREATION' END as details

UNION ALL

SELECT 
  '2. CORE TABLE STATUS' as report_section,
  'blocks' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blocks') 
       THEN 'EXISTS' ELSE 'MISSING' END as status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blocks') 
       THEN 'Building blocks' ELSE 'NEEDS CREATION' END as details

UNION ALL

SELECT 
  '2. CORE TABLE STATUS' as report_section,
  'event_categories' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_categories') 
       THEN 'EXISTS' ELSE 'MISSING' END as status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_categories') 
       THEN 'Event categories' ELSE 'NEEDS CREATION' END as details

UNION ALL

SELECT 
  '2. CORE TABLE STATUS' as report_section,
  'students' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') 
       THEN 'EXISTS' ELSE 'MISSING' END as status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') 
       THEN 'Student profiles' ELSE 'NEEDS CREATION' END as details

UNION ALL

SELECT 
  '2. CORE TABLE STATUS' as report_section,
  'administrators' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'administrators') 
       THEN 'EXISTS' ELSE 'MISSING' END as status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'administrators') 
       THEN 'Admin profiles' ELSE 'NEEDS CREATION' END as details

ORDER BY report_section, table_name;
