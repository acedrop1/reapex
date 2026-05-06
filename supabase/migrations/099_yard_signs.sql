-- Yard Signs table for QR code sign management
CREATE TABLE IF NOT EXISTS public.yard_signs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  redirect_url TEXT,
  sign_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
  scan_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.yard_signs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage yard signs" ON public.yard_signs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Agents can view their yard signs" ON public.yard_signs
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Public can read active signs" ON public.yard_signs
  FOR SELECT USING (status = 'active');
