-- =============================================
-- CREATE TEST EVENTS WITH CHANGES_REQUESTED STATUS
-- For testing the changes requested functionality
-- =============================================

-- First, make sure the status exists
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check 
CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled', 'completed', 'changes_requested'));

-- Add admin_feedback column if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_feedback TEXT;

-- Update some existing events to have changes_requested status for testing
-- (This will update the first 2 events found for each organizer)
UPDATE events 
SET 
    status = 'changes_requested',
    approval_status = 'changes_requested',
    admin_feedback = 'Please update the event description to be more detailed and add specific requirements for participants. Also, the contact information seems incomplete.',
    feedback_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
    SELECT id 
    FROM events 
    WHERE status IN ('pending_approval', 'draft')
    LIMIT 2
);

-- Show the updated events
SELECT 
    id,
    title,
    status,
    approval_status,
    LEFT(admin_feedback, 100) || '...' as feedback_preview,
    organizer_id,
    updated_at
FROM events 
WHERE status = 'changes_requested'
ORDER BY updated_at DESC;

SELECT 'Test events with changes_requested status created successfully!' as result;
