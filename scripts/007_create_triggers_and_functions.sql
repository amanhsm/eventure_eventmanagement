-- Function to update participant count when registration changes
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increase participant count
        UPDATE events 
        SET current_participants = current_participants + 1,
            updated_at = NOW()
        WHERE id = NEW.event_id;
        
        -- Increase student's registered events count
        UPDATE students 
        SET events_registered_count = events_registered_count + 1,
            updated_at = NOW()
        WHERE id = NEW.student_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrease participant count
        UPDATE events 
        SET current_participants = current_participants - 1,
            updated_at = NOW()
        WHERE id = OLD.event_id;
        
        -- Decrease student's registered events count
        UPDATE students 
        SET events_registered_count = events_registered_count - 1,
            updated_at = NOW()
        WHERE id = OLD.student_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for participant count updates
CREATE TRIGGER trigger_update_participant_count
    AFTER INSERT OR DELETE ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_event_participant_count();

-- Function to update organizer's event count
CREATE OR REPLACE FUNCTION update_organizer_event_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE organizers 
        SET events_created_count = events_created_count + 1,
            updated_at = NOW()
        WHERE id = NEW.organizer_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE organizers 
        SET events_created_count = events_created_count - 1,
            updated_at = NOW()
        WHERE id = OLD.organizer_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for organizer event count updates
CREATE TRIGGER trigger_update_organizer_event_count
    AFTER INSERT OR DELETE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_organizer_event_count();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_organizers_updated_at BEFORE UPDATE ON organizers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_registrations_updated_at BEFORE UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
