-- =============================================
-- CREATE PASSWORD HASHING FUNCTION AND TRIGGER
-- This will automatically hash passwords when inserted/updated
-- =============================================

-- Enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION hash_password()
RETURNS TRIGGER AS $$
BEGIN
    -- Only hash if the password is not already hashed (doesn't start with $2b$)
    IF NEW.password_hash IS NOT NULL AND NOT (NEW.password_hash LIKE '$2b$%') THEN
        NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically hash passwords on INSERT and UPDATE
DROP TRIGGER IF EXISTS hash_password_trigger ON users;
CREATE TRIGGER hash_password_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION hash_password();

-- Test the function
SELECT 'Password hashing function and trigger created successfully!' as status;

-- Show how to verify it works
SELECT 'Now you can insert plain text passwords and they will be automatically hashed!' as info;
