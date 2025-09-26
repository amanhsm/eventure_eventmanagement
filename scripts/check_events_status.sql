-- Check events and their statuses for debugging admin dashboard
-- This will help identify why events aren't showing in admin approval queue

-- 1. Check all events and their statuses
SELECT 
    id,
    title,
    status,
    approval_status,
    organizer_id,
    created_at,
    updated_at
FROM events 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check events by status
SELECT 
    status,
    COUNT(*) as count
FROM events 
GROUP BY status
ORDER BY status;

-- 3. Check events by approval_status
SELECT 
    approval_status,
    COUNT(*) as count
FROM events 
GROUP BY approval_status
ORDER BY approval_status;

-- 4. Check recent events with full details
SELECT 
    e.id,
    e.title,
    e.status,
    e.approval_status,
    e.organizer_id,
    o.name as organizer_name,
    u.usernumber as organizer_username,
    e.created_at
FROM events e
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN users u ON o.user_id = u.id
ORDER BY e.created_at DESC
LIMIT 5;

-- 5. Check what the admin dashboard is looking for vs what exists
SELECT 
    'Events with status = pending' as query_type,
    COUNT(*) as count
FROM events 
WHERE status = 'pending'

UNION ALL

SELECT 
    'Events with status = pending_approval' as query_type,
    COUNT(*) as count
FROM events 
WHERE status = 'pending_approval'

UNION ALL

SELECT 
    'Events with approval_status = pending' as query_type,
    COUNT(*) as count
FROM events 
WHERE approval_status = 'pending';

-- 6. Show events that should appear in admin dashboard
SELECT 
    e.id,
    e.title,
    e.status,
    e.approval_status,
    e.organizer_id,
    o.name as organizer_name,
    e.created_at
FROM events e
LEFT JOIN organizers o ON e.organizer_id = o.id
WHERE e.status = 'pending_approval' OR e.approval_status = 'pending'
ORDER BY e.created_at DESC;
