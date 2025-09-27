-- =============================================
-- COMPREHENSIVE DIAGNOSTIC: CHANGES REQUESTED EVENTS
-- Check why changes_requested events show for some organizers but not others
-- All results in one unified output
-- =============================================

-- Create a comprehensive diagnostic view
WITH diagnostic_summary AS (
    -- 1. Check if admin_feedback column exists
    SELECT 
        '1. ADMIN_FEEDBACK COLUMN CHECK' as section,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'events' AND column_name = 'admin_feedback'
            ) THEN 'admin_feedback column EXISTS ✓'
            ELSE 'admin_feedback column MISSING ✗'
        END as result,
        '' as details,
        0 as sort_order
    
    UNION ALL
    
    -- 2. Check status constraint (PostgreSQL version compatible)
    SELECT 
        '2. STATUS CONSTRAINT CHECK' as section,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname LIKE '%status%' AND conrelid = 'events'::regclass
            ) THEN 'Status constraints EXIST ✓'
            ELSE 'Status constraints MISSING ✗'
        END as result,
        (SELECT string_agg(conname, ', ') 
         FROM pg_constraint 
         WHERE conname LIKE '%status%' AND conrelid = 'events'::regclass) as details,
        1 as sort_order
    
    UNION ALL
    
    -- 3. Events without organizer check
    SELECT 
        '3. ORPHANED EVENTS CHECK' as section,
        CASE 
            WHEN (SELECT COUNT(*) FROM events WHERE organizer_id IS NULL) = 0 
            THEN 'No orphaned events ✓'
            ELSE 'Found ' || (SELECT COUNT(*) FROM events WHERE organizer_id IS NULL)::text || ' orphaned events ✗'
        END as result,
        '' as details,
        2 as sort_order
    
    UNION ALL
    
    -- 4. Changes requested distribution summary
    SELECT 
        '4. CHANGES REQUESTED DISTRIBUTION' as section,
        'Total organizers with changes_requested events: ' || 
        (SELECT COUNT(DISTINCT organizer_id) FROM events WHERE status = 'changes_requested')::text ||
        ' out of ' || 
        (SELECT COUNT(*) FROM organizers)::text || ' total organizers' as result,
        '' as details,
        3 as sort_order
),

-- Organizer status breakdown
organizer_breakdown AS (
    SELECT 
        '5. ORGANIZER EVENT STATUS BREAKDOWN' as section,
        o.id::text || '. ' || o.name as result,
        'Total: ' || COUNT(e.id)::text || 
        ' | Draft: ' || COUNT(CASE WHEN e.status = 'draft' THEN 1 END)::text ||
        ' | Pending: ' || COUNT(CASE WHEN e.status = 'pending_approval' THEN 1 END)::text ||
        ' | Approved: ' || COUNT(CASE WHEN e.status = 'approved' THEN 1 END)::text ||
        ' | Changes Requested: ' || COUNT(CASE WHEN e.status = 'changes_requested' THEN 1 END)::text ||
        ' | Rejected: ' || COUNT(CASE WHEN e.status = 'rejected' THEN 1 END)::text as details,
        4 as sort_order
    FROM organizers o
    LEFT JOIN events e ON o.id = e.organizer_id
    GROUP BY o.id, o.name
),

-- Changes requested events details
changes_requested_details AS (
    SELECT 
        '6. CHANGES REQUESTED EVENTS DETAILS' as section,
        'Event ID ' || e.id::text || ': ' || e.title as result,
        'Organizer: ' || o.name || ' | Status: ' || e.status || 
        ' | Feedback: ' || CASE 
            WHEN e.admin_feedback IS NOT NULL THEN LEFT(e.admin_feedback, 80) || '...'
            ELSE 'No feedback'
        END as details,
        5 as sort_order
    FROM events e
    JOIN organizers o ON e.organizer_id = o.id
    WHERE e.status = 'changes_requested'
),

-- Available events for conversion
available_for_conversion AS (
    SELECT 
        '7. EVENTS AVAILABLE FOR CONVERSION' as section,
        'Event ID ' || e.id::text || ': ' || e.title as result,
        'Organizer: ' || o.name || ' | Current Status: ' || e.status || 
        ' | Created: ' || e.created_at::date::text as details,
        6 as sort_order
    FROM events e
    JOIN organizers o ON e.organizer_id = o.id
    WHERE e.status IN ('pending_approval', 'draft')
    ORDER BY e.organizer_id, e.created_at DESC
    LIMIT 15
)

-- Combine all results
SELECT section, result, details
FROM (
    SELECT section, result, details, sort_order FROM diagnostic_summary
    UNION ALL
    SELECT section, result, details, sort_order FROM organizer_breakdown
    UNION ALL
    SELECT section, result, details, sort_order FROM changes_requested_details
    UNION ALL
    SELECT section, result, details, sort_order FROM available_for_conversion
) combined
ORDER BY sort_order, result;

-- Final summary
SELECT 
    '🎯 DIAGNOSTIC SUMMARY' as final_section,
    'Total Events: ' || (SELECT COUNT(*) FROM events)::text ||
    ' | Changes Requested: ' || (SELECT COUNT(*) FROM events WHERE status = 'changes_requested')::text ||
    ' | Organizers Affected: ' || (SELECT COUNT(DISTINCT organizer_id) FROM events WHERE status = 'changes_requested')::text ||
    ' | With Feedback: ' || (SELECT COUNT(*) FROM events WHERE admin_feedback IS NOT NULL)::text as summary;
