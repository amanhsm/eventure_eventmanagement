-- DB constraints and triggers for capacity and counts

-- Prevent duplicate registrations (already ensured by unique index if present)
-- CREATE UNIQUE INDEX IF NOT EXISTS uniq_event_registration ON event_registrations(student_id, event_id);

-- Prevent registrations beyond capacity and update counts
CREATE OR REPLACE FUNCTION enforce_capacity_and_update_counts() RETURNS trigger AS $$
DECLARE
  v_max INT;
  v_current INT;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT max_participants, current_participants INTO v_max, v_current 
    FROM events 
    WHERE id = NEW.event_id 
    FOR UPDATE;

    IF v_current >= v_max THEN
      RAISE EXCEPTION 'Event is full';
    END IF;

    UPDATE events 
    SET current_participants = current_participants + 1 
    WHERE id = NEW.event_id;

    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE events 
    SET current_participants = GREATEST(current_participants - 1, 0) 
    WHERE id = OLD.event_id;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_registration_capacity ON event_registrations;
CREATE TRIGGER trg_event_registration_capacity
AFTER INSERT OR DELETE ON event_registrations
FOR EACH ROW EXECUTE FUNCTION enforce_capacity_and_update_counts();

-- =========================================
-- RESET (CAREFUL IN PROD)
-- =========================================
DROP FUNCTION IF EXISTS verify_user(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS hash_password_trigger_fn() CASCADE;
DROP FUNCTION IF EXISTS enforce_capacity_and_update_counts() CASCADE;
DROP FUNCTION IF EXISTS update_student_event_count() CASCADE;

DROP TABLE IF EXISTS venue_bookings CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS organizers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
