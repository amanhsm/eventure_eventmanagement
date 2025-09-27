-- =============================================
-- QUICK FIX FOR NULL VALUES IN EVENTS
-- Simple solution to populate missing fields
-- =============================================

-- 1. Add missing columns if they don't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS eligibility_criteria TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_feedback TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS approved_by INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- 2. Update NULL values with defaults
UPDATE events SET 
    requirements = COALESCE(requirements, 'No special requirements'),
    eligibility_criteria = COALESCE(eligibility_criteria, 'Open to all students'),
    contact_person = COALESCE(contact_person, (
        SELECT name FROM organizers WHERE id = events.organizer_id
    )),
    contact_email = COALESCE(contact_email, (
        SELECT u.email 
        FROM organizers o 
        JOIN users u ON o.user_id = u.id 
        WHERE o.id = events.organizer_id
    )),
    priority = COALESCE(priority, 'medium'),
    registration_deadline = COALESCE(registration_deadline, 
        (event_date - INTERVAL '1 day')::timestamp with time zone
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE 
    requirements IS NULL 
    OR eligibility_criteria IS NULL 
    OR contact_person IS NULL 
    OR contact_email IS NULL 
    OR priority IS NULL 
    OR registration_deadline IS NULL;

-- 3. Create simple trigger for new events
CREATE OR REPLACE FUNCTION populate_event_defaults()
RETURNS TRIGGER AS $$
DECLARE
    org_name TEXT;
    org_email TEXT;
BEGIN
    -- Get organizer info
    SELECT o.name, u.email INTO org_name, org_email
    FROM organizers o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = NEW.organizer_id;
    
    -- Set defaults if NULL
    NEW.requirements = COALESCE(NEW.requirements, 'No special requirements');
    NEW.eligibility_criteria = COALESCE(NEW.eligibility_criteria, 'Open to all students');
    NEW.contact_person = COALESCE(NEW.contact_person, org_name);
    NEW.contact_email = COALESCE(NEW.contact_email, org_email);
    NEW.priority = COALESCE(NEW.priority, 'medium');
    
    IF NEW.registration_deadline IS NULL AND NEW.event_date IS NOT NULL THEN
        NEW.registration_deadline = (NEW.event_date - INTERVAL '1 day')::timestamp with time zone;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Apply trigger
DROP TRIGGER IF EXISTS populate_defaults_trigger ON events;
CREATE TRIGGER populate_defaults_trigger
    BEFORE INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION populate_event_defaults();

-- 5. Show results
SELECT 
    id,
    title,
    contact_person,
    contact_email,
    requirements,
    priority,
    registration_deadline::date as reg_deadline
FROM events 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'NULL values fixed! New events will auto-populate missing fields.' as status;
