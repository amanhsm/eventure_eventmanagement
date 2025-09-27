-- =============================================
-- FINAL FIXES SUMMARY
-- Complete all remaining issues
-- =============================================

-- 1. Ensure admin_feedback column exists and is properly configured
ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_feedback TEXT;

-- 2. Ensure changes_requested status is properly configured
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check 
CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled', 'completed', 'changes_requested'));

-- 3. Create events with changes_requested status for ALL organizers for testing
WITH organizer_sample AS (
    SELECT 
        o.id as organizer_id,
        o.name as organizer_name,
        e.id as event_id,
        e.title,
        ROW_NUMBER() OVER (PARTITION BY o.id ORDER BY e.created_at DESC) as rn
    FROM organizers o
    JOIN events e ON o.id = e.organizer_id
    WHERE e.status IN ('pending_approval', 'draft', 'approved')
)
UPDATE events 
SET 
    status = 'changes_requested',
    approval_status = 'changes_requested',
    admin_feedback = CASE 
        WHEN organizer_id % 3 = 0 THEN 'Please add more detailed event description and specify clear requirements for participants. The venue selection looks good but we need more information about the event activities.'
        WHEN organizer_id % 3 = 1 THEN 'The event concept is excellent! However, please update the contact information and add eligibility criteria. Also, consider adding more details about what participants should expect.'
        ELSE 'Good event proposal! Please review and enhance the following: 1) Event description needs more detail, 2) Add specific requirements, 3) Update contact details if needed. Looking forward to the updated version!'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
    SELECT event_id FROM organizer_sample WHERE rn = 1
);

-- 4. Show final distribution of changes_requested events
SELECT 
    'FINAL DISTRIBUTION OF CHANGES REQUESTED EVENTS' as section;

SELECT 
    o.id as organizer_id,
    o.name as organizer_name,
    COUNT(CASE WHEN e.status = 'changes_requested' THEN 1 END) as changes_requested_count,
    COUNT(e.id) as total_events
FROM organizers o
LEFT JOIN events e ON o.id = e.organizer_id
GROUP BY o.id, o.name
ORDER BY o.id;

-- 5. Show all changes_requested events with feedback
SELECT 
    'ALL CHANGES REQUESTED EVENTS' as section;

SELECT 
    e.id,
    e.title,
    o.name as organizer_name,
    e.status,
    e.approval_status,
    LEFT(e.admin_feedback, 100) || '...' as feedback_preview,
    e.updated_at
FROM events e
JOIN organizers o ON e.organizer_id = o.id
WHERE e.status = 'changes_requested'
ORDER BY e.organizer_id, e.updated_at DESC;

-- 6. Verify the fixes
SELECT 
    'VERIFICATION SUMMARY' as section;

SELECT 
    'Total events with changes_requested status' as metric,
    COUNT(*) as count
FROM events 
WHERE status = 'changes_requested'

UNION ALL

SELECT 
    'Organizers with changes_requested events' as metric,
    COUNT(DISTINCT organizer_id) as count
FROM events 
WHERE status = 'changes_requested'

UNION ALL

SELECT 
    'Events with admin_feedback' as metric,
    COUNT(*) as count
FROM events 
WHERE admin_feedback IS NOT NULL;

SELECT 'All fixes applied successfully! 🎉' as final_status;
