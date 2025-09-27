-- =============================================
-- DISTRIBUTE CHANGES REQUESTED EVENTS
-- Ensure all organizers have changes_requested events for testing
-- =============================================

-- Current state analysis:
-- - Dr. Sarah Wilson (ID: 1): Has 1 changes_requested event ✓
-- - Prof. John Doe (ID: 2): Has 0 changes_requested events ✗
-- - Dr. Priya Sharma (ID: 3): Has 0 changes_requested events ✗  
-- - Prof. Michael Brown (ID: 4): Has 0 changes_requested events ✗
-- - Dr. Anjali Patel (ID: 5): Has 1 changes_requested event ✓
-- - Prof. David Kumar (ID: 6): Has 0 changes_requested events ✗

-- Convert one event per organizer to changes_requested status
-- Priority: draft > pending_approval > approved

-- 1. Convert Prof. John Doe's pending_approval event (ID 17 or 19)
UPDATE events 
SET 
    status = 'changes_requested',
    approval_status = 'changes_requested',
    admin_feedback = 'Please provide more detailed event description and add specific requirements for participants. The current title "nash" needs to be more descriptive and professional.',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 17 AND organizer_id = 2;

-- 2. Convert Dr. Priya Sharma's event (need to find one)
UPDATE events 
SET 
    status = 'changes_requested',
    approval_status = 'changes_requested',
    admin_feedback = 'Please review the event details and add more comprehensive information about the event objectives, target audience, and expected outcomes.',
    updated_at = CURRENT_TIMESTAMP
WHERE organizer_id = 3 
AND status IN ('approved', 'pending_approval', 'draft')
AND id = (
    SELECT id FROM events 
    WHERE organizer_id = 3 
    AND status IN ('approved', 'pending_approval', 'draft')
    ORDER BY CASE 
        WHEN status = 'draft' THEN 1
        WHEN status = 'pending_approval' THEN 2
        WHEN status = 'approved' THEN 3
    END
    LIMIT 1
);

-- 3. Convert Prof. Michael Brown's event
UPDATE events 
SET 
    status = 'changes_requested',
    approval_status = 'changes_requested',
    admin_feedback = 'The event proposal looks promising! Please enhance the description with more details about the agenda, learning outcomes, and participant requirements.',
    updated_at = CURRENT_TIMESTAMP
WHERE organizer_id = 4 
AND status IN ('approved', 'pending_approval', 'draft')
AND id = (
    SELECT id FROM events 
    WHERE organizer_id = 4 
    AND status IN ('approved', 'pending_approval', 'draft')
    ORDER BY CASE 
        WHEN status = 'draft' THEN 1
        WHEN status = 'pending_approval' THEN 2
        WHEN status = 'approved' THEN 3
    END
    LIMIT 1
);

-- 4. Convert Prof. David Kumar's event
UPDATE events 
SET 
    status = 'changes_requested',
    approval_status = 'changes_requested',
    admin_feedback = 'Good event concept! Please add more specific details about the event format, duration, and any special requirements. Also, ensure contact information is complete.',
    updated_at = CURRENT_TIMESTAMP
WHERE organizer_id = 6 
AND status IN ('approved', 'pending_approval', 'draft')
AND id = (
    SELECT id FROM events 
    WHERE organizer_id = 6 
    AND status IN ('approved', 'pending_approval', 'draft')
    ORDER BY CASE 
        WHEN status = 'draft' THEN 1
        WHEN status = 'pending_approval' THEN 2
        WHEN status = 'approved' THEN 3
    END
    LIMIT 1
);

-- 5. Show the updated distribution
SELECT 
    '🎯 UPDATED DISTRIBUTION' as section,
    o.name || ' (ID: ' || o.id::text || ')' as organizer,
    'Total: ' || COUNT(e.id)::text || ' | Changes Requested: ' || 
    COUNT(CASE WHEN e.status = 'changes_requested' THEN 1 END)::text as events
FROM organizers o
LEFT JOIN events e ON o.id = e.organizer_id
GROUP BY o.id, o.name
ORDER BY o.id;

-- 6. Show all changes_requested events
SELECT 
    '📋 ALL CHANGES REQUESTED EVENTS' as section,
    'ID ' || e.id::text || ': ' || e.title as event_title,
    'Organizer: ' || o.name || ' | Feedback: ' || LEFT(e.admin_feedback, 60) || '...' as details
FROM events e
JOIN organizers o ON e.organizer_id = o.id
WHERE e.status = 'changes_requested'
ORDER BY e.organizer_id;

-- 7. Final summary
SELECT 
    '✅ DISTRIBUTION COMPLETE!' as result,
    'Now ' || COUNT(DISTINCT organizer_id)::text || ' out of 6 organizers have changes_requested events' as summary
FROM events 
WHERE status = 'changes_requested';

-- 8. Verification - should show changes_requested events for most/all organizers
SELECT 
    '🔍 VERIFICATION' as section,
    CASE 
        WHEN COUNT(DISTINCT organizer_id) >= 4 THEN '✅ SUCCESS: ' || COUNT(DISTINCT organizer_id)::text || ' organizers have changes_requested events'
        ELSE '⚠️ PARTIAL: Only ' || COUNT(DISTINCT organizer_id)::text || ' organizers have changes_requested events'
    END as status
FROM events 
WHERE status = 'changes_requested';
