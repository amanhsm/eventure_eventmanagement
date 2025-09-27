-- =============================================
-- NOTIFICATION SYSTEM TRIGGERS
-- Automatically create notifications for key events
-- =============================================

-- Function to notify students when an event is approved
CREATE OR REPLACE FUNCTION notify_students_event_approved()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when event status changes to approved
    IF NEW.status = 'approved' AND NEW.approval_status = 'approved' 
       AND (OLD.status != 'approved' OR OLD.approval_status != 'approved') THEN
        
        -- Insert notifications for all active students
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
        WHERE u.user_type = 'student'
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

-- Function to notify admins when a new event is submitted
CREATE OR REPLACE FUNCTION notify_admins_event_submitted()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger for new events with pending_approval status
    IF NEW.status = 'pending_approval' AND NEW.approval_status = 'pending' THEN
        
        -- Insert notifications for all active admins
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
        WHERE u.user_type = 'admin'
          AND u.is_active = true;
          
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_notify_event_status_change ON events;
DROP TRIGGER IF EXISTS trigger_notify_event_submission ON events;

-- Create triggers
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
    '✅ NOTIFICATION TRIGGERS CREATED' as status,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_notify_event_status_change', 'trigger_notify_event_submission')
ORDER BY trigger_name;

SELECT '🔔 NOTIFICATION SYSTEM READY!' as result;
