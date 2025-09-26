-- Function to decrement event participants when registration is cancelled
CREATE OR REPLACE FUNCTION decrement_event_participants(event_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE events 
  SET current_participants = GREATEST(current_participants - 1, 0)
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;
