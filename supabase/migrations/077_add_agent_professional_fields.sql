-- Add professional fields for agents
-- years_of_experience: Number of years the agent has been in real estate
-- nmls_number: National Mortgage Licensing System number

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
ADD COLUMN IF NOT EXISTS nmls_number VARCHAR(50);

-- Add comments to document the columns
COMMENT ON COLUMN public.users.years_of_experience IS 'Number of years of experience as a real estate agent';
COMMENT ON COLUMN public.users.nmls_number IS 'National Mortgage Licensing System (NMLS) identification number';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_years_of_experience
  ON public.users USING btree (years_of_experience)
  WHERE years_of_experience IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_nmls_number
  ON public.users USING btree (nmls_number)
  WHERE nmls_number IS NOT NULL;
