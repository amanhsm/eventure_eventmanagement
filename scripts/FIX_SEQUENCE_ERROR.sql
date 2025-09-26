-- =============================================
-- FIX SEQUENCE ERROR
-- Creates the missing venue_booking_seq sequence
-- =============================================

-- Create the missing sequence
CREATE SEQUENCE IF NOT EXISTS venue_booking_seq START 1;

-- Verify sequence was created
SELECT 'venue_booking_seq sequence created successfully!' as status;

-- Test the sequence
SELECT 'VB-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(nextval('venue_booking_seq')::TEXT, 6, '0') as sample_booking_reference;

-- Reset sequence to 1 for clean start
ALTER SEQUENCE venue_booking_seq RESTART WITH 1;

SELECT 'Sequence reset to start from 1' as status;
