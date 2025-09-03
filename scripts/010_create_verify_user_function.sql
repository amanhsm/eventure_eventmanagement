-- Create function to verify user credentials
CREATE OR REPLACE FUNCTION verify_user(
  p_usernumber TEXT,
  p_user_type TEXT,
  p_password TEXT
)
RETURNS TABLE(id INTEGER, usernumber TEXT, user_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.usernumber, u.user_type
  FROM users u
  WHERE u.usernumber = p_usernumber 
    AND u.user_type = p_user_type
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
