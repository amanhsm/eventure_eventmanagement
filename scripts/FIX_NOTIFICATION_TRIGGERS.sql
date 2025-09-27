-- =============================================
-- FIX NOTIFICATION TRIGGERS - CORRECT COLUMN NAMES
-- Replace u.role with u.user_type
-- =============================================

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS trigger_notify_event_status_change ON events;
DROP TRIGGER IF EXISTS trigger_notify_event_submission ON events;
DROP FUNCTION IF EXISTS notify_students_event_approved();
DROP FUNCTION IF EXISTS notify_admins_event_submitted();

-- Function to notify students when an event is approved (FIXED)
CREATE OR REPLACE FUNCTION notify_students_event_approved()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when event status changes to approved
    IF NEW.status = 'approved' AND NEW.approval_status = 'approved' 
       AND (OLD.status != 'approved' OR OLD.approval_status != 'approved') THEN
        
        -- Insert notifications for all active students (FIXED: user_type not role)
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            related_event_id,
            is_read,
            created_at
        )
        SELECT
            u.id,
            'New Event Available',
            'A new event "' || NEW.title || '" has been posted. Check it out!',
            'new_event',
            NEW.id,
            false,
            CURRENT_TIMESTAMP
        FROM users u
        WHERE u.user_type = 'student'  -- FIXED: was u.role
          AND u.is_active = true;

        -- Notify the organizer about approval
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            related_event_id,
            is_read,
            created_at
        )
        SELECT
            org.user_id,
            'Event Approved',
            'Your event "' || NEW.title || '" has been approved and is now live!',
            'event_approved',
            NEW.id,
            false,
            CURRENT_TIMESTAMP
        FROM organizers org
        WHERE org.id = NEW.organizer_id;
        
    END IF;

    -- Notify organizer when event is rejected
    IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            related_event_id,
            is_read,
            created_at
        )
        SELECT
            org.user_id,
            'Event Rejected',
            'Your event "' || NEW.title || '" has been rejected.' || 
            CASE WHEN NEW.admin_feedback IS NOT NULL THEN ' Reason: ' || NEW.admin_feedback ELSE '' END,
            'event_rejected',
            NEW.id,
            false,
            CURRENT_TIMESTAMP
        FROM organizers org
        WHERE org.id = NEW.organizer_id;
    END IF;

    -- Notify organizer when changes are requested
    IF NEW.status = 'changes_requested' AND OLD.status != 'changes_requested' THEN
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            related_event_id,
            is_read,
            created_at
        )
        SELECT
            org.user_id,
            'Changes Requested',
            'Changes have been requested for your event "' || NEW.title || '".' ||
            CASE WHEN NEW.admin_feedback IS NOT NULL THEN ' Feedback: ' || NEW.admin_feedback ELSE '' END,
            'event_changes_requested',
            NEW.id,
            false,
            CURRENT_TIMESTAMP
        FROM organizers org
        WHERE org.id = NEW.organizer_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify admins when a new event is submitted (FIXED)
CREATE OR REPLACE FUNCTION notify_admins_event_submitted()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger for new events with pending_approval status
    IF NEW.status = 'pending_approval' AND NEW.approval_status = 'pending' THEN
        
        -- Insert notifications for all active admins (FIXED: user_type not role)
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            related_event_id,
            is_read,
            created_at
        )
        SELECT
            u.id,
            'New Event Submission',
            'A new event "' || NEW.title || '" has been submitted by ' || 
            COALESCE(org.name, 'Unknown Organizer') || ' for approval.',
            'new_event_submission',
            NEW.id,
            false,
            CURRENT_TIMESTAMP
        FROM users u
        LEFT JOIN organizers org ON org.id = NEW.organizer_id
        WHERE u.user_type = 'admin'  -- FIXED: was u.role
          AND u.is_active = true;
          
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers with fixed functions
CREATE TRIGGER trigger_notify_event_status_change
    AFTER UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION notify_students_event_approved();

CREATE TRIGGER trigger_notify_event_submission
    AFTER INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION notify_admins_event_submitted();

-- Verify triggers are created
SELECT 
    '✅ FIXED NOTIFICATION TRIGGERS' as status,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_notify_event_status_change', 'trigger_notify_event_submission')
ORDER BY trigger_name;

SELECT '🔔 NOTIFICATION SYSTEM FIXED - COLUMN NAMES CORRECTED!' as result;
