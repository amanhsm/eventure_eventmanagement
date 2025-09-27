-- =============================================
-- DEBUG: MANUAL CHANGES REQUESTED WORKFLOW
-- Check what happens when admin manually requests changes
-- =============================================

-- 1. Show all recent events (last 5) with their exact status values
SELECT 
    '1. RECENT EVENTS STATUS CHECK' as section,
    e.id,
    e.title,
    e.status,
    e.approval_status,
    e.organizer_id,
    o.name as organizer_name,
    e.admin_feedback,
    e.created_at,
    e.updated_at
FROM events e
JOIN organizers o ON e.organizer_id = o.id
ORDER BY e.created_at DESC
LIMIT 5;

-- 2. Check for any events that might have inconsistent status
SELECT 
    '2. STATUS INCONSISTENCY CHECK' as section,
    e.id,
    e.title,
    'status: ' || COALESCE(e.status, 'NULL') || 
    ' | approval_status: ' || COALESCE(e.approval_status, 'NULL') as status_info,
    o.name as organizer_name
FROM events e
JOIN organizers o ON e.organizer_id = o.id
WHERE 
    (e.status = 'changes_requested' AND e.approval_status != 'changes_requested')
    OR (e.status != 'changes_requested' AND e.approval_status = 'changes_requested')
    OR (e.admin_feedback IS NOT NULL AND e.status != 'changes_requested');

-- 3. Show the exact query that the frontend uses to get changes_requested events
SELECT 
    '3. FRONTEND QUERY SIMULATION' as section,
    e.id,
    e.title,
    e.status,
    e.approval_status,
    e.admin_feedback IS NOT NULL as has_feedback,
    o.name as organizer_name
FROM events e
JOIN organizers o ON e.organizer_id = o.id
WHERE e.status = 'changes_requested'
ORDER BY e.updated_at DESC;

-- 4. Check if there are events with feedback but wrong status
SELECT 
    '4. EVENTS WITH FEEDBACK BUT WRONG STATUS' as section,
    e.id,
    e.title,
    e.status,
    e.approval_status,
    LEFT(e.admin_feedback, 50) || '...' as feedback_preview,
    o.name as organizer_name
FROM events e
JOIN organizers o ON e.organizer_id = o.id
WHERE e.admin_feedback IS NOT NULL 
AND e.status != 'changes_requested';

-- 5. Show what the admin interface might be setting
SELECT 
    '5. POSSIBLE ADMIN INTERFACE VALUES' as section,
    'Check these common admin status values:' as info;

-- Show distinct status and approval_status combinations
SELECT 
    '6. ALL STATUS COMBINATIONS' as section,
    e.status || ' + ' || COALESCE(e.approval_status, 'NULL') as status_combination,
    COUNT(*) as count,
    string_agg(e.id::text, ', ') as event_ids
FROM events e
GROUP BY e.status, e.approval_status
ORDER BY count DESC;

-- 7. Check the most recent event that should have changes_requested
SELECT 
    '7. MOST RECENT EVENT ANALYSIS' as section,
    e.id,
    e.title,
    e.status,
    e.approval_status,
    e.admin_feedback IS NOT NULL as has_admin_feedback,
    e.organizer_id,
    o.name as organizer_name,
    e.updated_at
FROM events e
JOIN organizers o ON e.organizer_id = o.id
ORDER BY e.updated_at DESC
LIMIT 1;

-- 8. Provide fix suggestions
SELECT 
    '8. POTENTIAL FIXES' as section,
    'If an event has admin_feedback but status != changes_requested, run:' as suggestion
UNION ALL
SELECT 
    '8. POTENTIAL FIXES' as section,
    'UPDATE events SET status = ''changes_requested'', approval_status = ''changes_requested'' WHERE admin_feedback IS NOT NULL AND status != ''changes_requested'';' as suggestion;
