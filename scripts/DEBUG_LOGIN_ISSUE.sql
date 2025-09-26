-- =============================================
-- DEBUG LOGIN ISSUE
-- Check what's actually in the database
-- =============================================

-- 1. Check if ORG001 user exists
SELECT 
    'USER CHECK' as check_type,
    usernumber,
    user_type,
    email,
    is_active,
    LENGTH(password_hash) as password_hash_length,
    SUBSTRING(password_hash, 1, 10) as password_hash_start
FROM users 
WHERE usernumber = 'ORG001';

-- 2. Check all organizer users
SELECT 
    'ALL ORGANIZERS' as check_type,
    usernumber,
    user_type,
    email,
    is_active,
    LENGTH(password_hash) as password_hash_length,
    CASE 
        WHEN password_hash LIKE '$2b$%' THEN 'HASHED'
        ELSE 'PLAIN TEXT'
    END as password_status
FROM users 
WHERE user_type = 'organizer'
ORDER BY usernumber;

-- 3. Test password verification for ORG001
SELECT 
    'PASSWORD TEST' as check_type,
    usernumber,
    password_hash = crypt('12345678', password_hash) as password_matches,
    password_hash
FROM users 
WHERE usernumber = 'ORG001';

-- 4. Check if pgcrypto extension is enabled
SELECT 
    'EXTENSION CHECK' as check_type,
    extname,
    extversion
FROM pg_extension 
WHERE extname = 'pgcrypto';

-- 5. Test manual password hashing
SELECT 
    'MANUAL HASH TEST' as check_type,
    crypt('12345678', gen_salt('bf')) as manual_hash,
    crypt('12345678', crypt('12345678', gen_salt('bf'))) = crypt('12345678', gen_salt('bf')) as hash_verification;

-- 6. Check organizer profile exists
SELECT 
    'ORGANIZER PROFILE' as check_type,
    o.id as organizer_id,
    o.user_id,
    o.name,
    u.usernumber
FROM organizers o
JOIN users u ON o.user_id = u.id
WHERE u.usernumber = 'ORG001';
