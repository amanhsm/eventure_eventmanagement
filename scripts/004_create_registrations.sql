-- Create event registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended', 'no_show')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  special_requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event registrations table
CREATE POLICY "registrations_select_own" ON public.event_registrations FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "registrations_insert_student" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'student'
  )
);
CREATE POLICY "registrations_update_own" ON public.event_registrations FOR UPDATE TO authenticated USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "registrations_delete_own" ON public.event_registrations FOR DELETE TO authenticated USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);
