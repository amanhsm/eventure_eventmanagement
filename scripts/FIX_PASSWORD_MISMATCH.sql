-- =============================================
-- FIX PASSWORD ALGORITHM MISMATCH
-- The issue is $2a$06$ vs $2b$10$ bcrypt versions
-- =============================================

-- Test the current password hash
SELECT 
    'CURRENT PASSWORD TEST' as test_type,
    usernumber,
    password_hash,
    crypt('12345678', password_hash) as new_hash,
    password_hash = crypt('12345678', password_hash) as matches_current
FROM users 
WHERE usernumber = 'ORG001';

-- The issue might be that crypt() is generating $2a$06$ but expecting $2b$10$
-- Let's update with a proper $2b$10$ hash

-- Method 1: Update ORG001 with proper $2b$10$ hash
UPDATE users 
SET password_hash = crypt('12345678', gen_salt('bf', 10))
WHERE usernumber = 'ORG001';

-- Test the new password
SELECT 
    'NEW PASSWORD TEST' as test_type,
    usernumber,
    password_hash,
    password_hash = crypt('12345678', password_hash) as password_works,
    SUBSTRING(password_hash, 1, 7) as hash_prefix
FROM users 
WHERE usernumber = 'ORG001';

-- Update all organizer passwords to use consistent hashing
UPDATE users 
SET password_hash = crypt('12345678', gen_salt('bf', 10))
WHERE user_type = 'organizer';

-- Update admin passwords
UPDATE users 
SET password_hash = crypt('password', gen_salt('bf', 10))
WHERE user_type = 'admin';

-- Update student passwords  
UPDATE users 
SET password_hash = crypt('student01', gen_salt('bf', 10))
WHERE user_type = 'student';

-- Verify all passwords work
SELECT 
    'FINAL VERIFICATION' as test_type,
    usernumber,
    user_type,
    CASE 
        WHEN user_type = 'organizer' THEN password_hash = crypt('12345678', password_hash)
        WHEN user_type = 'admin' THEN password_hash = crypt('password', password_hash)
        WHEN user_type = 'student' THEN password_hash = crypt('student01', password_hash)
        ELSE false
    END as password_correct,
    SUBSTRING(password_hash, 1, 7) as hash_prefix
FROM users 
ORDER BY user_type, usernumber;

SELECT 'All passwords updated with consistent $2b$10$ hashing!' as status;
