-- Add professional title field for agents
-- title: Professional title (e.g., "LICENSED REALTOR", "BROKER ASSOCIATE", "REAL ESTATE ADVISOR")
-- Only admins can modify this field

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS title VARCHAR(100) DEFAULT 'LICENSED REALTOR';

-- Add comment to document the column
COMMENT ON COLUMN public.users.title IS 'Professional title for agents (admin-editable only)';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_title
  ON public.users USING btree (title)
  WHERE title IS NOT NULL;

-- Update existing users to have default title
UPDATE public.users
SET title = 'LICENSED REALTOR'
WHERE title IS NULL;
