-- Notification System Setup for Eventure
-- Run these in your Supabase SQL Editor

-- =============================================
-- NOTIFICATION FUNCTIONS
-- =============================================

-- Function to create notification for new events (for all students)
CREATE OR REPLACE FUNCTION notify_students_new_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notifications for approved events
    IF NEW.status = 'approved' AND NEW.approval_status = 'approved' THEN
        -- Insert notifications for all students
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

        -- Also notify the organizer about their event approval
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
            'Event Approved',
            'Your event "' || NEW.title || '" has been approved and is now visible to students.',
            'event_approval',
            NEW.id,
            false,
            CURRENT_TIMESTAMP
        FROM users u
        JOIN organizers o ON o.user_id = u.id
        WHERE o.id = NEW.organizer_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications for events happening today
CREATE OR REPLACE FUNCTION notify_students_todays_events()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is an approved event happening today
    IF NEW.status = 'approved'
       AND NEW.approval_status = 'approved'
       AND NEW.event_date = CURRENT_DATE
       AND NEW.current_participants < NEW.max_participants THEN

        -- Create notifications for students who haven't registered yet
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
            'Event Happening Today!',
            'Don''t miss "' || NEW.title || '" happening today. Register now if you haven''t already!',
            'event_today',
            NEW.id,
            false,
            CURRENT_TIMESTAMP
        FROM users u
        WHERE u.user_type = 'student'
          AND u.is_active = true
          AND u.id NOT IN (
              SELECT s.user_id
              FROM students s
              JOIN event_registrations er ON er.student_id = s.id
              WHERE er.event_id = NEW.id
                AND er.status = 'registered'
          );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create registration reminder notifications
CREATE OR REPLACE FUNCTION notify_registration_reminders()
RETURNS TRIGGER AS $$
DECLARE
    event_deadline TIMESTAMP WITH TIME ZONE;
    event_title TEXT;
BEGIN
    -- Get event details
    SELECT title, registration_deadline
    INTO event_title, event_deadline
    FROM events
    WHERE id = NEW.event_id;

    -- Only create reminder if registration deadline is within 24 hours
    IF event_deadline IS NOT NULL
       AND event_deadline > CURRENT_TIMESTAMP
       AND event_deadline <= CURRENT_TIMESTAMP + INTERVAL '24 hours' THEN

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
            'Registration Deadline Approaching',
            'Registration for "' || event_title || '" closes in less than 24 hours. Register now!',
            'registration_reminder',
            NEW.event_id,
            false,
            CURRENT_TIMESTAMP
        FROM users u
        WHERE u.user_type = 'student'
          AND u.is_active = true
          AND u.id NOT IN (
              SELECT s.user_id
              FROM students s
              JOIN event_registrations er ON er.student_id = s.id
              WHERE er.event_id = NEW.event_id
                AND er.status = 'registered'
          );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for new approved events
CREATE TRIGGER trigger_notify_new_events
    AFTER INSERT OR UPDATE ON events
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND NEW.approval_status = 'approved')
    EXECUTE FUNCTION notify_students_new_event();

-- Trigger for events happening today
CREATE TRIGGER trigger_notify_todays_events
    AFTER UPDATE ON events
    FOR EACH ROW
    WHEN (NEW.event_date = CURRENT_DATE AND NEW.status = 'approved')
    EXECUTE FUNCTION notify_students_todays_events();

-- Trigger for registration reminders
CREATE TRIGGER trigger_registration_reminders
    AFTER INSERT ON event_registrations
    FOR EACH ROW
    WHEN (NEW.status = 'registered')
    EXECUTE FUNCTION notify_registration_reminders();

-- =============================================
-- MANUAL NOTIFICATION FUNCTIONS
-- =============================================

-- Function to manually create notifications for testing
CREATE OR REPLACE FUNCTION create_test_notifications()
RETURNS VOID AS $$
BEGIN
    -- Create a test notification for all students
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        is_read,
        created_at
    )
    SELECT
        u.id,
        'Welcome to Eventure!',
        'Thank you for joining Eventure. Stay updated with the latest events and notifications.',
        'welcome',
        false,
        CURRENT_TIMESTAMP
    FROM users u
    WHERE u.user_type = 'student'
      AND u.is_active = true
    LIMIT 10; -- Limit for testing

    RAISE NOTICE 'Test notifications created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
      AND created_at IS NOT NULL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Cleaned up % old notifications', deleted_count;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Add indexes for better notification query performance
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at) WHERE created_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- =============================================
-- VIEWS FOR NOTIFICATION ANALYTICS
-- =============================================

-- View for notification statistics
CREATE VIEW notification_stats AS
SELECT
    type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
    COUNT(CASE WHEN is_read = true THEN 1 END) as read_count,
    MAX(created_at) as latest_notification,
    MIN(created_at) as earliest_notification
FROM notifications
WHERE created_at IS NOT NULL
GROUP BY type
ORDER BY total_count DESC;

-- View for user notification summary
CREATE VIEW user_notification_summary AS
SELECT
    u.id as user_id,
    u.usernumber,
    COALESCE(s.name, 'Unknown') as name,
    COUNT(n.id) as total_notifications,
    COUNT(CASE WHEN n.is_read = false THEN 1 END) as unread_notifications,
    MAX(n.created_at) as last_notification_date
FROM users u
LEFT JOIN students s ON s.user_id = u.id
LEFT JOIN notifications n ON n.user_id = u.id
WHERE u.user_type = 'student'
  AND n.created_at IS NOT NULL
GROUP BY u.id, u.usernumber, s.name
ORDER BY unread_notifications DESC, last_notification_date DESC;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION notify_students_new_event IS 'Creates notifications for students when new events are approved';
COMMENT ON FUNCTION notify_students_todays_events IS 'Creates notifications for events happening today';
COMMENT ON FUNCTION notify_registration_reminders IS 'Creates registration deadline reminders';
COMMENT ON FUNCTION create_test_notifications IS 'Creates test notifications for development/testing';
COMMENT ON FUNCTION cleanup_old_notifications IS 'Removes notifications older than 30 days';
COMMENT ON VIEW notification_stats IS 'Statistics about notification types and read status';
COMMENT ON VIEW user_notification_summary IS 'Summary of notifications per user';
