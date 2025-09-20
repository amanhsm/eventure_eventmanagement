-- =========================================
-- COMPLETE DATABASE SCHEMA FOR EVENTNEST
-- =========================================

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

-- =========================================
-- EXTENSIONS
-- =========================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================
-- USERS (custom auth users)
-- =========================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  usernumber VARCHAR(20) UNIQUE NOT NULL, -- regno/empid/admin
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'organizer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_usernumber ON users(usernumber);
CREATE INDEX idx_users_type ON users(user_type);

-- Auto-hash plain text passwords on insert/update
CREATE OR REPLACE FUNCTION hash_password_trigger_fn() RETURNS trigger AS $$
BEGIN
  IF NEW.password_hash IS NOT NULL AND NEW.password_hash NOT LIKE '$%' THEN
    NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_hash_password ON users;
CREATE TRIGGER users_hash_password
BEFORE INSERT OR UPDATE OF password_hash ON users
FOR EACH ROW EXECUTE FUNCTION hash_password_trigger_fn();

-- =========================================
-- STUDENTS
-- =========================================
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  year INTEGER,
  semester INTEGER,
  course VARCHAR(100),
  events_registered_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_students_user_id ON students(user_id);

-- =========================================
-- ORGANIZERS
-- =========================================
CREATE TABLE organizers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  events_created_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_organizers_user_id ON organizers(user_id);

-- =========================================
-- VENUES
-- =========================================
CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  capacity INTEGER NOT NULL,
  block VARCHAR(100),
  location VARCHAR(150),
  facilities TEXT[],
  hourly_rate NUMERIC(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- EVENTS
-- =========================================
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  organizer_id INTEGER NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('technical','cultural','sports','academic','other')),
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  registration_deadline DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('approved','pending','rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_status ON events(status);

-- =========================================
-- EVENT REGISTRATIONS
-- =========================================
CREATE TABLE event_registrations (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX uniq_event_registration ON event_registrations(student_id, event_id);
CREATE INDEX idx_event_registrations_student ON event_registrations(student_id);
CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);

-- =========================================
-- VENUE BOOKINGS (for venue booking system)
-- =========================================
CREATE TABLE venue_bookings (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  organizer_id INTEGER NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  event_name VARCHAR(200) NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  expected_attendees INTEGER NOT NULL,
  setup_time VARCHAR(50),
  contact_person VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  special_requirements TEXT,
  estimated_cost NUMERIC(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_venue_bookings_venue ON venue_bookings(venue_id);
CREATE INDEX idx_venue_bookings_organizer ON venue_bookings(organizer_id);
CREATE INDEX idx_venue_bookings_date ON venue_bookings(event_date);
CREATE INDEX idx_venue_bookings_status ON venue_bookings(status);

-- =========================================
-- TRIGGERS AND FUNCTIONS
-- =========================================

-- Function to update student event count
CREATE OR REPLACE FUNCTION update_student_event_count() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE students 
    SET events_registered_count = events_registered_count + 1,
        updated_at = NOW()
    WHERE id = NEW.student_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE students 
    SET events_registered_count = GREATEST(events_registered_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.student_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce capacity and update counts
CREATE OR REPLACE FUNCTION enforce_capacity_and_update_counts() RETURNS trigger AS $$
DECLARE
  v_max INT;
  v_current INT;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Check capacity before allowing registration
    SELECT max_participants, current_participants INTO v_max, v_current 
    FROM events 
    WHERE id = NEW.event_id 
    FOR UPDATE;

    IF v_current >= v_max THEN
      RAISE EXCEPTION 'Event is full. Cannot register more participants.';
    END IF;

    -- Update current participants count
    UPDATE events 
    SET current_participants = current_participants + 1,
        updated_at = NOW()
    WHERE id = NEW.event_id;

    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrease current participants count
    UPDATE events 
    SET current_participants = GREATEST(current_participants - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.event_id;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update organizer event count
CREATE OR REPLACE FUNCTION update_organizer_event_count() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE organizers 
    SET events_created_count = events_created_count + 1,
        updated_at = NOW()
    WHERE id = NEW.organizer_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE organizers 
    SET events_created_count = GREATEST(events_created_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.organizer_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for event registrations
DROP TRIGGER IF EXISTS trg_event_registration_capacity ON event_registrations;
CREATE TRIGGER trg_event_registration_capacity
AFTER INSERT OR DELETE ON event_registrations
FOR EACH ROW EXECUTE FUNCTION enforce_capacity_and_update_counts();

DROP TRIGGER IF EXISTS trg_student_event_count ON event_registrations;
CREATE TRIGGER trg_student_event_count
AFTER INSERT OR DELETE ON event_registrations
FOR EACH ROW EXECUTE FUNCTION update_student_event_count();

-- Trigger for organizer event count
DROP TRIGGER IF EXISTS trg_organizer_event_count ON events;
CREATE TRIGGER trg_organizer_event_count
AFTER INSERT OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION update_organizer_event_count();

-- =========================================
-- RPC: verify_user (matches UI)
-- =========================================
CREATE OR REPLACE FUNCTION verify_user(
  p_usernumber TEXT,
  p_user_type TEXT,
  p_password TEXT
)
RETURNS TABLE(id INTEGER, usernumber VARCHAR(20), user_type VARCHAR(20)) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.usernumber, u.user_type
  FROM users u
  WHERE u.usernumber = p_usernumber 
    AND u.user_type = p_user_type
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- SEED DATA (matches UI)
-- =========================================

-- Users (admin + 3 students + 2 organizers)
INSERT INTO users (usernumber, password_hash, user_type) VALUES
('admin', 'supersecret', 'admin'),
('1234567', '68607901', 'student'),
('2345678', '13354518', 'student'),
('3456789', '48321862', 'student'),
('7654321', '91158723', 'organizer'),
('8765432', '78890324', 'organizer')
ON CONFLICT (usernumber) DO NOTHING;

-- Students
INSERT INTO students (user_id, name, department, year, semester, course) VALUES
((SELECT id FROM users WHERE usernumber='1234567'), 'Rahul Sharma', 'Computer Science', 3, 5, 'B.Tech CSE'),
((SELECT id FROM users WHERE usernumber='2345678'), 'Priya Patel', 'Electronics', 2, 4, 'B.Tech ECE'),
((SELECT id FROM users WHERE usernumber='3456789'), 'Arjun Kumar', 'Mechanical', 4, 7, 'B.Tech ME')
ON CONFLICT DO NOTHING;

-- Organizers
INSERT INTO organizers (user_id, name, department) VALUES
((SELECT id FROM users WHERE usernumber='7654321'), 'Dr. Anjali Mehta', 'Computer Science'),
((SELECT id FROM users WHERE usernumber='8765432'), 'Prof. Vikram Singh', 'Cultural Committee')
ON CONFLICT DO NOTHING;

-- Venues
INSERT INTO venues (name, description, capacity, block, location, facilities, hourly_rate, is_available) VALUES
('Main Auditorium', 'Large auditorium with state-of-the-art sound system', 500, 'A-Block', 'Academic Block A', ARRAY['projector','microphone','sound_system','air_conditioning'], 2000.00, TRUE),
('Computer Science Lab A', 'Modern computer lab with 50 workstations', 50, 'CS Block', 'CS Building', ARRAY['computers','projector','whiteboard','air_conditioning'], 800.00, TRUE),
('Central Lawn', 'Open space for outdoor events and gatherings', 1000, 'Central', 'Campus Center', ARRAY['stage','sound_system','lighting'], 1500.00, TRUE),
('Sports Complex', 'Multi-purpose sports facility', 200, 'Sports Block', 'Sports Center', ARRAY['changing_rooms','equipment_storage','first_aid'], 1200.00, TRUE),
('Conference Hall B', 'Professional conference room with modern amenities', 100, 'B-Block', 'Administrative Block', ARRAY['projector','whiteboard','air_conditioning','wifi'], 1000.00, TRUE),
('Art Studio', 'Creative space for artistic events and workshops', 30, 'Arts Block', 'Creative Arts Building', ARRAY['easels','natural_lighting','storage','sink'], 600.00, TRUE)
ON CONFLICT DO NOTHING;

-- Events (approved to show in grids)
INSERT INTO events (title, description, organizer_id, venue_id, category, event_date, start_time, end_time, max_participants, current_participants, registration_deadline, status) VALUES
('AI & Machine Learning Workshop', 'Learn the fundamentals of AI and ML with hands-on coding sessions. Perfect for beginners and intermediate students.', 
 (SELECT id FROM organizers WHERE name='Dr. Anjali Mehta'),
 (SELECT id FROM venues WHERE name='Computer Science Lab A'),
 'technical', CURRENT_DATE + 3, '14:30', '17:30', 50, 0, CURRENT_DATE + 1, 'approved'),
('Annual Cultural Fest - Expressions', 'Join us for a spectacular evening of music, dance, drama, and art performances by talented students.',
 (SELECT id FROM organizers WHERE name='Prof. Vikram Singh'),
 (SELECT id FROM venues WHERE name='Main Auditorium'),
 'cultural', CURRENT_DATE + 10, '18:00', '21:00', 500, 0, CURRENT_DATE + 8, 'approved'),

('Inter-College Basketball Tournament', 'Compete with the best teams from colleges across the city. Registration includes team organization and refreshments.',
 (SELECT id FROM organizers WHERE name='Prof. Vikram Singh'),
 (SELECT id FROM venues WHERE name='Sports Complex'),
 'sports', CURRENT_DATE + 6, '09:00', '17:00', 16, 0, CURRENT_DATE + 4, 'approved'),

('Digital Art Workshop', 'Explore digital art techniques and create stunning artwork using professional software.',
 (SELECT id FROM organizers WHERE name='Prof. Vikram Singh'),
 (SELECT id FROM venues WHERE name='Art Studio'),
 'cultural', CURRENT_DATE + 15, '10:00', '16:00', 30, 0, CURRENT_DATE + 12, 'approved')
ON CONFLICT DO NOTHING;

-- Sample registrations (this will trigger the count updates)
INSERT INTO event_registrations (student_id, event_id, status) VALUES
((SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.usernumber='1234567'),
 (SELECT id FROM events WHERE title='AI & Machine Learning Workshop'), 'confirmed'),

((SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.usernumber='2345678'),
 (SELECT id FROM events WHERE title='AI & Machine Learning Workshop'), 'confirmed'),

((SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.usernumber='2345678'),
 (SELECT id FROM events WHERE title='Annual Cultural Fest - Expressions'), 'confirmed'),

((SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.usernumber='3456789'),
 (SELECT id FROM events WHERE title='Inter-College Basketball Tournament'), 'confirmed')
ON CONFLICT DO NOTHING;

-- Sample venue bookings
INSERT INTO venue_bookings (venue_id, organizer_id, event_name, event_date, start_time, end_time, expected_attendees, setup_time, contact_person, contact_email, contact_phone, special_requirements, estimated_cost, status) VALUES
((SELECT id FROM venues WHERE name='Conference Hall B'),
 (SELECT id FROM organizers WHERE name='Dr. Anjali Mehta'),
 'Tech Talk Series', CURRENT_DATE + 20, '14:00', '16:00', 80, '1hour', 'Dr. Anjali Mehta', 'anjali.mehta@christuniversity.in', '+91 9876543210', 'Need microphone and projector setup', 2000.00, 'approved'),

((SELECT id FROM venues WHERE name='Central Lawn'),
 (SELECT id FROM organizers WHERE name='Prof. Vikram Singh'),
 'Music Festival', CURRENT_DATE + 25, '17:00', '22:00', 800, '3hours', 'Prof. Vikram Singh', 'vikram.singh@christuniversity.in', '+91 9876543211', 'Stage setup with sound system and lighting', 7500.00, 'pending')
ON CONFLICT DO NOTHING;

-- =========================================
-- VERIFICATION QUERIES
-- =========================================
-- Uncomment these to test the setup
-- SELECT * FROM verify_user('1234567','student','68607901');
-- SELECT s.*, s.events_registered_count FROM students s JOIN users u ON s.user_id=u.id WHERE u.usernumber='1234567';
-- SELECT e.title, e.current_participants, e.max_participants FROM events e;
-- SELECT * FROM event_registrations er JOIN students s ON er.student_id=s.id;
