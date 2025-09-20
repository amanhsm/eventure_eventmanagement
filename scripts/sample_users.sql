-- Sample User Insert Queries for Eventure
-- These queries create sample student and organizer accounts for testing

-- =============================================
-- SAMPLE STUDENT USER
-- =============================================

-- Insert student user (password: student123)
INSERT INTO users (usernumber, user_type, password_hash, email, is_active, created_at) VALUES
('STU001', 'student', crypt('student123', gen_salt('bf')), 'john.doe@christuniversity.in', TRUE, CURRENT_TIMESTAMP);

-- Insert student profile
INSERT INTO students (user_id, name, department, year, semester, course, phone, created_at) VALUES
((SELECT id FROM users WHERE usernumber = 'STU001'), 
 'John Doe', 
 'Computer Science', 
 3, 
 6, 
 'B.Tech Computer Science', 
 '+91-9876543210', 
 CURRENT_TIMESTAMP);

-- =============================================
-- SAMPLE ORGANIZER USER
-- =============================================

-- Insert organizer user (password: organizer123)
INSERT INTO users (usernumber, user_type, password_hash, email, is_active, created_at) VALUES
('ORG001', 'organizer', crypt('organizer123', gen_salt('bf')), 'sarah.wilson@christuniversity.in', TRUE, CURRENT_TIMESTAMP);

-- Insert organizer profile
INSERT INTO organizers (user_id, name, department, phone, organization, created_at) VALUES
((SELECT id FROM users WHERE usernumber = 'ORG001'), 
 'Dr. Sarah Wilson', 
 'Computer Science', 
 '+91-9876543211', 
 'Computer Science Department', 
 CURRENT_TIMESTAMP);

-- =============================================
-- ADDITIONAL SAMPLE USERS
-- =============================================

-- Another student user (password: student456)
INSERT INTO users (usernumber, user_type, password_hash, email, is_active, created_at) VALUES
('STU002', 'student', crypt('student456', gen_salt('bf')), 'priya.sharma@christuniversity.in', TRUE, CURRENT_TIMESTAMP);

INSERT INTO students (user_id, name, department, year, semester, course, phone, created_at) VALUES
((SELECT id FROM users WHERE usernumber = 'STU002'), 
 'Priya Sharma', 
 'Business Administration', 
 2, 
 4, 
 'BBA', 
 '+91-9876543212', 
 CURRENT_TIMESTAMP);

-- Another organizer user (password: organizer456)
INSERT INTO users (usernumber, user_type, password_hash, email, is_active, created_at) VALUES
('ORG002', 'organizer', crypt('organizer456', gen_salt('bf')), 'raj.patel@christuniversity.in', TRUE, CURRENT_TIMESTAMP);

INSERT INTO organizers (user_id, name, department, phone, organization, created_at) VALUES
((SELECT id FROM users WHERE usernumber = 'ORG002'), 
 'Prof. Raj Patel', 
 'Arts and Humanities', 
 '+91-9876543213', 
 'Cultural Committee', 
 CURRENT_TIMESTAMP);

-- =============================================
-- SAMPLE EVENTS
-- =============================================

-- Insert sample events (requires event categories and venues to exist)
INSERT INTO events (title, description, category_id, organizer_id, venue_id, event_date, start_time, end_time, registration_deadline, max_participants, status, created_at) VALUES
('React Workshop for Beginners', 
 'Learn the fundamentals of React.js with hands-on coding exercises. Perfect for students new to web development.',
 (SELECT id FROM event_categories WHERE name = 'technical' LIMIT 1),
 (SELECT o.id FROM organizers o JOIN users u ON o.user_id = u.id WHERE u.usernumber = 'ORG001'),
 (SELECT id FROM venues WHERE name LIKE '%Computer%' OR name LIKE '%Lab%' LIMIT 1),
 CURRENT_DATE + 7,
 '14:00:00',
 '17:00:00',
 CURRENT_TIMESTAMP + INTERVAL '5 days',
 50,
 'approved',
 CURRENT_TIMESTAMP),

('Annual Cultural Night', 
 'Join us for an evening of music, dance, and cultural performances by talented students from various departments.',
 (SELECT id FROM event_categories WHERE name = 'cultural' LIMIT 1),
 (SELECT o.id FROM organizers o JOIN users u ON o.user_id = u.id WHERE u.usernumber = 'ORG002'),
 (SELECT id FROM venues WHERE name LIKE '%Auditorium%' LIMIT 1),
 CURRENT_DATE + 14,
 '18:00:00',
 '21:00:00',
 CURRENT_TIMESTAMP + INTERVAL '10 days',
 300,
 'approved',
 CURRENT_TIMESTAMP),

('Basketball Tournament', 
 'Inter-department basketball tournament. Form your teams and compete for the championship trophy!',
 (SELECT id FROM event_categories WHERE name = 'sports' LIMIT 1),
 (SELECT o.id FROM organizers o JOIN users u ON o.user_id = u.id WHERE u.usernumber = 'ORG001'),
 (SELECT id FROM venues WHERE name LIKE '%Sports%' OR name LIKE '%Court%' LIMIT 1),
 CURRENT_DATE + 21,
 '09:00:00',
 '17:00:00',
 CURRENT_TIMESTAMP + INTERVAL '15 days',
 16,
 'approved',
 CURRENT_TIMESTAMP);

-- =============================================
-- SAMPLE EVENT REGISTRATIONS
-- =============================================

-- Register John Doe for some events
INSERT INTO event_registrations (student_id, event_id, status, registration_date, created_at) VALUES
((SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.usernumber = 'STU001'),
 (SELECT id FROM events WHERE title = 'React Workshop for Beginners'),
 'registered',
 CURRENT_DATE - 2,
 CURRENT_TIMESTAMP),
((SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.usernumber = 'STU001'),
 (SELECT id FROM events WHERE title = 'Annual Cultural Night'),
 'registered',
 CURRENT_DATE - 1,
 CURRENT_TIMESTAMP);

-- Register Priya Sharma for some events
INSERT INTO event_registrations (student_id, event_id, status, registration_date, created_at) VALUES
((SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.usernumber = 'STU002'),
 (SELECT id FROM events WHERE title = 'Annual Cultural Night'),
 'registered',
 CURRENT_DATE - 1,
 CURRENT_TIMESTAMP),
((SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.usernumber = 'STU002'),
 (SELECT id FROM events WHERE title = 'Basketball Tournament'),
 'registered',
 CURRENT_DATE,
 CURRENT_TIMESTAMP);

-- =============================================
-- LOGIN CREDENTIALS SUMMARY
-- =============================================

/*
SAMPLE LOGIN CREDENTIALS:

1. ADMIN USER:
   Username: admin
   Password: admin123
   Role: admin

2. STUDENT USERS:
   Username: STU001
   Password: student123
   Role: student
   Name: John Doe

   Username: STU002
   Password: student456
   Role: student
   Name: Priya Sharma

3. ORGANIZER USERS:
   Username: ORG001
   Password: organizer123
   Role: organizer
   Name: Dr. Sarah Wilson

   Username: ORG002
   Password: organizer456
   Role: organizer
   Name: Prof. Raj Patel

Note: All passwords are hashed using bcrypt in the database.
*/
