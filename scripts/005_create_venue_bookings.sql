-- Create venue bookings table
CREATE TABLE IF NOT EXISTS public.venue_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  booking_purpose TEXT NOT NULL,
  special_requirements TEXT,
  admin_notes TEXT,
  total_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.venue_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venue bookings table
CREATE POLICY "bookings_select_own_or_admin" ON public.venue_bookings FOR SELECT TO authenticated USING (
  organizer_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "bookings_insert_organizer" ON public.venue_bookings FOR INSERT TO authenticated WITH CHECK (
  organizer_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'organizer'
  )
);
CREATE POLICY "bookings_update_own_or_admin" ON public.venue_bookings FOR UPDATE TO authenticated USING (
  organizer_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "bookings_delete_own_or_admin" ON public.venue_bookings FOR DELETE TO authenticated USING (
  organizer_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);
