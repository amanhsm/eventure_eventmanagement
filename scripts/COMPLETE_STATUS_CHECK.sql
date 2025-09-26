-- =============================================
-- COMPLETE DATABASE STATUS IN ONE RESULT
-- =============================================

-- Check what tables exist and show sample data
SELECT 
  'EXISTING TABLES' as section,
  table_name as name,
  table_type as type,
  '' as details,
  '' as sample_data
FROM information_schema.tables 
WHERE table_schema = 'public'

UNION ALL

-- Show user data if table exists
SELECT 
  'USER DATA' as section,
  'users' as name,
  'data' as type,
  COALESCE(usernumber, 'N/A') as details,
  COALESCE(user_type || ' - ' || email, 'N/A') as sample_data
FROM users 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
LIMIT 5

UNION ALL

-- Show organizer data if table exists  
SELECT 
  'ORGANIZER DATA' as section,
  'organizers' as name,
  'data' as type,
  COALESCE(o.name, 'N/A') as details,
  COALESCE(u.usernumber || ' - ' || o.department, 'N/A') as sample_data
FROM organizers o
LEFT JOIN users u ON o.user_id = u.id
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizers')
LIMIT 5

UNION ALL

-- Show event data if table exists
SELECT 
  'EVENT DATA' as section,
  'events' as name,
  'data' as type,
  COALESCE(title, 'N/A') as details,
  COALESCE(status || ' - ' || approval_status, 'N/A') as sample_data
FROM events 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events')
ORDER BY created_at DESC
LIMIT 5

UNION ALL

-- Show venue data if table exists
SELECT 
  'VENUE DATA' as section,
  'venues' as name,
  'data' as type,
  COALESCE(v.venue_name, 'N/A') as details,
  COALESCE('Capacity: ' || v.max_capacity::text || ' - Block: ' || b.block_name, 'N/A') as sample_data
FROM venues v
LEFT JOIN blocks b ON v.block_id = b.id
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'venues')
LIMIT 5

UNION ALL

-- Show missing core tables
SELECT 
  'MISSING TABLES' as section,
  missing_table as name,
  'MISSING' as type,
  'This table needs to be created' as details,
  '' as sample_data
FROM (
  SELECT unnest(ARRAY['users', 'organizers', 'students', 'events', 'venues', 'blocks', 'event_categories', 'administrators', 'event_registrations']) as missing_table
) t
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = t.missing_table
)

ORDER BY 
  CASE 
    WHEN section = 'EXISTING TABLES' THEN 1
    WHEN section = 'USER DATA' THEN 2  
    WHEN section = 'ORGANIZER DATA' THEN 3
    WHEN section = 'EVENT DATA' THEN 4
    WHEN section = 'VENUE DATA' THEN 5
    WHEN section = 'MISSING TABLES' THEN 6
    ELSE 7
  END,
  name;
