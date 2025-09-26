-- =============================================
-- COMPLETE PASSWORD RESET - START FRESH
-- This will reset all passwords and recreate the hashing system
-- =============================================

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS hash_password_trigger ON users;
DROP FUNCTION IF EXISTS hash_password();

-- Step 2: Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 3: Create new password hashing function with proper $2b$10$ format
CREATE OR REPLACE FUNCTION hash_password()
RETURNS TRIGGER AS $$
BEGIN
    -- Only hash if the password is not already hashed (doesn't start with $2)
    IF NEW.password_hash IS NOT NULL AND NOT (NEW.password_hash LIKE '$2%') THEN
        NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf', 10));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to automatically hash passwords
CREATE TRIGGER hash_password_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION hash_password();

-- Step 5: Reset all passwords to plain text (will be auto-hashed by trigger)

-- Reset Administrator passwords
UPDATE users SET password_hash = 'password' WHERE usernumber = 'ADMIN001';
UPDATE users SET password_hash = 'password' WHERE usernumber = 'ADMIN002';

-- Reset Organizer passwords
UPDATE users SET password_hash = '12345678' WHERE usernumber = 'ORG001';
UPDATE users SET password_hash = '12345678' WHERE usernumber = 'ORG002';
UPDATE users SET password_hash = '12345678' WHERE usernumber = 'ORG003';
UPDATE users SET password_hash = '12345678' WHERE usernumber = 'ORG004';
UPDATE users SET password_hash = '12345678' WHERE usernumber = 'ORG005';
UPDATE users SET password_hash = '12345678' WHERE usernumber = 'ORG006';

-- Reset Student passwords
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU001';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU002';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU003';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU004';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU005';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU006';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU007';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU008';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU009';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU010';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU011';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU012';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU013';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU014';
UPDATE users SET password_hash = 'student01' WHERE usernumber = 'STU015';

-- Step 6: Verify everything worked correctly
SELECT 
    '=== VERIFICATION RESULTS ===' as section,
    NULL as usernumber,
    NULL as user_type,
    NULL as password_correct,
    NULL as hash_format
UNION ALL
SELECT 
    'ADMIN PASSWORDS' as section,
    usernumber,
    user_type,
    CASE WHEN password_hash = crypt('password', password_hash) THEN 'CORRECT' ELSE 'WRONG' END as password_correct,
    SUBSTRING(password_hash, 1, 7) as hash_format
FROM users 
WHERE user_type = 'admin'
UNION ALL
SELECT 
    'ORGANIZER PASSWORDS' as section,
    usernumber,
    user_type,
    CASE WHEN password_hash = crypt('12345678', password_hash) THEN 'CORRECT' ELSE 'WRONG' END as password_correct,
    SUBSTRING(password_hash, 1, 7) as hash_format
FROM users 
WHERE user_type = 'organizer'
UNION ALL
SELECT 
    'STUDENT PASSWORDS (first 5)' as section,
    usernumber,
    user_type,
    CASE WHEN password_hash = crypt('student01', password_hash) THEN 'CORRECT' ELSE 'WRONG' END as password_correct,
    SUBSTRING(password_hash, 1, 7) as hash_format
FROM users 
WHERE user_type = 'student'
LIMIT 5;

-- Step 7: Test ORG001 specifically
SELECT 
    '=== ORG001 SPECIFIC TEST ===' as test_info,
    usernumber,
    user_type,
    email,
    is_active,
    password_hash = crypt('12345678', password_hash) as login_will_work,
    LENGTH(password_hash) as hash_length,
    SUBSTRING(password_hash, 1, 10) as hash_start
FROM users 
WHERE usernumber = 'ORG001';

-- Step 8: Summary
SELECT 
    '✅ PASSWORD RESET COMPLETE!' as status,
    'All passwords have been reset with proper $2b$10$ hashing' as details
UNION ALL
SELECT 
    '🔑 LOGIN CREDENTIALS:' as status,
    'ORG001 / 12345678 (organizer)' as details
UNION ALL
SELECT 
    '🔑 LOGIN CREDENTIALS:' as status,
    'ADMIN001 / password (admin)' as details
UNION ALL
SELECT 
    '🔑 LOGIN CREDENTIALS:' as status,
    'STU001 / student01 (student)' as details;
