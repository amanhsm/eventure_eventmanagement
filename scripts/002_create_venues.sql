-- Create venues table
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL,
  location TEXT NOT NULL,
  facilities TEXT[], -- Array of facilities like 'projector', 'microphone', etc.
  hourly_rate DECIMAL(10,2),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venues table
CREATE POLICY "venues_select_all" ON public.venues FOR SELECT TO authenticated USING (true);
CREATE POLICY "venues_insert_organizer_admin" ON public.venues FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('organizer', 'admin')
  )
);
CREATE POLICY "venues_update_organizer_admin" ON public.venues FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('organizer', 'admin')
  )
);
CREATE POLICY "venues_delete_admin" ON public.venues FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  )
);
