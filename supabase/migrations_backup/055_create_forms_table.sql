-- Create forms table for brokerage forms library
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Listing Forms', 'Buyer Forms', 'Transaction Forms', 'Compliance Forms', 'Brokerage Operations', 'Misc')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS forms_category_idx ON public.forms(category);
CREATE INDEX IF NOT EXISTS forms_uploaded_by_idx ON public.forms(uploaded_by);

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view forms" ON public.forms;
DROP POLICY IF EXISTS "Only admins can insert forms" ON public.forms;
DROP POLICY IF EXISTS "Only admins can update forms" ON public.forms;
DROP POLICY IF EXISTS "Only admins can delete forms" ON public.forms;

-- Policy: Anyone authenticated can view forms
CREATE POLICY "Anyone can view forms"
  ON public.forms
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert forms
CREATE POLICY "Only admins can insert forms"
  ON public.forms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can update forms
CREATE POLICY "Only admins can update forms"
  ON public.forms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can delete forms
CREATE POLICY "Only admins can delete forms"
  ON public.forms
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE public.forms IS 'Brokerage forms library for agents - listing packets, buyer packets, compliance guides, etc.';
