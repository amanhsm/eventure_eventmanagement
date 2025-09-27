-- =============================================
-- UPDATE EXISTING EVENTS WITH NULL FIELDS
-- Fill in missing values for existing events
-- =============================================

-- 1. First, ensure all required columns exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS eligibility_criteria TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_feedback TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES administrators(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium';
ALTER TABLE events ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- 2. Update existing events with NULL values
UPDATE events SET 
    -- Set default registration deadline if null (1 day before event)
    registration_deadline = CASE 
        WHEN registration_deadline IS NULL AND event_date IS NOT NULL 
        THEN (event_date - INTERVAL '1 day')::timestamp with time zone
        ELSE registration_deadline
    END,
    
    -- Set contact person from organizer name if null
    contact_person = CASE 
        WHEN contact_person IS NULL 
        THEN (SELECT name FROM organizers WHERE id = events.organizer_id)
        ELSE contact_person
    END,
    
    -- Set contact email from organizer's user email if null
    contact_email = CASE 
        WHEN contact_email IS NULL 
        THEN (
            SELECT u.email 
            FROM organizers o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.id = events.organizer_id
        )
        ELSE contact_email
    END,
    
    -- Set default priority if null
    priority = CASE 
        WHEN priority IS NULL THEN 'medium'
        ELSE priority
    END,
    
    -- Set default requirements if null
    requirements = CASE 
        WHEN requirements IS NULL THEN 'No special requirements'
        ELSE requirements
    END,
    
    -- Set default eligibility criteria if null
    eligibility_criteria = CASE 
        WHEN eligibility_criteria IS NULL THEN 'Open to all students'
        ELSE eligibility_criteria
    END,
    
    -- Update timestamp
    updated_at = CURRENT_TIMESTAMP

WHERE 
    -- Only update records that have null values
    registration_deadline IS NULL 
    OR contact_person IS NULL 
    OR contact_email IS NULL 
    OR priority IS NULL 
    OR requirements IS NULL 
    OR eligibility_criteria IS NULL;

-- 3. Create a trigger to auto-populate fields for new events
CREATE OR REPLACE FUNCTION auto_populate_event_fields()
RETURNS TRIGGER AS $$
DECLARE
    organizer_name TEXT;
    organizer_email TEXT;
BEGIN
    -- Get organizer details
    SELECT o.name, u.email INTO organizer_name, organizer_email
    FROM organizers o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = NEW.organizer_id;
    
    -- Auto-populate missing fields
    IF NEW.contact_person IS NULL OR NEW.contact_person = '' THEN
        NEW.contact_person = organizer_name;
    END IF;
    
    IF NEW.contact_email IS NULL OR NEW.contact_email = '' THEN
        NEW.contact_email = organizer_email;
    END IF;
    
    IF NEW.priority IS NULL THEN
        NEW.priority = 'medium';
    END IF;
    
    IF NEW.requirements IS NULL OR NEW.requirements = '' THEN
        NEW.requirements = 'No special requirements';
    END IF;
    
    IF NEW.eligibility_criteria IS NULL OR NEW.eligibility_criteria = '' THEN
        NEW.eligibility_criteria = 'Open to all students';
    END IF;
    
    -- Set default registration deadline if not provided
    IF NEW.registration_deadline IS NULL AND NEW.event_date IS NOT NULL THEN
        NEW.registration_deadline = (NEW.event_date - INTERVAL '1 day')::timestamp with time zone;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for new events
DROP TRIGGER IF EXISTS auto_populate_fields_trigger ON events;
CREATE TRIGGER auto_populate_fields_trigger
    BEFORE INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_event_fields();

-- 5. Show updated events
SELECT 
    id,
    title,
    CASE 
        WHEN contact_person IS NULL THEN 'NULL'
        ELSE contact_person
    END as contact_person,
    CASE 
        WHEN contact_email IS NULL THEN 'NULL'
        ELSE contact_email
    END as contact_email,
    CASE 
        WHEN priority IS NULL THEN 'NULL'
        ELSE priority
    END as priority,
    CASE 
        WHEN requirements IS NULL THEN 'NULL'
        ELSE LEFT(requirements, 30) || '...'
    END as requirements_preview,
    CASE 
        WHEN registration_deadline IS NULL THEN 'NULL'
        ELSE registration_deadline::date::text
    END as registration_deadline
FROM events 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'Existing events updated with default values!' as status;
SELECT 'New events will auto-populate missing fields' as note;
