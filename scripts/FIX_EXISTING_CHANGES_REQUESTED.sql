-- =============================================
-- FIX EXISTING CHANGES REQUESTED EVENTS
-- Fix events that have admin_feedback but wrong status
-- =============================================

-- 1. Show current problematic events
SELECT 
    '🔍 PROBLEMATIC EVENTS FOUND' as section,
    e.id,
    e.title,
    e.status,
    e.approval_status,
    e.admin_feedback IS NOT NULL as has_feedback,
    o.name as organizer_name
FROM events e
JOIN organizers o ON e.organizer_id = o.id
WHERE 
    (e.admin_feedback IS NOT NULL AND e.status != 'changes_requested')
    OR (e.approval_status = 'changes_requested' AND e.status != 'changes_requested');

-- 2. Count events that need fixing first
SELECT 
    '📊 EVENTS TO BE FIXED' as section,
    COUNT(*)::text || ' events need status correction' as count
FROM events 
WHERE 
    admin_feedback IS NOT NULL 
    AND status != 'changes_requested';

-- 3. Fix events that have admin_feedback but wrong status
WITH updated_events AS (
    UPDATE events 
    SET 
        status = 'changes_requested',
        approval_status = 'changes_requested',
        updated_at = CURRENT_TIMESTAMP
    WHERE 
        admin_feedback IS NOT NULL 
        AND status != 'changes_requested'
    RETURNING id, title, organizer_id
)
SELECT 
    '✅ EVENTS FIXED' as section,
    COUNT(*)::text || ' events updated successfully' as result
FROM updated_events;

-- 4. Show the corrected events
SELECT 
    '📋 CORRECTED EVENTS' as section,
    e.id,
    e.title,
    e.status,
    e.approval_status,
    LEFT(e.admin_feedback, 50) || '...' as feedback_preview,
    o.name as organizer_name
FROM events e
JOIN organizers o ON e.organizer_id = o.id
WHERE e.status = 'changes_requested'
ORDER BY e.updated_at DESC;

-- 5. Final verification - organizer distribution
SELECT 
    '🎯 FINAL ORGANIZER DISTRIBUTION' as section,
    o.name || ' (ID: ' || o.id::text || ')' as organizer,
    COUNT(CASE WHEN e.status = 'changes_requested' THEN 1 END)::text || ' changes_requested events' as count
FROM organizers o
LEFT JOIN events e ON o.id = e.organizer_id
GROUP BY o.id, o.name
ORDER BY o.id;

-- 6. Summary
SELECT 
    '🎉 SUMMARY' as section,
    'Total changes_requested events: ' || COUNT(*)::text ||
    ' | Organizers with changes_requested: ' || COUNT(DISTINCT organizer_id)::text as summary
FROM events 
WHERE status = 'changes_requested';
