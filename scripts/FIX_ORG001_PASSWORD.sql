-- =============================================
-- FIX ORG001 PASSWORD MANUALLY
-- This will manually set the password for ORG001
-- =============================================

-- Enable pgcrypto extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Method 1: Update with manual bcrypt hash
UPDATE users 
SET password_hash = crypt('12345678', gen_salt('bf'))
WHERE usernumber = 'ORG001';

-- Verify the update worked
SELECT 
    usernumber,
    user_type,
    email,
    password_hash = crypt('12345678', password_hash) as password_correct,
    LENGTH(password_hash) as hash_length
FROM users 
WHERE usernumber = 'ORG001';

-- Test with a few common passwords to make sure hashing works
SELECT 
    'Testing password verification:' as info,
    crypt('12345678', '$2b$10$N9qo8uLOickgx2ZMRZoMye.fDf4PQzcCvxYR6UrwbQ/ONjLV8Qa4S') = '$2b$10$N9qo8uLOickgx2ZMRZoMye.fDf4PQzcCvxYR6UrwbQ/ONjLV8Qa4S' as test_result;

SELECT 'Password update completed for ORG001!' as status;
