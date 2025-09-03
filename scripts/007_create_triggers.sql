-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Extract user data from metadata
  INSERT INTO public.users (
    id,
    registration_number,
    employee_id,
    role,
    first_name,
    last_name,
    email,
    phone,
    department,
    year_of_study
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'registration_number', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'employee_id', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'department', NULL),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'year_of_study' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'year_of_study')::INTEGER 
      ELSE NULL 
    END
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update event participant count
CREATE OR REPLACE FUNCTION public.update_event_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events 
    SET current_participants = current_participants + 1 
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events 
    SET current_participants = current_participants - 1 
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for event registration count
DROP TRIGGER IF EXISTS update_participant_count ON public.event_registrations;
CREATE TRIGGER update_participant_count
  AFTER INSERT OR DELETE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_participant_count();
