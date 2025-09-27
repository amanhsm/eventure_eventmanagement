-- =============================================
-- ADD CHANGES_REQUESTED STATUS TO EVENTS
-- Adds the new status for admin change requests
-- =============================================

-- 1. Add admin_feedback column if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_feedback TEXT;

-- 2. Update the status check constraint to include 'changes_requested'
-- First, drop the existing constraint if it exists
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add the new constraint with 'changes_requested' status
ALTER TABLE events ADD CONSTRAINT events_status_check 
CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled', 'completed', 'changes_requested'));

-- 3. Update approval_status constraint as well if needed
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_approval_status_check;
ALTER TABLE events ADD CONSTRAINT events_approval_status_check 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'changes_requested'));

-- 4. Create a function for admins to request changes
CREATE OR REPLACE FUNCTION request_event_changes(
    p_event_id INTEGER,
    p_admin_id INTEGER,
    p_feedback TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the event status and add feedback
    UPDATE events 
    SET 
        status = 'changes_requested',
        approval_status = 'changes_requested',
        admin_feedback = p_feedback,
        feedback_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_event_id;
    
    -- Check if update was successful
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a function for organizers to resubmit after changes
CREATE OR REPLACE FUNCTION resubmit_event_after_changes(
    p_event_id INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the event status back to pending approval
    UPDATE events 
    SET 
        status = 'pending_approval',
        approval_status = 'pending',
        admin_feedback = NULL,
        feedback_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_event_id AND status = 'changes_requested';
    
    -- Check if update was successful
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Show current events with their status
SELECT 
    id,
    title,
    status,
    approval_status,
    CASE 
        WHEN admin_feedback IS NOT NULL THEN LEFT(admin_feedback, 50) || '...'
        ELSE 'No feedback'
    END as feedback_preview,
    created_at
FROM events 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'Changes requested status added successfully!' as status;
