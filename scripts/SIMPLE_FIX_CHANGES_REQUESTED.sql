-- =============================================
-- SIMPLE FIX: CHANGES REQUESTED SETUP
-- Quick fix for changes_requested functionality
-- =============================================

-- 1. Add admin_feedback column if missing
ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_feedback TEXT;

-- 2. Update status constraint to include changes_requested
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check 
CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled', 'completed', 'changes_requested'));

-- 3. Create sample changes_requested events for testing
-- Update one event per organizer to have changes_requested status
UPDATE events 
SET 
    status = 'changes_requested',
    approval_status = 'changes_requested',
    admin_feedback = 'Please review and update the event details. Add more specific information about requirements and contact details.',
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
    SELECT DISTINCT ON (organizer_id) id
    FROM events 
    WHERE status IN ('pending_approval', 'draft', 'approved')
    ORDER BY organizer_id, created_at DESC
);

-- 4. Show results
SELECT 
    'SETUP COMPLETE!' as message,
    'Changes requested events created for ' || COUNT(DISTINCT organizer_id)::text || ' organizers' as details
FROM events 
WHERE status = 'changes_requested';

-- 5. Final verification
SELECT 
    o.name as organizer_name,
    COUNT(CASE WHEN e.status = 'changes_requested' THEN 1 END) as changes_requested_count,
    COUNT(e.id) as total_events
FROM organizers o
LEFT JOIN events e ON o.id = e.organizer_id
GROUP BY o.id, o.name
ORDER BY o.id;
