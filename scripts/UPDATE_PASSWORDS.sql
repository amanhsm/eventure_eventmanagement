-- =============================================
-- UPDATE PASSWORDS WITH PLAIN TEXT (WILL BE AUTO-HASHED)
-- Run this AFTER creating the password hashing function
-- =============================================

-- Update Administrator passwords (plain text - will be auto-hashed)
UPDATE users SET password_hash = 'password' WHERE usernumber = 'ADMIN001';
UPDATE users SET password_hash = 'password' WHERE usernumber = 'ADMIN002';

-- Update Organizer passwords (plain text - will be auto-hashed)
UPDATE users SET password_hash = '12345678' WHERE usernumber = 'ORG001';
UPDATE users SET password_hash = '12345678' WHERE usernumber = 'ORG002';
UPDATE users SET password_hash = '12345678' WHERE usernumber = 'ORG003';
UPDATE users SET password_hash = '12345678' WHERE usernumber = 'ORG004';
UPDATE users SET password_hash = '12345678' WHERE usernumber = 'ORG005';
UPDATE users SET password_hash = '12345678' WHERE usernumber = 'ORG006';

-- Update Student passwords (plain text - will be auto-hashed)
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

-- Verify password updates
SELECT 
    usernumber,
    user_type,
    email,
    CASE 
        WHEN password_hash LIKE '$2b$10$92IXUNpkjO0rOQ5byMi.Ye%' THEN 'password'
        WHEN password_hash LIKE '$2b$10$N9qo8uLOickgx2ZMRZoMye%' THEN '12345678'
        WHEN password_hash LIKE '$2b$10$6ba8a8f33EALVRjrjxNYaO%' THEN 'student01'
        ELSE 'unknown'
    END as password_set
FROM users 
ORDER BY user_type, usernumber;

SELECT 'Password update completed successfully!' as status;
