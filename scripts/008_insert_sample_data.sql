-- Updated venues insert to match actual database schema (removed hourly_rate and location, added block)
-- Insert sample venues
INSERT INTO venues (name, capacity, block, facilities, availability_status) VALUES
('Main Auditorium', 500, 'Academic Block A', ARRAY['Projector', 'Sound System', 'AC', 'Stage'], 'available'),
('Computer Science Lab A', 50, 'CS Building Floor 2', ARRAY['Computers', 'Projector', 'AC', 'Whiteboard'], 'available'),
('Sports Complex', 200, 'Sports Ground', ARRAY['Sound System', 'Changing Rooms', 'First Aid'], 'available'),
('Central Lawn', 1000, 'Campus Center', ARRAY['Open Air', 'Stage Setup Available'], 'available'),
('Conference Hall', 100, 'Admin Building', ARRAY['Projector', 'AC', 'Conference Setup', 'WiFi'], 'available'),
('Lab 203', 40, 'Engineering Block B', ARRAY['Computers', 'Projector', 'AC'], 'available'),
('Seminar Hall 1', 80, 'Academic Block C', ARRAY['Projector', 'Sound System', 'AC'], 'available'),
('Open Air Theatre', 300, 'Campus Center', ARRAY['Stage', 'Sound System', 'Lighting'], 'available'),
('Basketball Court', 100, 'Sports Complex', ARRAY['Scoreboard', 'Seating'], 'available'),
('Multipurpose Hall', 150, 'Student Center', ARRAY['Projector', 'Sound System', 'AC', 'Tables'], 'available');

-- Updated to use plain text passwords that will be hashed by PostgreSQL crypt function
-- Insert sample users with plain text passwords (will be hashed by crypt function)
-- Student/Organizer password: "12345678" 
-- Admin password: "supersecret"
INSERT INTO users (usernumber, password_hash, user_type) VALUES
('admin', 'supersecret', 'admin'),
('1234567', '12345678', 'student'),
('2345678', '12345678', 'student'),
('3456789', '12345678', 'student'),
('4567890', '12345678', 'student'),
('5678901', '12345678', 'student'),
('7654321', '12345678', 'organizer'),
('8765432', '12345678', 'organizer'),
('9876543', '12345678', 'organizer');

-- Insert sample students
INSERT INTO students (user_id, name, department, year, semester, course, events_registered_count) VALUES
((SELECT id FROM users WHERE usernumber = '1234567'), 'Rahul Sharma', 'Computer Science', 3, 5, 'B.Tech CSE', 0),
((SELECT id FROM users WHERE usernumber = '2345678'), 'Priya Patel', 'Electronics', 2, 4, 'B.Tech ECE', 0),
((SELECT id FROM users WHERE usernumber = '3456789'), 'Arjun Kumar', 'Mechanical', 4, 7, 'B.Tech ME', 0),
((SELECT id FROM users WHERE usernumber = '4567890'), 'Sneha Reddy', 'Information Technology', 2, 3, 'B.Tech IT', 0),
((SELECT id FROM users WHERE usernumber = '5678901'), 'Karthik Nair', 'Civil Engineering', 3, 6, 'B.Tech CE', 0);

-- Insert sample organizers
INSERT INTO organizers (user_id, name, department, events_created_count) VALUES
((SELECT id FROM users WHERE usernumber = '7654321'), 'Dr. Anjali Mehta', 'Computer Science', 0),
((SELECT id FROM users WHERE usernumber = '8765432'), 'Prof. Vikram Singh', 'Cultural Committee', 0),
((SELECT id FROM users WHERE usernumber = '9876543'), 'Dr. Ravi Krishnan', 'Sports Department', 0);

-- Insert sample events
INSERT INTO events (title, description, organizer_id, venue_id, category, event_date, start_time, end_time, max_participants, registration_deadline, status, current_participants) VALUES
('AI & Machine Learning Workshop', 'Learn the fundamentals of AI and ML with hands-on coding sessions. Perfect for beginners and intermediate students.', 
 (SELECT id FROM organizers WHERE name = 'Dr. Anjali Mehta'), 
 (SELECT id FROM venues WHERE name = 'Computer Science Lab A'), 
 'technical', '2024-03-15', '14:30', '17:30', 50, '2024-03-13', 'approved', 0),

('Annual Cultural Fest - Expressions 2024', 'Join us for a spectacular evening of music, dance, drama, and art performances by talented students.',
 (SELECT id FROM organizers WHERE name = 'Prof. Vikram Singh'),
 (SELECT id FROM venues WHERE name = 'Main Auditorium'),
 'cultural', '2024-03-20', '18:00', '21:00', 500, '2024-03-18', 'approved', 0),

('Inter-College Basketball Tournament', 'Compete with the best teams from colleges across the city. Registration includes team organization and refreshments.',
 (SELECT id FROM organizers WHERE name = 'Dr. Ravi Krishnan'),
 (SELECT id FROM venues WHERE name = 'Sports Complex'),
 'sports', '2024-03-22', '09:00', '17:00', 16, '2024-03-20', 'approved', 0),

('Web Development Bootcamp', 'Intensive 3-day bootcamp covering HTML, CSS, JavaScript, and React. Build real projects and enhance your portfolio.',
 (SELECT id FROM organizers WHERE name = 'Dr. Anjali Mehta'),
 (SELECT id FROM venues WHERE name = 'Lab 203'),
 'technical', '2024-03-25', '09:00', '17:00', 40, '2024-03-23', 'pending', 0),

('Photography Workshop', 'Learn professional photography techniques, composition, and editing. Bring your own camera or smartphone.',
 (SELECT id FROM organizers WHERE name = 'Prof. Vikram Singh'),
 (SELECT id FROM venues WHERE name = 'Seminar Hall 1'),
 'cultural', '2024-03-28', '10:00', '16:00', 80, '2024-03-26', 'approved', 0);

-- Insert sample registrations
INSERT INTO event_registrations (student_id, event_id, status, registration_date) VALUES
((SELECT id FROM students WHERE name = 'Rahul Sharma'), (SELECT id FROM events WHERE title = 'AI & Machine Learning Workshop'), 'confirmed', NOW()),
((SELECT id FROM students WHERE name = 'Priya Patel'), (SELECT id FROM events WHERE title = 'AI & Machine Learning Workshop'), 'confirmed', NOW()),
((SELECT id FROM students WHERE name = 'Priya Patel'), (SELECT id FROM events WHERE title = 'Annual Cultural Fest - Expressions 2024'), 'confirmed', NOW()),
((SELECT id FROM students WHERE name = 'Arjun Kumar'), (SELECT id FROM events WHERE title = 'Inter-College Basketball Tournament'), 'confirmed', NOW()),
((SELECT id FROM students WHERE name = 'Sneha Reddy'), (SELECT id FROM events WHERE title = 'Photography Workshop'), 'confirmed', NOW()),
((SELECT id FROM students WHERE name = 'Karthik Nair'), (SELECT id FROM events WHERE title = 'Web Development Bootcamp'), 'pending', NOW());
