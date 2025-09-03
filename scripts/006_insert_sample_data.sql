-- Insert sample venues
INSERT INTO public.venues (name, description, capacity, location, facilities, hourly_rate, is_available) VALUES
('Main Auditorium', 'Large auditorium with state-of-the-art sound system', 500, 'Academic Block A', ARRAY['projector', 'microphone', 'sound_system', 'air_conditioning'], 2000.00, true),
('Computer Science Lab A', 'Modern computer lab with 50 workstations', 50, 'CS Building', ARRAY['computers', 'projector', 'whiteboard', 'air_conditioning'], 800.00, true),
('Central Lawn', 'Open space for outdoor events and gatherings', 1000, 'Campus Center', ARRAY['stage', 'sound_system', 'lighting'], 1500.00, true),
('Sports Complex', 'Multi-purpose sports facility', 200, 'Sports Block', ARRAY['changing_rooms', 'equipment_storage', 'first_aid'], 1200.00, true),
('Lab Complex 203', 'Science laboratory for workshops and experiments', 30, 'Science Building', ARRAY['lab_equipment', 'safety_gear', 'projector'], 600.00, true),
('Conference Hall', 'Professional meeting space for seminars', 100, 'Administrative Block', ARRAY['projector', 'microphone', 'video_conferencing', 'air_conditioning'], 1000.00, true);

-- Sample Users (these need to be created through Supabase Auth first)
-- Students: 7-digit registration number + 8-digit password
-- 1234567 / 12345678 (student)
-- 2345678 / 23456789 (student)
-- 3456789 / 34567890 (student)

-- Organizers: 7-digit employee ID + 8-digit password  
-- 7654321 / 76543210 (organizer)
-- 8765432 / 87654321 (organizer)

-- Admin: admin / supersecret

-- After creating users through auth, insert their profile data
-- Note: Replace the user_id values with actual UUIDs from auth.users table

-- Sample user profiles (run after auth users are created)
INSERT INTO public.user_profiles (user_id, full_name, role, registration_number, employee_id, department, year_of_study, phone, created_at) VALUES
-- Students
('00000000-0000-0000-0000-000000000001', 'John Doe', 'student', '1234567', NULL, 'Computer Science', 3, '+91-9876543210', NOW()),
('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'student', '2345678', NULL, 'Electronics', 2, '+91-9876543211', NOW()),
('00000000-0000-0000-0000-000000000003', 'Mike Johnson', 'student', '3456789', NULL, 'Mechanical', 4, '+91-9876543212', NOW()),

-- Organizers
('00000000-0000-0000-0000-000000000004', 'Dr. Sarah Wilson', 'organizer', NULL, '7654321', 'Computer Science', NULL, '+91-9876543213', NOW()),
('00000000-0000-0000-0000-000000000005', 'Prof. David Brown', 'organizer', NULL, '8765432', 'Cultural Committee', NULL, '+91-9876543214', NOW()),

-- Admin
('00000000-0000-0000-0000-000000000006', 'System Administrator', 'admin', NULL, NULL, 'Administration', NULL, '+91-9876543215', NOW());

-- Sample events
INSERT INTO public.events (title, description, organizer_id, venue_id, event_date, start_time, end_time, max_participants, category, status, registration_deadline, created_at) VALUES
('AI & Machine Learning Workshop', 'Learn the fundamentals of AI and ML with hands-on coding sessions. Perfect for beginners and intermediate students.', '00000000-0000-0000-0000-000000000004', 2, '2024-03-15', '14:30:00', '17:30:00', 50, 'technical', 'approved', '2024-03-13', NOW()),
('Annual Cultural Fest - Expressions 2024', 'Join us for a spectacular evening of music, dance, drama, and art performances by talented students.', '00000000-0000-0000-0000-000000000005', 3, '2024-03-20', '18:00:00', '22:00:00', 500, 'cultural', 'approved', '2024-03-18', NOW()),
('Inter-College Basketball Tournament', 'Compete with the best teams from colleges across the city. Registration includes team organization.', '00000000-0000-0000-0000-000000000004', 4, '2024-03-22', '14:30:00', '18:00:00', 16, 'sports', 'pending', '2024-03-20', NOW()),
('Web Development Bootcamp', 'Intensive 3-day bootcamp covering modern web development technologies and frameworks.', '00000000-0000-0000-0000-000000000004', 2, '2024-03-25', '09:00:00', '17:00:00', 30, 'technical', 'approved', '2024-03-23', NOW());

-- Sample event registrations
INSERT INTO public.event_registrations (event_id, user_id, registration_date, status) VALUES
(1, '00000000-0000-0000-0000-000000000001', NOW(), 'confirmed'),
(1, '00000000-0000-0000-0000-000000000002', NOW(), 'confirmed'),
(2, '00000000-0000-0000-0000-000000000001', NOW(), 'confirmed'),
(2, '00000000-0000-0000-0000-000000000003', NOW(), 'confirmed'),
(4, '00000000-0000-0000-0000-000000000002', NOW(), 'confirmed');

-- Sample venue bookings
INSERT INTO public.venue_bookings (venue_id, event_id, booking_date, start_time, end_time, status, total_cost) VALUES
(2, 1, '2024-03-15', '14:30:00', '17:30:00', 'confirmed', 2400.00),
(3, 2, '2024-03-20', '18:00:00', '22:00:00', 'confirmed', 6000.00),
(4, 3, '2024-03-22', '14:30:00', '18:00:00', 'pending', 4800.00),
(2, 4, '2024-03-25', '09:00:00', '17:00:00', 'confirmed', 6400.00);
