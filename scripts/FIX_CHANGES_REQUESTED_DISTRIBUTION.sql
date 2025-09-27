-- =============================================
-- FIX CHANGES_REQUESTED DISTRIBUTION
-- Ensure changes_requested events are available for all organizers
-- =============================================

-- 1. First ensure the status constraint includes changes_requested
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check 
CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled', 'completed', 'changes_requested'));

-- 2. Add admin_feedback column if missing
ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_feedback TEXT;

-- 3. Update one event per organizer to have changes_requested status
WITH organizer_events AS (
    SELECT 
        e.id,
        e.organizer_id,
        o.name as organizer_name,
        ROW_NUMBER() OVER (PARTITION BY e.organizer_id ORDER BY e.created_at DESC) as rn
    FROM events e
    JOIN organizers o ON e.organizer_id = o.id
    WHERE e.status IN ('pending_approval', 'draft', 'approved')
)
UPDATE events 
SET 
    status = 'changes_requested',
    approval_status = 'changes_requested',
    admin_feedback = 'Please review and update the following: 1) Add more detailed event description, 2) Specify clear eligibility criteria, 3) Update contact information if needed. The event concept is good but needs these improvements for approval.',
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
    SELECT id FROM organizer_events WHERE rn = 1
);

-- 4. Show the updated distribution
SELECT 
    o.id as organizer_id,
    o.name as organizer_name,
    COUNT(CASE WHEN e.status = 'changes_requested' THEN 1 END) as changes_requested_count,
    COUNT(e.id) as total_events
FROM organizers o
LEFT JOIN events e ON o.id = e.organizer_id
GROUP BY o.id, o.name
ORDER BY o.id;

-- 5. Show all changes_requested events
SELECT 
    e.id,
    e.title,
    e.organizer_id,
    o.name as organizer_name,
    e.status,
    LEFT(e.admin_feedback, 100) || '...' as feedback_preview
FROM events e
JOIN organizers o ON e.organizer_id = o.id
WHERE e.status = 'changes_requested'
ORDER BY e.organizer_id;

SELECT 'Changes requested events distributed across all organizers!' as result;
