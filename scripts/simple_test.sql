-- =============================================
-- SIMPLE NOTIFICATION TEST
-- Run this after the minimal setup
-- =============================================

-- Create test notifications
SELECT create_test_notifications();

-- Check notification statistics
SELECT * FROM notification_stats;

-- Show sample notifications
SELECT
    n.id,
    u.usernumber,
    s.name,
    n.title,
    n.type,
    n.is_read,
    n.created_at
FROM notifications n
JOIN users u ON u.id = n.user_id
LEFT JOIN students s ON s.user_id = u.id
WHERE n.type = 'welcome'
ORDER BY n.created_at DESC
LIMIT 5;

-- Show user notification summary
SELECT * FROM user_notification_summary LIMIT 5;
