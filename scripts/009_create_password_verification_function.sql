-- Create a function to verify passwords using PostgreSQL's crypt function
CREATE OR REPLACE FUNCTION verify_password(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Use crypt function to compare the input password with stored hash
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_password TO authenticated;
GRANT EXECUTE ON FUNCTION verify_password TO anon;
