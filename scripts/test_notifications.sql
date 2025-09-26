-- Quick setup script to test the notification system
-- Run this after setting up the notification triggers

-- 1. Create some test notifications to see the system in action
SELECT create_test_notifications();

-- 2. Check if notifications were created
SELECT
    u.usernumber,
    s.name,
    COUNT(n.id) as notification_count
FROM users u
LEFT JOIN students s ON s.user_id = u.id
LEFT JOIN notifications n ON n.user_id = u.id
WHERE u.user_type = 'student'
GROUP BY u.id, u.usernumber, s.name
ORDER BY notification_count DESC
LIMIT 5;

-- 3. Show notification statistics
SELECT * FROM notification_stats;

-- 4. Show the actual notifications created
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
LIMIT 10;
