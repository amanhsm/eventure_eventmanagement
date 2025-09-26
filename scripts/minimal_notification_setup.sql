-- =============================================
-- MINIMAL NOTIFICATION SYSTEM SETUP
-- Copy and run this in Supabase SQL Editor
-- =============================================

-- 1. Create the test function
CREATE OR REPLACE FUNCTION create_test_notifications()
RETURNS VOID AS $$
BEGIN
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
    LIMIT 5;

    RAISE NOTICE 'Test notifications created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at) WHERE created_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- 3. Create the notification_stats view
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

-- 4. Create the user notification summary view
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
