-- =============================================
-- CLEAN DIAGNOSTIC: CHANGES REQUESTED EVENTS
-- PostgreSQL compatible version - no consrc references
-- =============================================

-- 1. Check admin_feedback column
SELECT 
    '1. ADMIN FEEDBACK COLUMN' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'events' AND column_name = 'admin_feedback'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

-- 2. Check status constraints (without consrc)
SELECT 
    '2. STATUS CONSTRAINTS' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ FOUND ' || COUNT(*)::text || ' constraints'
        ELSE '✗ NO CONSTRAINTS'
    END as status
FROM pg_constraint 
WHERE conname LIKE '%status%' AND conrelid = 'events'::regclass;

-- 3. Show constraint names
SELECT 
    '3. CONSTRAINT DETAILS' as check_type,
    COALESCE(string_agg(conname, ', '), 'No constraints found') as status
FROM pg_constraint 
WHERE conname LIKE '%status%' AND conrelid = 'events'::regclass;

-- 4. Count events by status
SELECT 
    '4. EVENT STATUS COUNTS' as check_type,
    status || ': ' || COUNT(*)::text as status
FROM events 
GROUP BY status
ORDER BY status;

-- 5. Organizer distribution
SELECT 
    '5. ORGANIZER DISTRIBUTION' as check_type,
    o.name || ' (ID: ' || o.id::text || ') - Total: ' || 
    COUNT(e.id)::text || ', Changes Requested: ' || 
    COUNT(CASE WHEN e.status = 'changes_requested' THEN 1 END)::text as status
FROM organizers o
LEFT JOIN events e ON o.id = e.organizer_id
GROUP BY o.id, o.name
ORDER BY o.id;

-- 6. Changes requested events details
SELECT 
    '6. CHANGES REQUESTED EVENTS' as check_type,
    'ID ' || e.id::text || ': ' || e.title || ' (Organizer: ' || o.name || ')' as status
FROM events e
JOIN organizers o ON e.organizer_id = o.id
WHERE e.status = 'changes_requested'
ORDER BY e.id;

-- 7. Events with admin feedback
SELECT 
    '7. EVENTS WITH FEEDBACK' as check_type,
    'ID ' || e.id::text || ': ' || LEFT(e.admin_feedback, 50) || '...' as status
FROM events e
WHERE e.admin_feedback IS NOT NULL
ORDER BY e.id;

-- 8. Summary statistics
SELECT 
    '8. SUMMARY' as check_type,
    'Total Events: ' || (SELECT COUNT(*) FROM events)::text ||
    ' | Changes Requested: ' || (SELECT COUNT(*) FROM events WHERE status = 'changes_requested')::text ||
    ' | With Feedback: ' || (SELECT COUNT(*) FROM events WHERE admin_feedback IS NOT NULL)::text ||
    ' | Organizers: ' || (SELECT COUNT(*) FROM organizers)::text as status;

-- 9. Check for orphaned events
SELECT 
    '9. ORPHANED EVENTS' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ No orphaned events'
        ELSE '✗ Found ' || COUNT(*)::text || ' orphaned events'
    END as status
FROM events 
WHERE organizer_id IS NULL;

-- 10. Events available for conversion
SELECT 
    '10. CONVERTIBLE EVENTS' as check_type,
    'ID ' || e.id::text || ': ' || e.title || ' (' || e.status || ') - ' || o.name as status
FROM events e
JOIN organizers o ON e.organizer_id = o.id
WHERE e.status IN ('pending_approval', 'draft')
ORDER BY e.organizer_id, e.created_at DESC
LIMIT 10;
