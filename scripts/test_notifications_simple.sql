-- =============================================
-- NOTIFICATION SYSTEM TEST
-- Run this AFTER setting up the notification system
-- =============================================

-- 1. Create test notifications
SELECT create_test_notifications();

-- 2. Check notification statistics
SELECT * FROM notification_stats;

-- 3. Show sample notifications
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

-- 4. Show user notification summary
SELECT * FROM user_notification_summary LIMIT 5;
